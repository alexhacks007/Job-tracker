from django.contrib import admin
from .models import User, Role, Permission, RolePermission, UserRole, Company, Job, Todo, EmailTemplate, EmailCampaign, EmailLog

admin.site.register(User)
admin.site.register(Role)
admin.site.register(Permission)
admin.site.register(RolePermission)
admin.site.register(UserRole)
admin.site.register(Company)
admin.site.register(Job)
admin.site.register(Todo)
admin.site.register(EmailTemplate)
admin.site.register(EmailCampaign)

@admin.register(EmailLog)
class EmailLogAdmin(admin.ModelAdmin):
    list_display = ('recipient_email', 'status', 'sent_at', 'error_message')
    list_filter = ('status',)
