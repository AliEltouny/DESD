from rest_framework.authentication import BaseAuthentication

class NoAuth(BaseAuthentication):
    def authenticate(self, request):
        return None
