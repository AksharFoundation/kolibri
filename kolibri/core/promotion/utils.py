from django.db.models.query import QuerySet
from kolibri.core import content
from kolibri.core.auth.models import Classroom, Collection
from django.db.models import Q
from .models import PromotionQueue
from kolibri.core.logger.models import ExamLog
from kolibri.core.logger.models import ExamAttemptLog
from kolibri.core.lessons.models import Lesson
from kolibri.core.logger.models import ContentSummaryLog
from kolibri.core.auth.models import FacilityUser
from kolibri.core.auth.models import FacilityDataset
from kolibri.core.logger import models as logger_models
from django.db.models import Q
from django.utils import timezone

ROLE_COACH = "coach"
ROLE_FACILTY_ADMIN = "facility"
ROLE_LEARNER = "learner"
STATUS_TO_BE_EXCLUDED_FOR_COACH =  ["APPROVED", "LESSONS_PENDING"]
STATUS_TO_BE_INCLUDED_FOR_ADMIN =  "RECOMMENDED"
STATUS_TO_BE_INCLUDED_FOR_LEARNER =  "LESSONS_PENDING"
COLLECTION_KIND_FACILITY = 'facility'

def get_promotion_list(role, **kwargs):
    if role == ROLE_COACH:
        classroom_id = kwargs.get("classroom_id")
        query_promotion = PromotionQueue.objects.filter(classroom_id = classroom_id).filter(~Q( promotion_status__in = STATUS_TO_BE_EXCLUDED_FOR_COACH))
        return serialize_promotions(query_promotion)
    if role == ROLE_FACILTY_ADMIN:
        classroom_id = classroom_id = kwargs.get("classroom_id")
        query_promotion = PromotionQueue.objects.filter(classroom_id = classroom_id, promotion_status = STATUS_TO_BE_INCLUDED_FOR_ADMIN)
        return serialize_promotions(query_promotion)
    if role == ROLE_LEARNER:
         learner_id = kwargs.get("learner_id")
         classroom_id = classroom_id = kwargs.get("classroom_id")
         time_threshold = timezone.now() - timezone.timedelta(hours=240)
         query_promotion = PromotionQueue.objects.filter(learner_id = learner_id, classroom_id = classroom_id, update_timestamp__gt = time_threshold)
         return serialize_promotions(query_promotion)



def serialize_promotions(queryset):
    return list(queryset.values(
            "id", 
            "learner_id", 
            "learner_name",
            "classroom_id",
            "classroom_name",
            "facility_id",
            "quiz_id",
            "quiz_name",
            "quiz_score",
            "lesson_completion",
            "promotion_status",
            "coach_approver",
            "admin_approver",
            "create_timestamp",
            "update_timestamp"))         


def create_new_promotion_entry(exam_log_id, request):
    query_exam_log = ExamLog.objects.filter(id=exam_log_id)
    exam_attempt_data = serialize_exam_attempt(ExamAttemptLog.objects.filter(examlog = query_exam_log))
    exam_log_data = serialize_exam_log(query_exam_log)
    exam_queryset = logger_models.Exam.objects.filter(id=exam_log_data[0]["exam"])
    exam_data = serialize_exam_data(exam_queryset)
    quiz_score = calculte_score(exam_data[0]["question_count"], exam_attempt_data)
   
    promotion_status = "REVIEW"    
    user_queryset = FacilityUser.objects.filter(id=exam_log_data[0]["user"])
    user_data = serialize_user_data(user_queryset)
    classroom_query = Classroom.objects.filter(id = exam_data[0]["collection"])
    classroom_data = serialize_classroom_data(classroom_query)
    facility_id = classroom_data[0]["parent"]
    if quiz_score < get_exam_pass_score(facility_id):
        return
    lesson_completion = get_lesson_completion_score(exam_data[0]["collection"], exam_log_data[0]["user"])
    if lesson_completion < get_required_lesson_completion_score(facility_id):
        promotion_status = "LESSONS_PENDING"
    PromotionQueue.objects.update_or_create(
        learner_id = exam_log_data[0]["user"],
        quiz_id = exam_data[0]["id"],
        classroom_id = exam_data[0]["collection"],
        facility_id =facility_id,   
        defaults={
            'learner_name' : user_data[0]["full_name"], 
            'classroom_name' : classroom_data[0]["name"],
            'quiz_name' : exam_data[0]["title"],
            'quiz_score' : quiz_score,
            'lesson_completion' : lesson_completion,
            'promotion_status' : promotion_status,
            'coach_approver' : None
        },
    )
 
