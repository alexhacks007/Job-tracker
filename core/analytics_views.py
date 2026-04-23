from rest_framework import status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import Job, AIInsight
from django.db.models import Count
from django.utils import timezone
from datetime import timedelta
import collections

class AnalyticsFunnelView(APIView):
    def get(self, request):
        jobs = Job.objects.filter(user=request.user)
        counts = collections.Counter(jobs.values_list('status', flat=True))
        
        funnel_data = [
            { 'name': 'Applied', 'value': (counts.get('Applied', 0) + counts.get('Pending', 0)) },
            { 'name': 'Screening', 'value': counts.get('Called', 0) },
            { 'name': 'Interview', 'value': counts.get('Interview', 0) },
            { 'name': 'Offer', 'value': counts.get('Offer', 0) }
        ]
        return Response({ 'success': True, 'data': funnel_data })

class AnalyticsHeatmapView(APIView):
    def get(self, request):
        jobs = Job.objects.filter(user=request.user, applied_date__isnull=False)
        date_map = collections.Counter(jobs.values_list('applied_date', flat=True))
        
        start_date = timezone.now().date() - timedelta(days=119)
        end_date = timezone.now().date()
        
        heatmap_data = []
        current_date = start_date
        while current_date <= end_date:
            heatmap_data.append({
                'date': current_date.isoformat(),
                'count': date_map.get(current_date, 0)
            })
            current_date += timedelta(days=1)
            
        return Response({ 'success': True, 'data': heatmap_data })

class AnalyticsDistributionView(APIView):
    def get(self, request):
        jobs = Job.objects.filter(user=request.user)
        platforms = collections.Counter([j.platform or 'Direct Upload' for j in jobs])
        
        distribution_data = [
            { 'name': k, 'value': v } for k, v in platforms.items()
        ]
        return Response({ 'success': True, 'data': distribution_data })

class InsightsView(APIView):
    def get(self, request):
        jobs = Job.objects.filter(user=request.user)
        raw_signals = AIInsight.objects.filter(user=request.user).order_by('-generated_at')[:20]
        raw_signals_data = list(raw_signals.values('id', 'insight_type', 'message', 'is_read', 'generated_at'))
        
        insights = {
            'adminNudge': next((s['message'] for s in raw_signals_data if s['insight_type'] == 'ADMIN_NUDGE'), None),
            'rawSignals': raw_signals_data,
            'bestDay': { 'day': 'N/A', 'count': 0, 'message': 'Not enough data.' },
            'weeklyChange': { 'percentage': 0, 'message': 'No data for comparison.' },
            'goalRemaining': { 'target': 50, 'current': 0, 'message': 'Set a goal to track progress.' },
            'conversionRates': { 'interviewRate': 0, 'offerRate': 0 },
            'tips': [
                "Consistent applications lead to consistent interviews.",
                "Ensure your notes are detailed for better tracking."
            ],
            'personalSuccessScore': 50
        }
        
        if not jobs:
            return Response({ 'success': True, 'insights': insights })

        # Goal Remaining
        now = timezone.now()
        current_month_jobs = jobs.filter(applied_date__month=now.month, applied_date__year=now.year)
        insights['goalRemaining']['current'] = current_month_jobs.count()
        insights['goalRemaining']['message'] = f"{max(0, 50 - current_month_jobs.count())} more applications to hit your 50/mo goal."

        # Conversion Rates
        total_interviews = jobs.filter(status__icontains='interview').count()
        total_offers = jobs.filter(status__icontains='offer').count()
        insights['conversionRates']['interviewRate'] = round((total_interviews / jobs.count()) * 100) if jobs.count() > 0 else 0
        insights['conversionRates']['offerRate'] = round((total_offers / jobs.count()) * 100) if jobs.count() > 0 else 0

        # Best Day
        day_counts = collections.Counter([j.applied_date.weekday() for j in jobs if j.applied_date])
        days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
        if day_counts:
            best_day_idx = max(day_counts, key=day_counts.get)
            insights['bestDay'] = {
                'day': days[best_day_idx],
                'count': day_counts[best_day_idx],
                'message': f"Highest rate on {days[best_day_idx]}s."
            }

        # Weekly Change
        one_week_ago = now.date() - timedelta(days=7)
        two_weeks_ago = now.date() - timedelta(days=14)
        
        current_week_count = jobs.filter(applied_date__gte=one_week_ago).count()
        prior_week_count = jobs.filter(applied_date__gte=two_weeks_ago, applied_date__lt=one_week_ago).count()
        
        if prior_week_count == 0 and current_week_count > 0:
            insights['weeklyChange']['percentage'] = 100
            insights['weeklyChange']['message'] = "Infinite% jump compared to last week!"
        elif prior_week_count > 0:
            perc = round(((current_week_count - prior_week_count) / prior_week_count) * 100)
            insights['weeklyChange']['percentage'] = perc
            insights['weeklyChange']['message'] = f"{'+' if perc > 0 else ''}{perc}% vs last week."
        else:
            insights['weeklyChange']['message'] = "Steady activity."

        return Response({ 'success': True, 'insights': insights })

