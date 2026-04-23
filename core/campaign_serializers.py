from rest_framework import serializers
from .models import EmailTemplate, EmailCampaign, EmailLog

class EmailTemplateSerializer(serializers.ModelSerializer):
    user = serializers.PrimaryKeyRelatedField(read_only=True)
    resume = serializers.FileField(required=False, allow_null=True)
    class Meta:
        model = EmailTemplate
        fields = '__all__'

class EmailCampaignSerializer(serializers.ModelSerializer):
    user = serializers.PrimaryKeyRelatedField(read_only=True)
    class Meta:
        model = EmailCampaign
        fields = '__all__'

class EmailLogSerializer(serializers.ModelSerializer):
    company_name = serializers.CharField(source='company.name', read_only=True)
    company_location = serializers.CharField(source='company.address', read_only=True)
    template_name = serializers.CharField(source='campaign.template.name', read_only=True)
    
    class Meta:
        model = EmailLog
        fields = '__all__'
