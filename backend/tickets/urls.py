from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import TicketViewSet, TicketStatsView, ClassifyTicketView

router = DefaultRouter()
router.register(r'tickets', TicketViewSet)

urlpatterns = [
    # Custom paths MUST come before router.urls to avoid the router
    # intercepting them as a ticket pk lookup (e.g. pk="stats")
    path('tickets/stats/', TicketStatsView.as_view(), name='ticket-stats'),
    path('tickets/classify/', ClassifyTicketView.as_view(), name='ticket-classify'),
    path('', include(router.urls)),
]