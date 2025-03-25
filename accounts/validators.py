from django.core.exceptions import ValidationError
from django.contrib.auth.password_validation import validate_password as django_validate_password
import re

class CustomPasswordValidator:
    def validate(self, password, user=None):
        # First run Django's built-in validation
        django_validate_password(password)
        
        # Additional custom validation
        errors = []
        
        if len(password) < 8:
            errors.append("Password must be at least 8 characters long.")
        if not re.search(r'[A-Z]', password):
            errors.append("Password must contain at least one uppercase letter.")
        if not re.search(r'[a-z]', password):
            errors.append("Password must contain at least one lowercase letter.")
        if not re.search(r'[0-9]', password):
            errors.append("Password must contain at least one number.")
        if not re.search(r'[!@#$%^&*(),.?\":{}|<>]', password):
            errors.append("Password must contain at least one special character.")
            
        if errors:
            raise ValidationError(errors)

    def get_help_text(self):
        return (
            "Your password must be at least 8 characters long, contain an uppercase letter, "
            "a lowercase letter, a number, and a special character."
        )
