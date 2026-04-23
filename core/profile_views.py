from rest_framework import status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from .serializers import UserSerializer
from django.contrib.auth import authenticate, update_session_auth_hash
from django.contrib.auth import get_user_model

User = get_user_model()

class ProfileView(APIView):
    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)

    def put(self, request):
        user = request.user
        data = request.data
        
        name = data.get('name')
        email = data.get('email')
        
        if not name or not email:
            return Response({'message': 'Name and email are required.'}, status=status.HTTP_400_BAD_REQUEST)
        
        if User.objects.exclude(id=user.id).filter(email=email).exists():
            return Response({'message': 'Email is already in use by another account.'}, status=status.HTTP_409_CONFLICT)
        
        user.username = name # Assuming name maps to username in this simple setup
        user.email = email
        user.linkedin = data.get('linkedin')
        user.naukri = data.get('naukri')
        user.workindia = data.get('workindia')
        user.glassdoor = data.get('glassdoor')
        user.portfolio = data.get('portfolio')
        user.save()
        
        return Response({
            'message': 'Profile updated successfully.',
            'user': UserSerializer(user).data
        })

class ChangePasswordView(APIView):
    def put(self, request):
        current_password = request.data.get('currentPassword')
        new_password = request.data.get('newPassword')
        
        if not current_password or not new_password:
            return Response({'message': 'Both current and new password are required.'}, status=status.HTTP_400_BAD_REQUEST)
        
        if len(new_password) < 6:
            return Response({'message': 'New password must be at least 6 characters.'}, status=status.HTTP_400_BAD_REQUEST)
        
        if not request.user.check_password(current_password):
            return Response({'message': 'Current password is incorrect.'}, status=status.HTTP_401_UNAUTHORIZED)
        
        request.user.set_password(new_password)
        request.user.save()
        update_session_auth_hash(request, request.user) # Important to keep the user logged in
        
        return Response({'message': 'Password changed successfully.'})

class AvatarUpdateView(APIView):
    def put(self, request):
        avatar = request.data.get('avatar')
        if not avatar:
            return Response({'message': 'No image data provided.'}, status=status.HTTP_400_BAD_REQUEST)
        
        if len(avatar) > 3 * 1024 * 1024:
            return Response({'message': 'Image too large. Please use an image under 2MB.'}, status=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE)
        
        request.user.avatar = avatar
        request.user.save()
        
        return Response({'message': 'Profile picture updated.', 'avatar': avatar})
