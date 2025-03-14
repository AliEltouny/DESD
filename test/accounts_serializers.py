from rest_framework import serializers
from django.core.exceptions import ValidationError
from .models import User
import logging

logger = logging.getLogger(_name_)

# User Registration Serializer (With Strong Validation)
class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    confirm_password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ('username', 'email', 'password', 'confirm_password', 
                 'student_id', 'academic_program', 'role', 'date_of_birth')

    def validate(self, data):
        logger.info("Starting password validation")  # Debug log
        
        if data.get('password') != data.get('confirm_password'):
            raise serializers.ValidationError({
                "password": "Passwords do not match."
            })

        password = data.get('password')
        
        # Strong Password Validation
        if len(password) < 8:
            raise serializers.ValidationError({"password": "Password must be at least 8 characters long."})
        if not any(char.isupper() for char in password):
            raise serializers.ValidationError({"password": "Password must contain at least one uppercase letter."})
        if not any(char.islower() for char in password):
            raise serializers.ValidationError({"password": "Password must contain at least one lowercase letter."})
        if not any(char.isdigit() for char in password):
            raise serializers.ValidationError({"password": "Password must contain at least one number."})
        if not any(char in "!@#$%^&*(),.?\":{}|<>" for char in password):
            raise serializers.ValidationError({"password": "Password must contain at least one special character."})

        logger.info("Password validation passed")  # Debug log
        return data

    def create(self, validated_data):
        validated_data.pop('confirm_password', None)
        return User.objects.create_user(**validated_data)


# User Profile Serializer (For Fetching and Updating Profile)
class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'first_name', 'last_name', 'date_of_birth',
                  'student_id', 'academic_program', 'role')
        read_only_fields = ('id', 'email')  # Prevent email modification