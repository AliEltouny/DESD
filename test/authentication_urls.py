from django.urls import path
from .views import RegisterView, LoginView, PasswordResetRequestView, UserProfileView, VerifyEmailView

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('password-reset/', PasswordResetRequestView.as_view(), name='password-reset'),
    path('profile/', UserProfileView.as_view(), name='user-profile'),
    path('email-verify/<str:token>/', VerifyEmailView.as_view(), name='email-verify'),
]