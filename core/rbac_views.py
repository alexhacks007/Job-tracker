from rest_framework import status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.decorators import api_view, permission_classes
from .models import Role, Permission, RolePermission, UserRole, User, ActivityLog, Job, Todo, AIInsight, Company, Achievement
from .serializers import UserSerializer
from django.db import models
from django.db.models import Count, Max, Q
from django.utils import timezone
import collections
from datetime import timedelta

class IsAdminOrSuperAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        role = getattr(request.user, 'role', '').lower()
        return role in ['admin', 'super admin']

class RBACSeedView(APIView):
    permission_classes = [IsAdminOrSuperAdmin]
    
    def post(self, request):
        roles = ['Super Admin', 'Admin', 'Moderator', 'Premium User', 'User', 'Guest']
        perms_list = ['USER_MANAGEMENT', 'JOB_MANAGEMENT', 'TASK_MANAGEMENT', 'ANALYTICS_ACCESS', 'AI_INSIGHTS', 'BEHAVIOR_TRACKING', 'SYSTEM_CONTROL', 'SECURITY_CONTROL', 'EMAIL_CAMPAIGNS']

        for r_name in roles:
            Role.objects.get_or_create(name=r_name)
        
        for p_name in perms_list:
            Permission.objects.get_or_create(name=p_name)

        super_admin = Role.objects.get(name='Super Admin')
        all_perms = Permission.objects.all()
        for p in all_perms:
            RolePermission.objects.get_or_create(role=super_admin, permission=p)

        user_role = Role.objects.get(name='User')
        basic_perms = Permission.objects.filter(name__in=['JOB_MANAGEMENT', 'TASK_MANAGEMENT', 'ANALYTICS_ACCESS'])
        for p in basic_perms:
            RolePermission.objects.get_or_create(role=user_role, permission=p)

        admin_role = Role.objects.get(name='Admin')
        admin_perms = Permission.objects.exclude(name__in=['BEHAVIOR_TRACKING', 'SECURITY_CONTROL'])
        for p in admin_perms:
            RolePermission.objects.get_or_create(role=admin_role, permission=p)

        return Response({"message": "Seeded successfully"})

class RBACDataView(APIView):
    permission_classes = [IsAdminOrSuperAdmin]

    def get(self, request):
        roles = Role.objects.all().values()
        permissions = Permission.objects.all().values()
        role_permissions = RolePermission.objects.all().values()
        
        users = User.objects.all()
        user_list = []
        for u in users:
            advanced_roles = list(UserRole.objects.filter(user=u).values_list('role_id', flat=True))
            user_list.append({
                "id": u.id,
                "name": u.username,
                "email": u.email,
                "role": u.role,
                "advancedRoles": advanced_roles
            })

        return Response({
            "roles": list(roles),
            "permissions": list(permissions),
            "role_permissions": list(role_permissions),
            "users": user_list
        })

class AssignRoleView(APIView):
    permission_classes = [IsAdminOrSuperAdmin]

    def post(self, request):
        user_id = request.data.get('user_id')
        role_id = request.data.get('role_id')
        
        if not user_id or not role_id:
            return Response({"message": "Missing fields"}, status=status.HTTP_400_BAD_REQUEST)
        
        user = User.objects.get(id=user_id)
        role = Role.objects.get(id=role_id)
        
        UserRole.objects.filter(user=user).delete()
        UserRole.objects.create(user=user, role=role)
        
        user.role = 'admin' if role.name.lower() == 'admin' else role.name
        user.save()
        
        return Response({"message": "Role assigned successfully"})

class RolePermissionsUpdateView(APIView):
    permission_classes = [IsAdminOrSuperAdmin]

    def post(self, request):
        role_id = request.data.get('role_id')
        permission_ids = request.data.get('permission_ids')
        
        if not role_id or not isinstance(permission_ids, list):
            return Response({"message": "Missing fields"}, status=status.HTTP_400_BAD_REQUEST)
        
        role = Role.objects.get(id=role_id)
        RolePermission.objects.filter(role=role).delete()
        
        for p_id in permission_ids:
            perm = Permission.objects.get(id=p_id)
            RolePermission.objects.create(role=role, permission=perm)
            
        return Response({"message": "Permissions updated successfully"})

