from django.core.mail import EmailMessage
from django.conf import settings
import threading
import time
from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from .models import EmailTemplate, EmailCampaign, EmailLog, Company
from .campaign_serializers import EmailTemplateSerializer, EmailCampaignSerializer, EmailLogSerializer

# Simulated background worker
def process_campaign_background(campaign_id):
    try:
        campaign = EmailCampaign.objects.get(id=campaign_id)
        campaign.status = 'Running'
        campaign.save()

        logs = EmailLog.objects.filter(campaign=campaign, status='Pending')
        
        for log in logs:
            time.sleep(1.5) # Simulate SMTP delay and rate limiting
            
            # Simple AI/Variable substitution
            body = campaign.template.body
            body = body.replace('{{company_name}}', log.company.name or '')
            body = body.replace('{{company_location}}', log.company.address or 'your location')
            body = body.replace('{{company_website}}', log.company.website or 'your website')
            
            subject = campaign.template.subject
            subject = subject.replace('{{company_name}}', log.company.name or '')
            subject = subject.replace('{{company_location}}', log.company.address or 'your location')
            subject = subject.replace('{{company_website}}', log.company.website or 'your website')
            
            try:
                # Send the actual email
                email = EmailMessage(
                    subject=subject,
                    body=body,
                    from_email=settings.EMAIL_HOST_USER,
                    to=[log.recipient_email]
                )

                if campaign.template and campaign.template.resume:
                    try:
                        email.attach_file(campaign.template.resume.path)
                    except:
                        pass
                
                email.send(fail_silently=False)
                
                log.status = 'Sent'
                campaign.total_sent += 1
            except Exception as mail_err:
                log.status = 'Failed'
                log.error_message = str(mail_err)
                campaign.total_failed += 1
            
            log.sent_at = timezone.now()
            log.save()
            campaign.save()
            
        campaign.status = 'Completed'
        campaign.save()
    except Exception as e:
        print(f"Error processing campaign {campaign_id}: {str(e)}")

class EmailTemplateViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = EmailTemplateSerializer
    
    def get_queryset(self):
        return EmailTemplate.objects.filter(user=self.request.user).order_by('-created_at')
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class EmailCampaignViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = EmailCampaignSerializer
    
    def get_queryset(self):
        return EmailCampaign.objects.filter(user=self.request.user).order_by('-created_at')
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=True, methods=['post'])
    def send_bulk(self, request, pk=None):
        campaign = self.get_object()
        company_ids = request.data.get('company_ids', [])
        
        if not company_ids:
            return Response({'error': 'No companies selected'}, status=400)
            
        companies = Company.objects.filter(id__in=company_ids, user=request.user)
        
        for comp in companies:
            if comp.email:
                # Deduplication logic could go here
                EmailLog.objects.get_or_create(
                    user=request.user,
                    campaign=campaign,
                    company=comp,
                    recipient_email=comp.email,
                    defaults={'status': 'Pending'}
                )
        
        # Start background task (Replacing Celery for MVP)
        thread = threading.Thread(target=process_campaign_background, args=(campaign.id,))
        thread.start()
        
        return Response({'message': 'Campaign started successfully. Emails are being sent in the background.'})

class EmailLogViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = EmailLogSerializer
    
    def get_queryset(self):
        campaign_id = self.request.query_params.get('campaign')
        qs = EmailLog.objects.filter(user=self.request.user).order_by('-id')
        if campaign_id:
            qs = qs.filter(campaign_id=campaign_id)
        return qs
