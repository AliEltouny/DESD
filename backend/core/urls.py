from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.views.static import serve
import os
from django.views.decorators.csrf import csrf_exempt
from rest_framework.decorators import api_view
from django.http import HttpResponse
from drf_spectacular.views import SpectacularAPIView, SpectacularRedocView, SpectacularSwaggerView

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
    path('api/events/', include('events.urls')),
    
    # Fix: Include communities URLs directly at the API root
    # This prevents URL nesting issues
    path('api/', include('communities.urls')),

    # Debug catch-all
    path('api/debug/<path:path>', debug_api),

    # OpenAPI / Swagger docs
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),

    # Serve media files in dev
    path('media/<path:path>', serve, {
        'document_root': os.path.join(settings.BASE_DIR, 'media'),
    }),
]

urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
