from kolibri.core.auth.models import Classroom
from django.db.models import Q
from .models import PromotionQueue
from kolibri.core.logger.models import ExamLog
from kolibri.core.logger.models import ExamAttemptLog
from kolibri.core.auth.models import FacilityUser
from kolibri.core.logger import models as logger_models
from django.db.models import Q

ROLE_COACH = "coach"
ROLE_FACILTY_ADMIN = "facility"
STATUS_TO_BE_EXCLUDED_FOR_COACH =  ["APPROVED", "RECOMMENDED"]
STATUS_TO_BE_INCLUDED_FOR_ADMIN =  "RECOMMENDED"
PASS_SCORE = 10.0


def get_promotion_list(role, **kwargs):
    if role == ROLE_COACH:
        classroom_id = kwargs.get("classroom_id")
        query_promotion = PromotionQueue.objects.filter(classroom_id = classroom_id).filter(~Q( promotion_status__in = STATUS_TO_BE_EXCLUDED_FOR_COACH))
        return serialize_promotions(query_promotion)
    if role == ROLE_FACILTY_ADMIN:
        classroom_id = classroom_id = kwargs.get("classroom_id")
        query_promotion = PromotionQueue.objects.filter(classroom_id = classroom_id, promotion_status = STATUS_TO_BE_INCLUDED_FOR_ADMIN)
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
    if quiz_score < PASS_SCORE:
        pass
    user_queryset = FacilityUser.objects.filter(id=exam_log_data[0]["user"])
    user_data = serialize_user_data(user_queryset)
    classroom_query = Classroom.objects.filter(id = exam_data[0]["collection"])
    classroom_data = serialize_classroom_data(classroom_query)
    promotionQueue = PromotionQueue(
        learner_id = exam_log_data[0]["user"],
        learner_name = user_data[0]["full_name"],
        classroom_id = exam_data[0]["collection"],
        classroom_name = classroom_data[0]["name"],
        facility_id = classroom_data[0]["parent"],
        quiz_id = exam_data[0]["id"],
        quiz_name = exam_data[0]["title"],
        quiz_score = quiz_score,
        promotion_status = "REVIEW")
    promotionQueue.save()
 
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
    return queryset.values("name", "parent")       


def calculte_score(question_count, exam_attempt_data):
    correct_ans_count = sum(map(lambda x : x["correct"] == 1.0, exam_attempt_data))
    return correct_ans_count/question_count * 100.0
