from django.contrib.auth import update_session_auth_hash
from django.contrib.auth.password_validation import validate_password
from rest_framework import viewsets, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser

from .models import User
from .serializers import UserProfileSerializer


class UserProfileViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def retrieve(self, request):
        serializer = UserProfileSerializer(request.user)
        return Response(serializer.data)

    def partial_update(self, request):
        user = request.user

        print("💾 PATCH DATA:", request.data)
        print("📸 PATCH FILES:", request.FILES)

        serializer = UserProfileSerializer(user, data=request.data, partial=True)
        if serializer.is_valid():
            if 'profile_picture' in request.FILES:
                user.profile_picture = request.FILES['profile_picture']
                user.save()  # Save image file to model

            serializer.save()
            return Response(serializer.data)
        else:
            print("❌ Serializer errors:", serializer.errors)
            return Response(serializer.errors, status=400)



class ChangePasswordView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        user = request.user
        old_password = request.data.get("old_password")
        new_password = request.data.get("new_password")

        if not user.check_password(old_password):
            return Response({"error": "Wrong current password."}, status=400)

        try:
            validate_password(new_password, user)
        except Exception as e:
            return Response({"error": str(e)}, status=400)

        user.set_password(new_password)
        user.save()
        update_session_auth_hash(request, user)
        return Response({"success": "Password changed successfully."})
