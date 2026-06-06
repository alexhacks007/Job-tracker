from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils import timezone

class User(AbstractUser):
    role = models.CharField(max_length=50, default='user')
    avatar = models.TextField(null=True, blank=True)
    linkedin = models.TextField(null=True, blank=True)
    naukri = models.TextField(null=True, blank=True)
    workindia = models.TextField(null=True, blank=True)
    glassdoor = models.TextField(null=True, blank=True)
    portfolio = models.TextField(null=True, blank=True)
    last_active_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def get_permissions(self):
        # Fetch advanced permissions from user_roles -> role_permissions -> permissions
        perms = list(Permission.objects.filter(
            rolepermission__role__userrole__user=self
        ).values_list('name', flat=True).distinct())

        has_user_role = UserRole.objects.filter(user=self).exists()

        # If no user_role is assigned, try to match via string role or fallback
        if not has_user_role:
            perms = list(Permission.objects.filter(
                rolepermission__role__name=self.role
            ).values_list('name', flat=True).distinct())
            
            if not perms:
                if self.role in ['Super Admin', 'admin', 'Admin']:
                    perms = ['ALL']
                else:
                    perms = ['JOB_MANAGEMENT', 'TASK_MANAGEMENT', 'ANALYTICS_ACCESS']

        # Super Admin override
        if self.role in ['Super Admin', 'Admin', 'admin'] and 'ALL' not in perms:
            perms.append('ALL')

        return perms


    class Meta:
        db_table = 'users'

class Role(models.Model):
    name = models.CharField(max_length=255, unique=True)

    class Meta:
        db_table = 'roles'

class Permission(models.Model):
    name = models.CharField(max_length=255, unique=True)

    class Meta:
        db_table = 'permissions'

class RolePermission(models.Model):
    role = models.ForeignKey(Role, on_delete=models.CASCADE)
    permission = models.ForeignKey(Permission, on_delete=models.CASCADE)

    class Meta:
        db_table = 'role_permissions'
        unique_together = ('role', 'permission')

class UserRole(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    role = models.ForeignKey(Role, on_delete=models.CASCADE)

    class Meta:
        db_table = 'user_roles'
        unique_together = ('user', 'role')

class Company(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    name = models.CharField(max_length=255)
    mobile = models.CharField(max_length=50, null=True, blank=True)
    email = models.EmailField(max_length=255, null=True, blank=True)
    address = models.TextField(null=True, blank=True)
    website = models.URLField(max_length=255, null=True, blank=True)
    company_size = models.CharField(max_length=50, blank=True, null=True)
    company_type = models.CharField(max_length=50, blank=True, null=True)
    notes = models.TextField(null=True, blank=True)
    is_email_invalid = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'companies'

class Job(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    company_name = models.CharField(max_length=255)
    job_role = models.CharField(max_length=255)
    location = models.CharField(max_length=255, null=True, blank=True)
    salary = models.CharField(max_length=255, null=True, blank=True)
    status = models.CharField(max_length=50, default='Applied')
    applied_date = models.DateField(null=True, blank=True)
    interview_date = models.DateField(null=True, blank=True)
    interview_result = models.TextField(null=True, blank=True)
    notes = models.TextField(null=True, blank=True)
    platform = models.CharField(max_length=255, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'jobs'

class Todo(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    title = models.CharField(max_length=255)
    description = models.TextField(null=True, blank=True)
    company_id = models.IntegerField(null=True, blank=True)
    company_name = models.CharField(max_length=255, null=True, blank=True)
    priority = models.CharField(max_length=50, default='Medium')
    status = models.CharField(max_length=50, default='pending')
    start_date = models.DateField(null=True, blank=True)
    start_time = models.CharField(max_length=50, null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    end_time = models.CharField(max_length=50, null=True, blank=True)
    alert_enabled = models.BooleanField(default=False)
    alert_type = models.CharField(max_length=50, default='days_before')
    alert_days_before = models.IntegerField(default=1)
    alert_time = models.CharField(max_length=50, default='09:00')
    image = models.TextField(null=True, blank=True)
    tags = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'todos'

class UserGoal(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    target_applications = models.IntegerField(default=50)
    timeframe = models.CharField(max_length=50, default='monthly')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'user_goals'

class ActivityLog(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    action_type = models.CharField(max_length=255)
    action_details = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'activity_logs'

class Achievement(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    badge_name = models.CharField(max_length=255)
    description = models.TextField(null=True, blank=True)
    unlocked_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'achievements'

class BehaviorMetric(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    consistency_score = models.IntegerField(default=0)
    focus_score = models.IntegerField(default=0)
    drop_rate = models.IntegerField(default=0)
    action_speed = models.IntegerField(default=0)
    cognitive_load = models.IntegerField(default=0)
    mindset_profile = models.TextField(null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'behavior_metrics'

class AIInsight(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    insight_type = models.CharField(max_length=255)
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    generated_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'ai_insights'

class FeatureFlag(models.Model):
    flag_name = models.CharField(max_length=255, unique=True)
    is_active = models.BooleanField(default=False)

    class Meta:
        db_table = 'feature_flags'

class EmailTemplate(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    name = models.CharField(max_length=255)
    subject = models.CharField(max_length=255)
    body = models.TextField() # Supports variables like {{company_name}}
    resume = models.FileField(upload_to='resumes/', null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'email_templates'

class EmailCampaign(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    name = models.CharField(max_length=255)
    template = models.ForeignKey(EmailTemplate, on_delete=models.SET_NULL, null=True)
    status = models.CharField(max_length=50, default='Draft') # Draft, Running, Completed
    total_sent = models.IntegerField(default=0)
    total_failed = models.IntegerField(default=0)
    total_invalid = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'email_campaigns'

class EmailLog(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    campaign = models.ForeignKey(EmailCampaign, on_delete=models.CASCADE)
    company = models.ForeignKey(Company, on_delete=models.CASCADE)
    recipient_email = models.EmailField(max_length=255)
    status = models.CharField(max_length=50, default='Pending') # Pending, Sent, Failed, Invalid
    sent_at = models.DateTimeField(null=True, blank=True)
    error_message = models.TextField(null=True, blank=True)

    class Meta:
        db_table = 'email_logs'