def serialize_exam_log(queryset):
    return queryset.values("exam", "user")

def serialize_exam_attempt(queryset):
    return list(
        queryset.values("correct")
    )    

def serialize_exam_data(queryset):
    return queryset.values(
                "id",
                "title",
                "question_count",
                "collection",
                "collection_id"
            )
def serialize_user_data(queryset):
    return queryset.values("full_name")        

def serialize_classroom_data(queryset):
    return queryset.values("name", "parent", "id")       


def calculte_score(question_count, exam_attempt_data):
    correct_ans_count = sum(map(lambda x : x["correct"] == 1.0, exam_attempt_data))
    if correct_ans_count == 0:
        return 0.0
    return correct_ans_count/question_count * 100.0


def promotion_entry_already_exists(quiz_id, learner_id, classroom_id, facility_id):
        return PromotionQueue.objects.filter(quiz_id = quiz_id, 
        learner_id = learner_id, 
        classroom_id = 
        classroom_id, 
        facility_id = facility_id)         

def get_next_classroom_id(classroom):
    next_classroom_name = __get_next_classroom_name(classroom)   
    classroom_query = Classroom.objects.filter(name =  next_classroom_name)    
    if not classroom_query:
        return None   
    classroom_data = serialize_classroom_data(classroom_query)
    return classroom_data[0]["id"]

def __get_next_classroom_name(classroom):
    arr = classroom.rsplit(' ', 1)
    subject_name = arr[0]
    next_class_level = int(arr[1]) + 1
    return subject_name + " " + str(next_class_level)  

def get_lesson_completion_score(classroom_id, learner_id):
    lessons = Lesson.objects.filter(
                lesson_assignments__collection__membership__user=learner_id,
                is_active=True,
                collection = classroom_id).distinct().values(
                "resources", 
            )
    # if lessons are not assigned, set lesson completion as 100        
    if not lessons:
        return 100.0 
    lesson_content_ids = set()
    for lesson in lessons:
        lesson_content_ids |= set(
                (resource["content_id"] for resource in lesson["resources"])
            )          
    progress_map = {
            l["content_id"]: l["progress"]
            for l in ContentSummaryLog.objects.filter(
                content_id__in=lesson_content_ids, user=learner_id
            ).values("content_id", "progress")
        } 
    count_of_contents = len(lesson_content_ids)
    total_progress_score =  sum(progress_map[content_id] for content_id in progress_map)
    lesson_completion_score = (total_progress_score/count_of_contents) * 100   
    return lesson_completion_score   

def update_lesson_completion_score(content_id, progress, learner_id, facility_id):
    reqd_lesson_completion = get_required_lesson_completion_score(facility_id)
    normalised_reqd_score = reqd_lesson_completion/100
    if progress < normalised_reqd_score:
        return
    classroom_id = get_classroom_id(content_id, learner_id)

    # Not throwing error since the main flows shouldnt be affected
    if classroom_id is None:
        return

    lesson_completion_score = get_lesson_completion_score(classroom_id, learner_id)
    if lesson_completion_score >= reqd_lesson_completion:
        PromotionQueue.objects.filter(learner_id = learner_id, classroom_id = classroom_id).update(lesson_completion = lesson_completion_score,promotion_status="REVIEW")  


def get_classroom_id(content_id, learner_id):
    lessons = Lesson.objects.filter(lesson_assignments__collection__membership__user=learner_id,
                is_active=True,).distinct().values("resources", "collection")  

    for lesson in lessons:
        for resource in lesson["resources"]:
            if resource['content_id'] == content_id:
                return lesson['collection']

def get_facility_dataset(facility_id):
    dataset = FacilityDataset.objects.filter(
            collection__kind=COLLECTION_KIND_FACILITY,
            collection__id=facility_id
        ).distinct().values("learner_promotion_required_quiz_score", "learner_promotion_required_lesson_score")  
    return dataset          


def get_exam_pass_score(facility_id):
    queryset = get_facility_dataset(facility_id)
    return queryset[0]['learner_promotion_required_quiz_score']

def get_required_lesson_completion_score(facility_id):
    queryset = get_facility_dataset(facility_id)
    return queryset[0]['learner_promotion_required_lesson_score']