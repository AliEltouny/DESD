<<<<<<< HEAD
=======
# backend/unihub/urls.py
>>>>>>> master
from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

urlpatterns = [
    path("admin/", admin.site.urls),
    path("", include("core.urls")),  # Ensure 'core.urls' has a home page
<<<<<<< HEAD
    path("api/auth/", include("authentication.urls")),  # Include auth endpoints
    path("api/token/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("api/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
]
=======
    path("api/", include("authentication.urls")),  # Prefix API endpoints with /api/
    path("api/token/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("api/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
]
>>>>>>> master
