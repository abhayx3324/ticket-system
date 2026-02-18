from rest_framework import viewsets, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.decorators import action
from django.db.models import Count, Q
from .models import Ticket
from .serializers import TicketSerializer
from .utils import classify_ticket

class TicketViewSet(viewsets.ModelViewSet):
    queryset = Ticket.objects.all().order_by('-created_at')
    serializer_class = TicketSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        category = self.request.query_params.get('category')
        priority = self.request.query_params.get('priority')
        status_param = self.request.query_params.get('status')
        search = self.request.query_params.get('search')

        if category:
            queryset = queryset.filter(category=category)
        if priority:
            queryset = queryset.filter(priority=priority)
        if status_param:
            queryset = queryset.filter(status=status_param)
        if search:
            queryset = queryset.filter(
                Q(title__icontains=search) | Q(description__icontains=search)
            )
        return queryset

class TicketStatsView(APIView):
    def get(self, request):
        total_tickets = Ticket.objects.count()
        open_tickets = Ticket.objects.filter(status='open').count()
        
        priority_data = Ticket.objects.values('priority').annotate(count=Count('id'))
        category_data = Ticket.objects.values('category').annotate(count=Count('id'))

        priority_breakdown = {item['priority']: item['count'] for item in priority_data}
        category_breakdown = {item['category']: item['count'] for item in category_data}

        for p, _ in Ticket.PRIORITY_CHOICES:
            priority_breakdown.setdefault(p, 0)
        for c, _ in Ticket.CATEGORY_CHOICES:
            category_breakdown.setdefault(c, 0)

        return Response({
            "total_tickets": total_tickets,
            "open_tickets": open_tickets,
            "priority_breakdown": priority_breakdown,
            "category_breakdown": category_breakdown
        })

class ClassifyTicketView(APIView):
    def post(self, request):
        description = request.data.get('description', '')
        if not description:
            return Response({"error": "Description required"}, status=400)
            
        suggestion = classify_ticket(description)
        
        if not suggestion:
            return Response({"suggested_category": "", "suggested_priority": ""})
            
        return Response(suggestion)