class RBACAnalyticsView(APIView):
    permission_classes = [IsAdminOrSuperAdmin]

    def get(self, request):
        role_stats = Role.objects.annotate(count=Count('userrole')).values('name', 'count')
        perm_stats = Role.objects.annotate(count=Count('rolepermission')).values('name', 'count')
        
        recent_events = [
            { "id": 1, "action": "Role assigned", "user": "Admin", "target": "John Doe", "time": (timezone.now() - timedelta(hours=1)).isoformat() },
            { "id": 2, "action": "Permission created", "user": "Super Admin", "target": "DATA_EXPORT", "time": (timezone.now() - timedelta(hours=2)).isoformat() },
            { "id": 3, "action": "Matrix updated", "user": "Admin", "target": "Moderator Role", "time": (timezone.now() - timedelta(days=1)).isoformat() },
            { "id": 4, "action": "Security Seed", "user": "System", "target": "All Default Roles", "time": (timezone.now() - timedelta(days=2)).isoformat() }
        ]
        
        return Response({
            "roleDistribution": list(role_stats),
            "permissionDistribution": list(perm_stats),
            "recentEvents": recent_events
        })

class UserActivityListView(APIView):
    permission_classes = [IsAdminOrSuperAdmin]

    def get(self, request):
        users = User.objects.all()
        result = []
        for u in users:
            advanced_role = UserRole.objects.filter(user=u).first()
            last_login = ActivityLog.objects.filter(user=u, action_type='login').aggregate(Max('created_at'))['created_at__max']
            
            actions_taken = (
                Job.objects.filter(user=u).count() +
                Todo.objects.filter(user=u).count() +
                ActivityLog.objects.filter(user=u).count()
            )
            
            is_online = False
            if u.last_active_at:
                is_online = (timezone.now() - u.last_active_at).total_seconds() < 300

            result.append({
                "id": u.id,
                "name": u.username,
                "email": u.email,
                "role": u.role,
                "created_at": u.created_at,
                "last_active_at": u.last_active_at,
                "advancedRoleName": advanced_role.role.name if advanced_role else u.role,
                "lastLogin": last_login or u.created_at,
                "actionsTaken": actions_taken,
                "isOnline": is_online
            })
        return Response(result)

class AdminUserManagementView(APIView):
    permission_classes = [IsAdminOrSuperAdmin]

    def post(self, request):
        name = request.data.get('name')
        email = request.data.get('email')
        password = request.data.get('password')
        role_id = request.data.get('role_id')
        
        if not name or not email or not password:
            return Response({"message": "Missing fields"}, status=status.HTTP_400_BAD_REQUEST)
        
        user = User.objects.create_user(username=name, email=email, password=password)
        if role_id:
            role = Role.objects.get(id=role_id)
            UserRole.objects.create(user=user, role=role)
            user.role = role.name
            user.save()
            
        return Response({"message": "User created securely", "id": user.id})

    def delete(self, request, pk):
        if str(request.user.id) == str(pk):
            return Response({"message": "Cannot delete yourself."}, status=status.HTTP_400_BAD_REQUEST)
        
        User.objects.filter(id=pk).delete()
        return Response({"message": "Identity fully scrubbed from the system"})

