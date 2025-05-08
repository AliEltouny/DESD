from urllib.parse import parse_qs
from channels.middleware import BaseMiddleware
from django.contrib.auth.models import AnonymousUser
from rest_framework_simplejwt.tokens import AccessToken
from users.models import User
import logging

logger = logging.getLogger("channels.auth")

class JWTAuthMiddleware(BaseMiddleware):
    async def __call__(self, scope, receive, send):
        query_string = scope.get("query_string", b"").decode()
        query_params = parse_qs(query_string)
        token = query_params.get("token", [None])[0]
        user = AnonymousUser()
        logger.info(f"[JWTAuthMiddleware] Token: {token}")
        if token:
            try:
                validated_token = AccessToken(token)
                user_id = validated_token.get("user_id")
                logger.info(f"[JWTAuthMiddleware] user_id from token: {user_id}")
                user = await User.objects.aget(id=user_id)
                logger.info(f"[JWTAuthMiddleware] User found: {user}")
            except Exception as e:
                logger.error(f"[JWTAuthMiddleware] Exception: {e}")
        scope["user"] = user
        return await super().__call__(scope, receive, send)
