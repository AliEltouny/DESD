from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from rest_framework.routers import DefaultRouter

from . import views
from .views import MessageViewSet, MessageGroupViewSet, user_search, start_dm

router = DefaultRouter()
router.register(r'message-groups', MessageGroupViewSet, basename='message-group')
router.register(r'messages', MessageViewSet, basename='message')

urlpatterns = [
    # Authentication - Without trailing slashes
    path('signup', views.signup, name='signup'),
    path('verify-otp/<str:email>', views.verify_otp_view, name='verify-otp'),
    path('login', views.login, name='login'),
    path('token/refresh', TokenRefreshView.as_view(), name='token-refresh'),
    path('profile', views.UserProfileViewSet.as_view({
        'get': 'retrieve',
        'patch': 'partial_update',
    }), name='profile'),
    path('password-reset/request', views.password_reset_request, name='password-reset-request'),
    path('password-reset/confirm', views.password_reset_confirm, name='password-reset-confirm'),

    # Authentication - With trailing slashes
    path('signup/', views.signup, name='signup-with-slash'),
    path('verify-otp/<str:email>/', views.verify_otp_view, name='verify-otp-with-slash'),
    path('login/', views.login, name='login-with-slash'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token-refresh-with-slash'),
    path('profile/', views.UserProfileViewSet.as_view({
        'get': 'retrieve',
        'patch': 'partial_update',
    }), name='profile-with-slash'),
    path('password-reset/request/', views.password_reset_request, name='password-reset-request-with-slash'),
    path('password-reset/confirm/', views.password_reset_confirm, name='password-reset-confirm-with-slash'),

    # Testimonials - Without trailing slash
    path('testimonials', views.TestimonialViewSet.as_view({
        'get': 'list',
    }), name='testimonials'),
    path('testimonials/<int:pk>', views.TestimonialViewSet.as_view({
        'get': 'retrieve',
    }), name='testimonial-detail'),

    # Testimonials - With trailing slash
    path('testimonials/', views.TestimonialViewSet.as_view({
        'get': 'list',
    }), name='testimonials-with-slash'),
    path('testimonials/<int:pk>/', views.TestimonialViewSet.as_view({
        'get': 'retrieve',
    }), name='testimonial-detail-with-slash'),

    # User search and direct message
    path('users/search/', user_search, name='user-search'),
    path('dm/start/', start_dm, name='start-dm'),
    path('messages/', views.group_messages, name='group-messages'),
    path('start-dm/', start_dm, name='start_dm'),
]

urlpatterns += router.urls
