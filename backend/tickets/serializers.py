from rest_framework import serializers
from .models import Ticket


class TicketSerializer(serializers.ModelSerializer):
    class Meta:
        model = Ticket
        fields = '__all__'
        read_only_fields = ('id', 'created_at')

    def validate_category(self, value):
        valid = [c[0] for c in Ticket.CATEGORY_CHOICES]
        if value not in valid:
            raise serializers.ValidationError(
                f"Invalid category. Must be one of: {', '.join(valid)}"
            )
        return value

    def validate_priority(self, value):
        valid = [p[0] for p in Ticket.PRIORITY_CHOICES]
        if value not in valid:
            raise serializers.ValidationError(
                f"Invalid priority. Must be one of: {', '.join(valid)}"
            )
        return value

    def validate_status(self, value):
        valid = [s[0] for s in Ticket.STATUS_CHOICES]
        if value not in valid:
            raise serializers.ValidationError(
                f"Invalid status. Must be one of: {', '.join(valid)}"
            )

        # On update (PATCH/PUT): enforce staged transitions
        if self.instance:
            NEXT_STATUS = {
                'open':        'in_progress',
                'in_progress': 'resolved',
                'resolved':    'closed',
                'closed':      None,
            }
            current = self.instance.status
            allowed_next = NEXT_STATUS.get(current)

            if value != current:
                if current == 'closed':
                    raise serializers.ValidationError(
                        "This ticket is closed and cannot be updated."
                    )
                if value != allowed_next:
                    raise serializers.ValidationError(
                        f"Status can only advance from '{current}' to '{allowed_next}'. "
                        f"Cannot jump directly to '{value}'."
                    )

        return value