from django.urls import path
from . import views

urlpatterns = [
    # User profile endpoints
    path('<int:user_id>/', views.get_user_by_id, name='user-profile-by-id'),
    path('profile/<str:username>/', views.get_user_by_username, name='user-profile-by-username'),
]