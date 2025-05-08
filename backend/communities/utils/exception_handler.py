from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status
from django.db import IntegrityError
from django.core.exceptions import ValidationError
import logging
import traceback

logger = logging.getLogger(__name__)


def custom_exception_handler(exc, context):
    """
    Custom exception handler that provides more detailed error information.
    """
    # Call REST framework's default exception handler first
    response = exception_handler(exc, context)
    
    # If response is already set, just return it (DRF handled it)
    if response is not None:
        if isinstance(response.data, dict) and not response.data.get('detail'):
            # Reformat validation errors into a standard format
            errors = []
            for field, error_list in response.data.items():
                if isinstance(error_list, list):
                    for error in error_list:
                        errors.append({
                            'field': field,
                            'message': error
                        })
                else:
                    errors.append({
                        'field': field,
                        'message': str(error_list)
                    })
            
            # Reformat response
            response.data = {
                'status': 'error',
                'code': response.status_code,
                'message': 'Validation error',
                'errors': errors
            }
        else:
            # Standard error format for non-validation errors
            response.data = {
                'status': 'error',
                'code': response.status_code,
                'message': response.data.get('detail', str(exc)) if isinstance(response.data, dict) else str(response.data),
            }
        
        return response
    
    # Handle IntegrityError exceptions
    if isinstance(exc, IntegrityError):
        error_message = str(exc)
        
        # Handle specific integrity errors
        if 'unique constraint' in error_message.lower() or 'duplicate key' in error_message.lower():
            # Extract the field name if possible
            field = 'unknown'
            if 'communities_community_slug_key' in error_message:
                field = 'community slug'
            elif 'communities_community_name_key' in error_message:
                field = 'community name'
            
            data = {
                'status': 'error',
                'code': status.HTTP_400_BAD_REQUEST,
                'message': f'A record with this {field} already exists.',
                'errors': [{
                    'field': field,
                    'message': f'A record with this {field} already exists.'
                }]
            }
            return Response(data, status=status.HTTP_400_BAD_REQUEST)
    
    # Handle Django ValidationErrors
    if isinstance(exc, ValidationError):
        if hasattr(exc, 'message_dict'):
            errors = []
            for field, messages in exc.message_dict.items():
                for message in messages:
                    errors.append({
                        'field': field,
                        'message': message
                    })
        else:
            errors = [{
                'field': 'non_field_error',
                'message': str(exc)
            }]
        
        data = {
            'status': 'error',
            'code': status.HTTP_400_BAD_REQUEST,
            'message': 'Validation error',
            'errors': errors
        }
        return Response(data, status=status.HTTP_400_BAD_REQUEST)
    
    # Log unhandled exceptions (this helps with debugging)
    logger.error(f"Unhandled exception: {exc}")
    logger.error(traceback.format_exc())
    
    # Default to a 500 response for unhandled exceptions
    data = {
        'status': 'error',
        'code': status.HTTP_500_INTERNAL_SERVER_ERROR,
        'message': 'An internal server error occurred.'
    }
    return Response(data, status=status.HTTP_500_INTERNAL_SERVER_ERROR) 