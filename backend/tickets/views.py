from rest_framework import viewsets, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.decorators import action
from django.db.models import Count, Q, Min, Max
from django.utils import timezone
from datetime import timedelta
from decimal import Decimal, ROUND_HALF_UP
from .models import Ticket
from .serializers import TicketSerializer
from .utils import classify_ticket, LLMConfigError, LLMResponseError, LLMError


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

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    def partial_update(self, request, *args, **kwargs):
        kwargs['partial'] = True
        return self.update(request, *args, **kwargs)


class TicketStatsView(APIView):
    def get(self, request):
        agg = Ticket.objects.aggregate(
            total_tickets=Count('id'),
            open_tickets=Count('id', filter=Q(status='open')),
            first_ticket_date=Min('created_at'),
            last_ticket_date=Max('created_at'),
        )

        total_tickets = agg['total_tickets']
        open_tickets = agg['open_tickets']

        avg_tickets_per_day = 0.0
        if total_tickets > 0 and agg['first_ticket_date'] and agg['last_ticket_date']:
            first_date = agg['first_ticket_date'].date()
            last_date = agg['last_ticket_date'].date()
            days_span = max((last_date - first_date).days + 1, 1)
            avg_tickets_per_day = round(total_tickets / days_span, 1)

        priority_rows = (
            Ticket.objects
            .values('priority')
            .annotate(count=Count('id'))
        )
        priority_breakdown = {p[0]: 0 for p in Ticket.PRIORITY_CHOICES}
        for row in priority_rows:
            priority_breakdown[row['priority']] = row['count']

        category_rows = (
            Ticket.objects
            .values('category')
            .annotate(count=Count('id'))
        )
        category_breakdown = {c[0]: 0 for c in Ticket.CATEGORY_CHOICES}
        for row in category_rows:
            category_breakdown[row['category']] = row['count']

        return Response({
            "total_tickets": total_tickets,
            "open_tickets": open_tickets,
            "avg_tickets_per_day": avg_tickets_per_day,
            "priority_breakdown": priority_breakdown,
            "category_breakdown": category_breakdown,
        })


class ClassifyTicketView(APIView):
    def post(self, request):
        description = request.data.get('description', '').strip()
        title = request.data.get('title', '').strip()

        if not description:
            return Response(
                {"error": "A non-empty 'description' field is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            suggestion = classify_ticket(title=title, description=description)
        except LLMConfigError as exc:
            return Response(
                {"error": str(exc)},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
        except LLMResponseError as exc:
            return Response(
                {"error": str(exc)},
                status=status.HTTP_502_BAD_GATEWAY,
            )
        except LLMError as exc:
            return Response(
                {"error": str(exc)},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        valid_categories = [c[0] for c in Ticket.CATEGORY_CHOICES]
        valid_priorities  = [p[0] for p in Ticket.PRIORITY_CHOICES]

        suggested_category = suggestion.get('suggested_category', '')
        suggested_priority = suggestion.get('suggested_priority', '')

        if suggested_category not in valid_categories:
            return Response(
                {"error": f"LLM returned an unrecognised category: '{suggested_category}'."},
                status=status.HTTP_502_BAD_GATEWAY,
            )
        if suggested_priority not in valid_priorities:
            return Response(
                {"error": f"LLM returned an unrecognised priority: '{suggested_priority}'."},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        return Response({
            "suggested_category": suggested_category,
            "suggested_priority": suggested_priority,
        })