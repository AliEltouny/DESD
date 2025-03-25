from django.urls import path
from .views import VerifyOTPView
from django.views.generic import TemplateView
from . import views

urlpatterns = [
    # Template-based paths
    path('password-reset-page/', views.password_reset_page, name='password-reset-page'),
    path('password-reset/', views.password_reset_request, name='password-reset'),
    path('verify-signup-otp/<str:email>/', views.verify_signup_otp, name='verify-signup-otp'),
    path('password-reset-confirm/<str:email>/', views.password_reset_confirm, name='password-reset-confirm'),

    # API endpoints
    path('signup/', views.RegisterView.as_view(), name='signup'),
    path('login/', views.LoginView.as_view(), name='login'),
    path('', TemplateView.as_view(template_name="index.html"), name="index"),
    path('dashboard/', views.DashboardView.as_view(), name='dashboard'),  
    path('profile/', views.UserProfileView.as_view(), name='profile'),
    path('request-otp-reset/', views.RequestOTPReset.as_view(), name='api-request-otp-reset'),
    path('verify-otp/<str:email>/', views.verify_otp, name='verify-otp'),
    path('verify-otp-api/', views.VerifyOTPReset.as_view(), name='verify-otp-api'),
    path('password-reset-email/', views.PasswordResetView.as_view(), name='password-reset-email'),
    path('password-reset-confirm-api/', views.ResetPasswordConfirmView.as_view(), name='password-reset-confirm-api'),

    # Template pages
    path('signup-page/', views.signup_page, name='signup-page'),
    path('login-page/', views.login_page, name='login-page'),
]
