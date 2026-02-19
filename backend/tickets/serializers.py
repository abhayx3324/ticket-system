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
        return value