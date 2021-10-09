from kolibri.core.serializers import KolibriModelSerializer
from .models import PromotionQueue


class PromotionQueueSerializer(KolibriModelSerializer):

    class Meta:
        model = PromotionQueue
        fields = (
            "id",
            "learner_id",
            "learner_name",
            "classroom_name",
            "classroom_id",
            "facility_id",
            "quiz_id",
            "quiz_name",
            "quiz_score",
            "lesson_completion",
            "promotion_status",
            "coach_approver",
            "admin_approver",
            "create_timestamp",
            "update_timestamp",
        )