class MarkInsightReadView(APIView):
    def patch(self, request, pk):
        AIInsight.objects.filter(id=pk, user=request.user).update(is_read=True)
        return Response({ 'success': True })

class ClearAllInsightsView(APIView):
    def delete(self, request):
        AIInsight.objects.filter(user=request.user).delete()
        return Response({ 'success': True })

class AchievementsView(APIView):
    def get(self, request):
        jobs = Job.objects.filter(user=request.user)
        
        # Determine Streak
        applied_dates = sorted(list(set(jobs.filter(applied_date__isnull=False).values_list('applied_date', flat=True))), reverse=True)
        
        current_streak = 0
        today = timezone.now().date()
        check_date = today
        
        applied_dates_set = set(applied_dates)
        
        for _ in range(len(applied_dates) + 2): # Buffer
            if check_date in applied_dates_set:
                current_streak += 1
                check_date -= timedelta(days=1)
            elif check_date == today:
                # Fine if not today, check yesterday
                check_date -= timedelta(days=1)
                if check_date in applied_dates_set:
                    current_streak += 1
                    check_date -= timedelta(days=1)
                else:
                    break
            else:
                break
                
        streak = {
            'currentStreak': current_streak,
            'longestStreak': max(current_streak, 1),
            'statusMessage': f"You applied {current_streak} days in a row 🔥" if current_streak > 2 else ("Time to start applying!" if current_streak == 0 else "Keep the momentum going!")
        }
        
        total_interviews = jobs.filter(status__icontains='interview').count()
        total_offers = jobs.filter(status__icontains='offer').count()
        
        is_consistency_starter = current_streak >= 3
        is_century_mark = jobs.count() >= 100
        is_interview_maestro = total_interviews >= 5
        is_boss = total_offers >= 1
        
        today_str = today.isoformat()
        achievements = [
            { 'id': 1, 'name': 'Consistency Starter', 'description': 'Applied 3 days in a row.', 'unlocked': is_consistency_starter, 'date': today_str if is_consistency_starter else None },
            { 'id': 2, 'name': 'Century Mark', 'description': 'Hit 100 total applications.', 'unlocked': is_century_mark, 'date': today_str if is_century_mark else None },
            { 'id': 3, 'name': 'Interview Maestro', 'description': 'Secured 5 interviews.', 'unlocked': is_interview_maestro, 'date': today_str if is_interview_maestro else None },
            { 'id': 4, 'name': 'The Final Boss', 'description': 'Received your first offer.', 'unlocked': is_boss, 'date': today_str if is_boss else None }
        ]
        
        return Response({ 'success': True, 'data': { 'achievements': achievements, 'streak': streak } })

class SuggestJobView(APIView):
    def post(self, request):
        job_title = request.data.get('jobTitle')
        company = request.data.get('company')
        link = request.data.get('link')
        
        message = f"High-Potential Match: {job_title} at {company}. This role aligns with your stack. Check it out here: {link}"
        AIInsight.objects.create(user=request.user, insight_type='JOB_SUGGESTION', message=message)
        return Response({ 'success': True, 'message': 'Suggestion pinned to user sentinel' })
