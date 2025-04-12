from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from rest_framework.validators import UniqueValidator

from .models import User


class UserRegistrationSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(
        required=True,
        validators=[UniqueValidator(queryset=User.objects.all())]
    )
    password = serializers.CharField(
        write_only=True,
        required=True,
        style={'input_type': 'password'},
        validators=[validate_password]
    )
    password2 = serializers.CharField(
        write_only=True,
        required=True,
        style={'input_type': 'password'}
    )

    class Meta:
        model = User
        fields = ('email', 'username', 'password', 'password2', 'first_name', 'last_name', 'date_of_birth', 'academic_year')
        extra_kwargs = {
            'first_name': {'required': True},
            'last_name': {'required': True},
            'username': {'required': True},
        }

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "Password fields didn't match."})
        return attrs

    def create(self, validated_data):
        validated_data.pop('password2')
        user = User.objects.create_user(
            email=validated_data['email'],
            username=validated_data['username'],
            first_name=validated_data['first_name'],
            last_name=validated_data['last_name'],
            password=validated_data['password']
        )
        if 'date_of_birth' in validated_data:
            user.date_of_birth = validated_data['date_of_birth']
        if 'academic_year' in validated_data:
            user.academic_year = validated_data['academic_year']
        
        # Set user as inactive until OTP is verified
        user.is_active = False
        user.save()
        
        return user


class OTPVerificationSerializer(serializers.Serializer):
    otp = serializers.CharField(required=True, max_length=6)


class UserLoginSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)
    password = serializers.CharField(
        required=True,
        style={'input_type': 'password'},
        write_only=True
    )

    def validate(self, attrs):
        email = attrs.get('email')
        password = attrs.get('password')

        if email and password:
            user = authenticate(request=self.context.get('request'), email=email, password=password)
            if not user:
                msg = 'Unable to log in with provided credentials.'
                raise serializers.ValidationError(msg, code='authorization')
            if not user.is_active:
                msg = 'Account is not activated yet.'
                raise serializers.ValidationError(msg, code='not_active')
        else:
            msg = 'Must include "email" and "password".'
            raise serializers.ValidationError(msg, code='authorization')

        attrs['user'] = user
        return attrs


class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email',
            'first_name', 'last_name',
            'bio', 'interests', 'nationality',
            'profile_picture', 'phone_number',
            'date_of_birth', 'academic_year', 'join_date'
        ]
        read_only_fields = ['id', 'email', 'username', 'date_of_birth', 'academic_year', 'join_date', 'phone_number']

