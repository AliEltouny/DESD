import os
from django.http import FileResponse, Http404
from django.conf import settings

def serve_image(request, image_name):
    # Path to the static directory
    image_path = os.path.join(settings.BASE_DIR, 'static', 'auth', 'images', image_name)

    # Check if the image exists
    if os.path.exists(image_path):
        return FileResponse(open(image_path, 'rb'))
    else:
        raise Http404("Image not found")
