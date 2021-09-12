from datetime import date
from rest_framework import permissions
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from rest_framework.mixins import CreateModelMixin
from rest_framework.mixins import ListModelMixin
from rest_framework.response import Response
from rest_framework import status

from .models import PromotionQueue
from .serializer import PromotionQueueSerializer
from kolibri.core.auth.models import Collection
from kolibri.core.auth.constants import role_kinds


class PromotionQueuePermissions(permissions.BasePermission):
    """
    List - check if requester has coach/admin permissions.
    Detail - check if requester has permissions to view the promotion review list.
    """
    def has_permission(self, request, view):     
        classroom_id = view.kwargs.get("classroom_id")
        allowed_roles = [role_kinds.ADMIN, role_kinds.COACH]
        try:
            return request.user.has_role_for(
                allowed_roles, Collection.objects.get(pk=classroom_id)
            )
        except (Collection.DoesNotExist, ValueError):
            return False

class PromotionViewSet(CreateModelMixin, ListModelMixin, viewsets.GenericViewSet):
    ## should be allowed only for coach or admin
    permission_classes = (IsAuthenticated,)
    queryset = PromotionQueue.objects.all()
    serializer_class = PromotionQueueSerializer
    ordering = ('classroom_id', 'create_timestamp', 'promotion_status')

    def create(self, request, *args, **kwargs):
        is_many = isinstance(request.data, list)
        ## handle single item requests
        if not is_many:
            if "id" not in request.data:
                return self.handle_create(request, *args, **kwargs)
            else:
                return self.handle_update(request)
        ## handle multi items (list) requests        
        else:
            create_request = True
            for obj in request.data:
                if "id" in obj:
                    create_request = False
            if create_request:
                return self.handle_create(request, *args, **kwargs)
            else:
                return self.handle_update(request)

    
    def handle_create(self, request, *args, **kwargs):
        serialized = self.get_serializer(data=request.data, many=isinstance(request.data, list))
        serialized.is_valid(raise_exception=True)
        self.perform_create(serialized)
        headers = self.get_success_headers(serialized.data)
        return Response(serialized.data, status=status.HTTP_201_CREATED, headers=headers)

    def _perform_update(self, data, id):
        PromotionQueue.objects.filter(pk = id).update(**data)

    def handle_update(self, request):   
        data = request.data
        for val in data:
            id = val["id"]
            serialized = self.get_serializer(data=val, many=False)
            serialized.is_valid(raise_exception=True)
            self._perform_update(serialized.validated_data, id)
        return Response(serialized.data, status=status.HTTP_200_OK) 
             



    