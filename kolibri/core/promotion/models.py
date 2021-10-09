"""
This is the model used to create promotion tracking entries that are calculated based on
a learner's performance in a quiz. 
"""
from enum import Enum, unique
from django.db import models
from morango.models import UUIDField

from kolibri.core.auth.constants import role_kinds
from kolibri.core.auth.permissions.base import RoleBasedPermissions
from kolibri.core.fields import DateTimeTzField
from kolibri.utils.time_utils import local_now


class PromotionStatus(Enum):
    #Required lessons are not completed for the class
    LESSONS_PENDING = "lessons_pending"
    #A new created promotion tracking entry
    REVIEW = "Review"
    #A promotion thats approved by a coach 
    RECOMMENDED = "Recommended"
    #A promotion that was not approved by a facility admin
    CANCELLED = "Cancelled"
    #A fully approved promotion, approved by both coach as well as a facility admin
    APPROVED = "Approved"

    @classmethod
    def choices(cls):
        print(tuple((i.name, i.value) for i in cls))
        return tuple((i.name, i.value) for i in cls)

class PromotionQueue(models.Model):  
    # Morango syncing settings
    morango_model_name = "PromotionQueue"
    permissions = (
        RoleBasedPermissions(
            target_field="collection",  
            can_be_created_by=(role_kinds.ADMIN, role_kinds.COACH),
            can_be_read_by=(role_kinds.ADMIN, role_kinds.COACH),
            can_be_updated_by=(role_kinds.ADMIN, role_kinds.COACH),
            can_be_deleted_by=(role_kinds.ADMIN, role_kinds.COACH),
        )
    )
    id = (
        models.AutoField(
            auto_created=True, primary_key=True, serialize=True, verbose_name="ID"
        ),
    )  
    #learner_id for whom the promotion tracker is created
    learner_id = UUIDField(null=False, unique=False)
    #the name of the learner
    learner_name = models.CharField(max_length=200)
    #classroom_id of the class for which the promotion tracker is created
    classroom_id = UUIDField(null=False, unique=False) 
    #classroom name
    classroom_name =  models.CharField(max_length=100)
    #the facilit_id
    facility_id = UUIDField(null=False, unique=False) 
    #the quiz after which the promotion tracker is created
    quiz_id = UUIDField(null=False, unique=False)
    #the name of the quiz as given by the coach
    quiz_name = models.CharField(max_length=200)
    #the score in the quiz
    quiz_score = models.IntegerField(null=True)
    #Percentage of lessons completed by the learner
    lesson_completion = models.FloatField(null=True)
    #the status of the promotion
    promotion_status = models.CharField(
        max_length=100, choices=PromotionStatus.choices(), blank=False
    )
    #the name of the coach approver
    coach_approver = models.CharField(max_length=200, null=True)
    #the name of the facility admin approver
    admin_approver = models.CharField(max_length=200, null=True)
    #timestamp when the promotion tracker entry is created
    create_timestamp = DateTimeTzField(default=local_now)
    #timestamp of the last update that's done on the promotion tracker entry
    update_timestamp = DateTimeTzField(default=local_now)