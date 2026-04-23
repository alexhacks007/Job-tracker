from django.urls import path, include
from .views import RegisterView, CustomLoginView, LocalJobSearchView, ExportCompaniesView
from .rbac_views import (
    RBACSeedView, RBACDataView, AssignRoleView, RolePermissionsUpdateView, 
    RBACAnalyticsView, UserActivityListView, AdminUserManagementView, UserFullProfileView,
    CreateRoleView, CreatePermissionView
)
from .analytics_views import (
    AnalyticsFunnelView, AnalyticsHeatmapView, AnalyticsDistributionView,
    InsightsView, MarkInsightReadView, ClearAllInsightsView, SuggestJobView,
    AchievementsView
)
from .profile_views import ProfileView, ChangePasswordView, AvatarUpdateView
from .dashboard_views import DashboardStatsView, AdminDashboardStatsView
from rest_framework_simplejwt.views import TokenRefreshView
from rest_framework.routers import DefaultRouter
from .views import JobViewSet, CompanyViewSet, TodoViewSet
from .campaign_views import EmailTemplateViewSet, EmailCampaignViewSet, EmailLogViewSet

router = DefaultRouter()
router.register(r'jobs', JobViewSet, basename='jobs')
router.register(r'companies', CompanyViewSet, basename='companies')
router.register(r'todos', TodoViewSet, basename='todos')
router.register(r'email-templates', EmailTemplateViewSet, basename='email-templates')
router.register(r'email-campaigns', EmailCampaignViewSet, basename='email-campaigns')
router.register(r'email-logs', EmailLogViewSet, basename='email-logs')

urlpatterns = [
    path('auth/register', RegisterView.as_view(), name='register'),
    path('auth/login', CustomLoginView.as_view(), name='login'),
    path('auth/refresh', TokenRefreshView.as_view(), name='token_refresh'),
    
    path('', include(router.urls)),
    path('jobs/local', LocalJobSearchView.as_view(), name='jobs-local'),
    path('export/companies', ExportCompaniesView.as_view(), name='export-companies'),
    
    # Dashboard Routes
    path('dashboard/stats', DashboardStatsView.as_view(), name='dashboard-stats'),
    path('dashboard/admin', AdminDashboardStatsView.as_view(), name='dashboard-admin'),

    # Profile Routes
    path('profile/', ProfileView.as_view(), name='profile'),
    path('profile/password/', ChangePasswordView.as_view(), name='change-password'),
    path('profile/avatar/', AvatarUpdateView.as_view(), name='avatar-update'),
    
    # Analytics Routes
    path('analytics/funnel', AnalyticsFunnelView.as_view(), name='analytics-funnel'),
    path('analytics/heatmap', AnalyticsHeatmapView.as_view(), name='analytics-heatmap'),
    path('analytics/distribution', AnalyticsDistributionView.as_view(), name='analytics-distribution'),
    
    # Insights Routes
    path('insights', InsightsView.as_view(), name='insights'),
    path('insights/<int:pk>/read', MarkInsightReadView.as_view(), name='insight-read'),
    path('insights/clear-all', ClearAllInsightsView.as_view(), name='insights-clear-all'),
    path('insights/suggest', SuggestJobView.as_view(), name='insight-suggest'),
    path('achievements', AchievementsView.as_view(), name='achievements'),

    # RBAC Routes
    path('rbac/seed', RBACSeedView.as_view(), name='rbac-seed'),
    path('rbac', RBACDataView.as_view(), name='rbac-data'),
    path('rbac/roles', CreateRoleView.as_view(), name='create-role'),
    path('rbac/permissions', CreatePermissionView.as_view(), name='create-permission'),
    path('rbac/assign-role', AssignRoleView.as_view(), name='assign-role'),
    path('rbac/role-permissions', RolePermissionsUpdateView.as_view(), name='role-permissions'),
    path('rbac/analytics', RBACAnalyticsView.as_view(), name='rbac-analytics'),
    path('rbac/users-activity', UserActivityListView.as_view(), name='users-activity'),
    path('rbac/users', AdminUserManagementView.as_view(), name='admin-users'),
    path('rbac/users/<int:pk>', AdminUserManagementView.as_view(), name='admin-user-detail'),
    path('rbac/users/<int:pk>/full-profile', UserFullProfileView.as_view(), name='user-full-profile'),
]
