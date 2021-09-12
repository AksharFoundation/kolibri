from django.db.models import Q
from .models import PromotionQueue

ROLE_COACH = "coach"
ROLE_FACILTY_ADMIN = "facility"
STATUS_TO_BE_EXCLUDED_FOR_COACH =  ["APPROVED", "RECOMMENDED"]
STATUS_TO_BE_INCLUDED_FOR_ADMIN =  "RECOMMENDED"

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
