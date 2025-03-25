# authentication/serializers.py
from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
import re

User = get_user_model()

# Custom password validator
def validate_custom_password(password):
    if len(password) < 8:
        raise serializers.ValidationError("Password must be at least 8 characters long.")
    if not any(char.isupper() for char in password):
        raise serializers.ValidationError("Password must contain at least one uppercase letter.")
    if not any(char.islower() for char in password):
        raise serializers.ValidationError("Password must contain at least one lowercase letter.")
    if not any(char.isdigit() for char in password):
        raise serializers.ValidationError("Password must contain at least one number.")
    return password

# Register Serializer
class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        write_only=True, required=True, validators=[validate_password, validate_custom_password]
    )

    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'password', 'first_name', 'last_name', 'academic_year')

    def validate_email(self, email):
        if not re.match(r'^[\w\.-]+@([\w\.-]+\.)?uwe\.ac\.uk$', email):
            raise serializers.ValidationError("Email must be a UWE email (e.g., @uwe.ac.uk or @live.uwe.ac.uk).")
        if User.objects.filter(email=email).exists():
            raise serializers.ValidationError("Email is already in use.")
        return email

    def create(self, validated_data):
        user = User.objects.create(
            username=validated_data['username'],
            email=validated_data['email'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            academic_year=validated_data.get('academic_year', ''),
        )
        user.set_password(validated_data['password'])
        user.save()
        return user

# Login Serializer
class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)
