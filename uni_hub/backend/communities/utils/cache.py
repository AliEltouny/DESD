from functools import wraps
from django.core.cache import cache
import hashlib
import json
from django.contrib.auth.models import AnonymousUser


def generate_cache_key(prefix, *args, **kwargs):
    """Generate a unique cache key based on provided arguments"""
    # Process args to handle non-serializable types
    processed_args = []
    for arg in args:
        if isinstance(arg, AnonymousUser):
            processed_args.append("AnonymousUser")
        else:
            processed_args.append(arg)
    
    # Process kwargs to handle non-serializable types
    processed_kwargs = {}
    for k, v in kwargs.items():
        if k not in ('request', 'self', 'cls'):
            if isinstance(v, AnonymousUser):
                processed_kwargs[k] = "AnonymousUser"
            else:
                processed_kwargs[k] = v
    
    # Create a deterministic string from processed args and kwargs
    key_data = {
        'args': processed_args,
        'kwargs': processed_kwargs
    }
    
    # Convert to JSON and hash to keep keys at a reasonable length
    key_suffix = hashlib.md5(json.dumps(key_data, sort_keys=True).encode('utf-8')).hexdigest()
    return f"{prefix}:{key_suffix}"


def cached_property(timeout=300):
    """
    Decorator to cache expensive property methods.
    Similar to @property but with caching.
    
    Usage:
        @cached_property(timeout=3600)
        def expensive_property(self):
            # Expensive calculation
            return result
    """
    def decorator(func):
        @property
        @wraps(func)
        def wrapper(self, *args, **kwargs):
            # Generate a unique key for this property on this instance
            key = generate_cache_key(
                f"cached_property:{self.__class__.__name__}:{self.pk}:{func.__name__}",
                *args, **kwargs
            )
            
            # Try to get from cache
            result = cache.get(key)
            if result is None:
                # If not in cache, compute and store
                result = func(self, *args, **kwargs)
                cache.set(key, result, timeout)
            
            return result
        return wrapper
    return decorator


def cached_method(timeout=300):
    """
    Decorator to cache results of instance or class methods.
    
    Usage:
        @cached_method(timeout=3600)
        def expensive_method(self, arg1, arg2):
            # Expensive calculation
            return result
    """
    def decorator(func):
        @wraps(func)
        def wrapper(self, *args, **kwargs):
            # For instance methods, include the instance's class and id in the key
            if hasattr(self, '__class__') and hasattr(self, 'pk'):
                key_prefix = f"cached_method:{self.__class__.__name__}:{self.pk}:{func.__name__}"
            else:
                # For class methods or functions
                key_prefix = f"cached_method:{func.__module__}:{func.__name__}"
            
            # Generate a unique key for this method call
            key = generate_cache_key(key_prefix, *args, **kwargs)
            
            # Try to get from cache
            result = cache.get(key)
            if result is None:
                # If not in cache, compute and store
                result = func(self, *args, **kwargs)
                cache.set(key, result, timeout)
            
            return result
        return wrapper
    return decorator


def invalidate_model_cache(instance):
    """
    Invalidate all cached properties/methods for a specific model instance.
    Call this when an instance is updated/saved.
    """
    pattern = f"cached_*:{instance.__class__.__name__}:{instance.pk}:*"
    cache.delete_pattern(pattern)


def cache_queryset(timeout=300):
    """
    Decorator to cache results of a queryset-returning method.
    Note: This is only appropriate for read-only operations where
    stale data for a short time is acceptable.
    """
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            # Extract class name if method belongs to a class
            if args and hasattr(args[0], '__class__'):
                cls_name = args[0].__class__.__name__
                key_prefix = f"cache_queryset:{cls_name}:{func.__name__}"
            else:
                key_prefix = f"cache_queryset:{func.__module__}:{func.__name__}"
            
            key = generate_cache_key(key_prefix, *args, **kwargs)
            
            # Try to get from cache
            result = cache.get(key)
            if result is None:
                # If not in cache, compute and store
                result = list(func(*args, **kwargs))  # Convert queryset to list
                cache.set(key, result, timeout)
            
            return result
        return wrapper
    return decorator 