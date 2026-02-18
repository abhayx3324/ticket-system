from django.db import models

class Ticket(models.Model):
    # Choices for fields to ensure data integrity
    CATEGORY_CHOICES = [
        ('billing', 'Billing'),
        ('technical', 'Technical'),
        ('account', 'Account'),
        ('general', 'General'),
    ]
    
    PRIORITY_CHOICES = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('critical', 'Critical'),
    ]

    STATUS_CHOICES = [
        ('open', 'Open'),
        ('in_progress', 'In Progress'),
        ('resolved', 'Resolved'),
        ('closed', 'Closed'),
    ]

    # Fields as per requirements
    title = models.CharField(max_length=200) # [cite: 9]
    description = models.TextField() # [cite: 9]
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES) # [cite: 9]
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES) # [cite: 9]
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='open') # [cite: 9]
    created_at = models.DateTimeField(auto_now_add=True) # [cite: 9]

    def __str__(self):
        return f"{self.title} ({self.status})"