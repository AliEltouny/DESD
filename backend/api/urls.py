from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from . import views
from users.views import ChangePasswordView  # ✅ FIXED: imported from correct module

urlpatterns = [
    # ---------------------
    # ✅ Authentication Routes (No Slash)
    # ---------------------
    path('signup', views.signup, name='signup'),
    path('verify-otp/<str:email>', views.verify_otp_view, name='verify-otp'),
    path('login', views.login, name='login'),
    path('token/refresh', TokenRefreshView.as_view(), name='token-refresh'),

    # ---------------------
    # ✅ Profile Routes (No Slash)
    # ---------------------
    path('profile', views.UserProfileViewSet.as_view({
        'get': 'retrieve',
        'patch': 'partial_update',
    }), name='profile'),
    path('change-password', ChangePasswordView.as_view(), name='change-password'),

    # ---------------------
    # ✅ Authentication Routes (With Slash)
    # ---------------------
    path('signup/', views.signup, name='signup-with-slash'),
    path('verify-otp/<str:email>/', views.verify_otp_view, name='verify-otp-with-slash'),
    path('login/', views.login, name='login-with-slash'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token-refresh-with-slash'),

    # ---------------------
    # ✅ Profile Routes (With Slash)
    # ---------------------
    path('profile/', views.UserProfileViewSet.as_view({
        'get': 'retrieve',
        'patch': 'partial_update',
    }), name='profile-with-slash'),
    path('change-password/', ChangePasswordView.as_view(), name='change-password-with-slash'),

    # ---------------------
    # ✅ Testimonials Routes
    # ---------------------
    path('testimonials', views.TestimonialViewSet.as_view({
        'get': 'list',
    }), name='testimonials'),
    path('testimonials/<int:pk>', views.TestimonialViewSet.as_view({
        'get': 'retrieve',
    }), name='testimonial-detail'),

    path('testimonials/', views.TestimonialViewSet.as_view({
        'get': 'list',
    }), name='testimonials-with-slash'),
    path('testimonials/<int:pk>/', views.TestimonialViewSet.as_view({
        'get': 'retrieve',
    }), name='testimonial-detail-with-slash'),
]
