from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import TicketViewSet, TicketStatsView, ClassifyTicketView

router = DefaultRouter()
router.register(r'tickets', TicketViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('tickets/stats/', TicketStatsView.as_view(), name='ticket-stats'), # [cite: 13]
    path('tickets/classify/', ClassifyTicketView.as_view(), name='ticket-classify'), # [cite: 13]
]