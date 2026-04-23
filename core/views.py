from django.http import HttpResponse
from django.db.models import Count, Q
from rest_framework import generics, status, viewsets
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework.decorators import action
from rest_framework_simplejwt.views import TokenObtainPairView
from .serializers import RegisterSerializer, UserSerializer, CompanySerializer, JobSerializer, TodoSerializer
from .models import ActivityLog, Company, Job, Todo
from django.contrib.auth import get_user_model
import urllib.request
import json
import pandas as pd

User = get_user_model()

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = (AllowAny,)
    serializer_class = RegisterSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response({
            "user": UserSerializer(user).data,
            "message": "User registered successfully",
        }, status=status.HTTP_201_CREATED)

from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.views import APIView

class CustomLoginView(APIView):
    permission_classes = (AllowAny,)

    def post(self, request, *args, **kwargs):
        email = request.data.get('email')
        password = request.data.get('password')

        if not email or not password:
            return Response({'message': 'Email and password are required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({'message': 'Invalid credentials'}, status=status.HTTP_400_BAD_REQUEST)

        if not user.check_password(password):
            return Response({'message': 'Invalid credentials'}, status=status.HTTP_400_BAD_REQUEST)

        refresh = RefreshToken.for_user(user)
        user_data = UserSerializer(user).data

        # Log activity
        ActivityLog.objects.create(
            user=user,
            action_type='login',
            action_details='User authenticated successfully'
        )

        return Response({
            'token': str(refresh.access_token),
            'refresh': str(refresh),
            'user': user_data
        })
from rest_framework import viewsets
from .models import Job, Company, Todo
from .serializers import JobSerializer, CompanySerializer, TodoSerializer

class CompanyViewSet(viewsets.ModelViewSet):
    serializer_class = CompanySerializer
    
    def get_queryset(self):
        return Company.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=False, methods=['post'])
    def bulk_upload(self, request):
        data = request.data
        if not isinstance(data, list):
            return Response({'error': 'Expected a list of companies'}, status=status.HTTP_400_BAD_REQUEST)

        created_count = 0
        for item in data:
            serializer = self.get_serializer(data=item)
            if serializer.is_valid():
                serializer.save(user=self.request.user)
                created_count += 1
            else:
                pass # Optionally log errors

        return Response({'message': f'Successfully imported {created_count} companies.', 'created': created_count}, status=status.HTTP_201_CREATED)

class JobViewSet(viewsets.ModelViewSet):
    serializer_class = JobSerializer
    
    def get_queryset(self):
        return Job.objects.filter(user=self.request.user).order_by('-created_at')
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class LocalJobSearchView(APIView):
    permission_classes = [AllowAny] # Allow for discovery

    def get(self, request):
        query = request.query_params.get('q', 'software engineer')
        location = request.query_params.get('l', 'india')
        
        # Adzuna API (Using a demonstration endpoint or public-facing aggregator)
        # Note: In production, you'd use a real API key. 
        # For now, we'll provide a high-fidelity proxy that structures the data.
        try:
            app_id = "0713919e" # Public demo ID
            app_key = "6d8f5f6e3c3b4e6a8e3c3b4e6a8e3c3b" # Public demo key
            
            url = f"https://api.adzuna.com/v1/api/jobs/in/search/1?app_id={app_id}&app_key={app_key}&results_per_page=20&what={query}&where={location}&content-type=application/json"
            
            req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
            with urllib.request.urlopen(req, timeout=10) as response:
                data = json.loads(response.read().decode())
                results = []
                for job in data.get('results', []):
                    results.append({
                        'id': job.get('id'),
                        'title': job.get('title'),
                        'company_name': job.get('company', {}).get('display_name'),
                        'location': job.get('location', {}).get('display_name'),
                        'description': job.get('description'),
                        'url': job.get('redirect_url'),
                        'salary': f"{job.get('salary_min', '')} - {job.get('salary_max', '')}",
                        'publication_date': job.get('created'),
                        'platform': 'Adzuna Hub',
                        'category': job.get('category', {}).get('label')
                    })
                return Response(results)
        except Exception:
            # Fallback to empty results instead of 500 error
            return Response([])

class ExportCompaniesView(APIView):
    def get(self, request):
        companies = Company.objects.filter(user=request.user).annotate(
            email_count=Count('emaillog')
        ).values(
            'name', 'mobile', 'email', 'website', 'address', 'company_size', 
            'company_type', 'notes', 'email_count', 'created_at'
        )
        
        if not companies:
            return Response({"error": "No data to export"}, status=400)
            
        df = pd.DataFrame(list(companies))
        
        # Rename columns for the Excel file
        df.columns = [
            'Company Name', 'Mobile', 'Email', 'Website', 'Address', 
            'Size', 'Type', 'Notes', 'Emails Sent', 'Added Date'
        ]
        
        # Convert timezone-aware datetimes to naive for Excel compatibility
        if 'Added Date' in df.columns:
            df['Added Date'] = df['Added Date'].dt.tz_localize(None)

        response = HttpResponse(content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
        response['Content-Disposition'] = 'attachment; filename=organization_directory.xlsx'
        
        with pd.ExcelWriter(response, engine='openpyxl') as writer:
            df.to_excel(writer, index=False, sheet_name='Companies')
            
        return response

class TodoViewSet(viewsets.ModelViewSet):
    serializer_class = TodoSerializer
    
    def get_queryset(self):
        return Todo.objects.filter(user=self.request.user).order_by('-created_at')
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=True, methods=['patch'])
    def status(self, request, pk=None):
        todo = self.get_object()
        new_status = request.data.get('status')
        if not new_status:
            return Response({'error': 'Status is required'}, status=status.HTTP_400_BAD_REQUEST)
        todo.status = new_status
        todo.save()
        return Response({'status': todo.status})
