"""
URL configuration for core project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.1/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.views.static import serve
import os
from django.views.decorators.csrf import csrf_exempt
from rest_framework.decorators import api_view
from django.http import HttpResponse

# Special view to debug API requests
@api_view(['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'])
@csrf_exempt
def debug_api(request, path):
    print(f"DEBUG API: {request.method} request to {path}")
    print(f"DEBUG API: Content type: {request.content_type}")
    print(f"DEBUG API: Auth: {request.META.get('HTTP_AUTHORIZATION', 'No Auth')}")
    print(f"DEBUG API: Body: {request.body[:1000] if request.body else 'No body'}")
    print(f"DEBUG API: Data: {request.data}")
    
    return HttpResponse(
        f"Debug API ({request.method}): Path={path}, Auth Present={bool(request.META.get('HTTP_AUTHORIZATION'))}, Content-Type={request.content_type}",
        content_type="text/plain"
    )

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # API routes
    path('api/', include('api.urls')),
    path('api/', include('communities.urls')),
    
    # Debug route to catch all API requests
    path('api/debug/<path:path>', debug_api),
    
    # Explicitly serve media files for development
    path('media/<path:path>', serve, {
        'document_root': os.path.join(settings.BASE_DIR, 'media'),
    }),
]

# Always serve media files regardless of DEBUG setting
urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
