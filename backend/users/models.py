from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models
from django.utils.translation import gettext_lazy as _


class UserManager(BaseUserManager):
    def create_user(self, email, username, first_name, last_name, password=None, **extra_fields):
        if not email:
            raise ValueError('Users must have an email address')
        if not username:
            raise ValueError('Users must have a username')
        
        email = self.normalize_email(email)
        user = self.model(
            email=email,
            username=username,
            first_name=first_name,
            last_name=last_name,
            **extra_fields
        )
        user.set_password(password)
        user.save(using=self._db)
        return user
    
    def create_superuser(self, email, username, first_name, last_name, password, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)
        
        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')
        
        return self.create_user(email, username, first_name, last_name, password, **extra_fields)


class User(AbstractUser):
    email = models.EmailField(_("email address"), unique=True)
    
    # Personal information
    date_of_birth = models.DateField(null=True, blank=True)
    address = models.CharField(max_length=255, null=True, blank=True)
    post_code = models.CharField(max_length=20, null=True, blank=True)
    
    # Academic information
    academic_year = models.PositiveSmallIntegerField(null=True, blank=True)
    STUDY_PROGRAM_CHOICES = [
        ('architecture', 'Architecture'),
        ('computer_science', 'Computer Science'),
        ('engineering', 'Engineering'),
        ('business', 'Business'),
        ('medicine', 'Medicine'),
        ('law', 'Law'),
        ('arts', 'Arts'),
        ('humanities', 'Humanities'),
        ('sciences', 'Sciences'),
        ('other', 'Other'),
    ]
    study_program = models.CharField(
        max_length=50, 
        choices=STUDY_PROGRAM_CHOICES,
        null=True, 
        blank=True
    )
    
    # Profile data
    interests = models.TextField(null=True, blank=True, help_text="User's interests, hobbies, etc.")
    bio = models.TextField(null=True, blank=True, help_text="User's biography")
    profile_picture = models.ImageField(upload_to='profile_pictures/', null=True, blank=True)
    
    # Achievements
    rewards = models.JSONField(null=True, blank=True, default=dict, help_text="Rewards earned by the user")
    achievements = models.JSONField(null=True, blank=True, default=dict, help_text="Achievements unlocked by the user")
    
    # Make email the required field for authentication
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username', 'first_name', 'last_name']
    
    objects = UserManager()
    
    class Meta:
        verbose_name = _("user")
        verbose_name_plural = _("users")
    
    def __str__(self):
        return self.email