class UserFullProfileView(APIView):
    permission_classes = [IsAdminOrSuperAdmin]

    def get(self, request, pk):
        try:
            user = User.objects.get(id=pk)
        except User.DoesNotExist:
            return Response({"message": "User not found"}, status=status.HTTP_404_NOT_FOUND)

        last_login = ActivityLog.objects.filter(user=user, action_type='login').aggregate(Max('created_at'))['created_at__max']
        
        is_online = False
        if user.last_active_at:
            is_online = (timezone.now() - user.last_active_at).total_seconds() < 300

        # Timeline
        log_entries = ActivityLog.objects.filter(user=user).values('action_details', 'created_at').annotate(source=models.Value('login', output_field=models.CharField()))
        job_entries = Job.objects.filter(user=user).values('company_name', 'job_role', 'status', 'created_at')
        todo_entries = Todo.objects.filter(user=user).values('title', 'created_at')
        
        timeline = []
        for l in log_entries:
            timeline.append({"source": "login", "detail": l['action_details'], "created_at": l['created_at']})
        for j in job_entries:
            timeline.append({"source": "job", "detail": f"Job track: {j['company_name']} ({j['job_role']}) - {j['status']}", "created_at": j['created_at']})
        for t in todo_entries:
            timeline.append({"source": "todo", "detail": f"Task added: {t['title']}", "created_at": t['created_at']})
        
        timeline.sort(key=lambda x: x['created_at'], reverse=True)

        job_stats = Job.objects.filter(user=user).values('status').annotate(count=Count('id'))
        ai_insights = AIInsight.objects.filter(user=user).order_by('-generated_at')[:5].values('insight_type', 'message', 'generated_at')

        total_jobs = Job.objects.filter(user=user).count()
        total_todos = Todo.objects.filter(user=user).count()
        
        rejected_jobs = Job.objects.filter(user=user, status__in=['Rejected', 'Archived']).count()
        active_jobs = Job.objects.filter(user=user, status__in=['Applied', 'Interview', 'Offer']).count()
        
        drop_rate = (rejected_jobs / total_jobs * 100) if total_jobs > 0 else 0
        consistency = min((len(timeline) / 30 * 100), 100)
        focus = min((total_todos / active_jobs * 50), 100) if active_jobs > 0 else 50
        cognitive_load = min(active_jobs * 5, 100)
        speed = min((total_jobs + total_todos) * 2, 100)

        # Heatmap Data (Last 180 days)
        end_date = timezone.now().date()
        start_date = end_date - timedelta(days=179)
        
        activity_dates = []
        activity_dates.extend(Job.objects.filter(user=user, created_at__date__gte=start_date).values_list('created_at__date', flat=True))
        activity_dates.extend(Todo.objects.filter(user=user, created_at__date__gte=start_date).values_list('created_at__date', flat=True))
        activity_dates.extend(ActivityLog.objects.filter(user=user, created_at__date__gte=start_date).values_list('created_at__date', flat=True))
        
        date_counts = collections.Counter(activity_dates)
        heatmap_data = []
        curr = start_date
        while curr <= end_date:
            heatmap_data.append({"date": curr.isoformat(), "count": date_counts.get(curr, 0)})
            curr += timedelta(days=1)

        # Pipeline Trend (Last 30 days)
        trend_start = end_date - timedelta(days=29)
        job_dates = Job.objects.filter(user=user, created_at__date__gte=trend_start).values_list('created_at__date', flat=True)
        job_counts = collections.Counter(job_dates)
        pipeline_trend = []
        curr = trend_start
        while curr <= end_date:
            pipeline_trend.append({"date": curr.isoformat(), "count": job_counts.get(curr, 0)})
            curr += timedelta(days=1)

        risk_score = "LOW"
        if drop_rate > 60 and consistency < 20: risk_score = "HIGH"
        elif drop_rate > 40 or consistency < 40: risk_score = "MEDIUM"

        return Response({
            "user": {
                "id": user.id,
                "name": user.username,
                "email": user.email,
                "created_at": user.created_at,
                "role": user.role,
                "avatar": user.avatar,
                "last_active_at": user.last_active_at,
                "lastLogin": last_login,
                "isOnline": is_online,
                "totalJobs": total_jobs,
                "totalTodos": total_todos,
                "totalCompanies": Company.objects.filter(user=user).count(),
                "totalAchievements": Achievement.objects.filter(user=user).count()
            },
            "timeline": timeline,
            "behaviorMetrics": {
                "consistency_score": round(consistency),
                "focus_score": round(focus),
                "action_speed": round(speed),
                "cognitive_load": round(cognitive_load),
                "drop_rate": round(drop_rate)
            },
            "jobStats": list(job_stats),
            "aiInsights": list(ai_insights),
            "riskAnalysis": {
                "riskScore": risk_score,
                "daysActive": max(1, (timezone.now() - user.created_at).days),
                "totalActions": len(timeline),
                "activePipeline": active_jobs
            },
            "heatmapData": heatmap_data,
            "pipelineTrend": pipeline_trend
        })

class CreateRoleView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        name = request.data.get('name')
        if not name:
            return Response({'error': 'Name is required'}, status=status.HTTP_400_BAD_REQUEST)
        role = Role.objects.create(name=name)
        return Response({'id': role.id, 'name': role.name}, status=status.HTTP_201_CREATED)

class CreatePermissionView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        name = request.data.get('name')
        if not name:
            return Response({'error': 'Name is required'}, status=status.HTTP_400_BAD_REQUEST)
        perm = Permission.objects.create(name=name)
        return Response({'id': perm.id, 'name': perm.name}, status=status.HTTP_201_CREATED)

