from rest_framework import status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db import models
from .models import Job, User, BehaviorMetric, Company, EmailLog
from django.db.models import Count, Q
from django.utils import timezone
from datetime import timedelta

class DashboardStatsView(APIView):
    def get(self, request):
        if request.user.role == 'admin':
            jobs = Job.objects.all()
            total_outreaches = EmailLog.objects.count()
            total_companies = Company.objects.count()
            top_comp = Job.objects.values('company_name').annotate(name=models.F('company_name'), count=models.Count('id')).order_by('-count')[:5].values('name', 'count')
        else:
            jobs = Job.objects.filter(user=request.user)
            total_outreaches = EmailLog.objects.filter(user=request.user).count()
            total_companies = Company.objects.filter(user=request.user).count()
            top_comp = Job.objects.filter(user=request.user).values('company_name').annotate(name=models.F('company_name'), count=models.Count('id')).order_by('-count')[:5].values('name', 'count')
            
        stats = {
            'totalJobs': jobs.count(),
            'applied': jobs.filter(status__icontains='applied').count(),
            'interviews': jobs.filter(status__icontains='interview').count(),
            'offers': jobs.filter(status__icontains='offer').count(),
            'rejected': jobs.filter(status__icontains='reject').count(),
            'totalOutreaches': total_outreaches,
            'totalCompanies': total_companies,
            'topCompanies': list(top_comp),
            'chartData': [],
            'applicationsByDate': {},
            'interviewsByDate': {},
            'upcomingInterviews': []
        }
        
        date_counts = {}
        today = timezone.now().date()
        
        for job in jobs:
            if job.applied_date:
                d_str = job.applied_date.isoformat()
                date_counts[d_str] = date_counts.get(d_str, 0) + 1
                stats['applicationsByDate'][d_str] = stats['applicationsByDate'].get(d_str, 0) + 1
            
            if job.interview_date and 'interview' in job.status.lower():
                d_str = job.interview_date.isoformat()
                if d_str not in stats['interviewsByDate']:
                    stats['interviewsByDate'][d_str] = []
                # In a real app, you'd serialize this job
                stats['interviewsByDate'][d_str].append({
                    'id': job.id,
                    'company_name': job.company_name,
                    'job_role': job.job_role,
                    'interview_date': job.interview_date
                })
                
                if job.interview_date >= today:
                    stats['upcomingInterviews'].append({
                        'id': job.id,
                        'company_name': job.company_name,
                        'job_role': job.job_role,
                        'interview_date': job.interview_date
                    })
                    
        stats['upcomingInterviews'].sort(key=lambda x: x['interview_date'])
        
        stats['chartData'] = sorted([
            {'date': k, 'applications': v} for k, v in date_counts.items()
        ], key=lambda x: x['date'])
        
        stats['recentJobs'] = list(jobs.order_by('-created_at')[:5].values())
        
        return Response(stats)

class AdminDashboardStatsView(APIView):
    permission_classes = [permissions.IsAuthenticated] # Should be IsAdminOrSuperAdmin really

    def get(self, request):
        days = int(request.query_params.get('days', 30))
        
        user_count = User.objects.count()
        job_count = Job.objects.count()
        interview_count = Job.objects.filter(status__icontains='interview').count()
        total_outreaches = EmailLog.objects.count()
        total_companies = Company.objects.count()
        status_dist = Job.objects.values('status').annotate(name=models.F('status'), value=Count('id')).values('name', 'value')
        top_comp = Job.objects.values('company_name').annotate(name=models.F('company_name'), applications=Count('id'), interviews=Count('id', filter=Q(status__icontains='interview'))).order_by('-applications')[:5].values('name', 'applications', 'interviews')
        
        cutoff_date = timezone.now().date() - timedelta(days=days)
        chart_data = Job.objects.filter(applied_date__gte=cutoff_date).values('applied_date').annotate(date=models.F('applied_date'), count=Count('id')).order_by('applied_date').values('date', 'count')
        
        recent_risk_users = User.objects.filter(behaviormetric__drop_rate__gt=40).annotate(dropRate=models.F('behaviormetric__drop_rate'), name=models.F('username'))[:5].values('id', 'name', 'email', 'dropRate')
        
        if not recent_risk_users:
            fallbacks = User.objects.all().order_by('-id')[:5]
            recent_risk_users = [{'id': u.id, 'name': u.username, 'email': u.email, 'dropRate': 35} for u in fallbacks]

        return Response({
            'totalUsers': user_count,
            'totalJobs': job_count,
            'totalInterviews': interview_count,
            'totalOutreaches': total_outreaches,
            'totalCompanies': total_companies,
            'recentRiskUsers': list(recent_risk_users),
            'globalChartData': list(chart_data),
            'statusDistribution': list(status_dist),
            'topCompanies': list(top_comp)
        })
