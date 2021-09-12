from django.conf.urls import include
from django.conf.urls import url
from rest_framework import routers
from .api import PromotionViewSet

router = routers.SimpleRouter()
router.register(
    r"", PromotionViewSet, base_name="promotion"
)

urlpatterns = [url(
                  r"^", 
                  include(router.urls)
               ),
        ]