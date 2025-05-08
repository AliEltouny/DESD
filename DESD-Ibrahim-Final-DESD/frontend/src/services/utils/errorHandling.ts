import axios from 'axios';

interface ErrorHandlerOptions<T> {
  defaultMessage?: string;
  fallbackValue?: T;
  rethrow?: boolean;
}

/**
 * Standardized error handler for API calls
 * @param error The caught error
 * @param context Description of where the error occurred
 * @param options Additional options for handling the error
 * @returns The fallback value if rethrow is false, otherwise never returns (throws)
 */
export const handleApiError = <T = unknown>(
  error: unknown, 
  context: string, 
  options: ErrorHandlerOptions<T> = {}
): T => {
  try {
    const { 
      defaultMessage = "An unexpected error occurred", 
      fallbackValue = [] as unknown as T,
      rethrow = false 
    } = options;

    // Log detailed error information
    let errorMessage = defaultMessage;
    let statusCode: number | undefined;

    // Safely log error
    try {
      console.warn(`Error in ${context}:`, error);
    } catch (logError) {
      console.warn(`Error logging in ${context}`);
    }
    
    // Extract useful info from the error
    try {
      if (axios.isAxiosError(error)) {
        statusCode = error.response?.status;
        const responseData = error.response?.data;
        
        // Safely log response data
        try {
          console.warn(`Status: ${statusCode}`, responseData);
        } catch (logDataError) {
          console.warn(`Error logging response data for ${context}`);
        }
        
        // Extract error message from response
        try {
          if (responseData) {
            if (typeof responseData === 'string') {
              errorMessage = responseData;
            } else if (typeof responseData === 'object') {
              errorMessage = responseData.detail || 
                           responseData.message || 
                           (typeof responseData.error === 'string' ? responseData.error : null) ||
                           error.message || 
                           defaultMessage;
            }
          } else {
            errorMessage = error.message || defaultMessage;
          }
        } catch (messageExtractError) {
          errorMessage = defaultMessage;
        }
        
        // Handle common status codes
        switch (statusCode) {
          case 401:
            console.warn("Authentication error - user not authenticated");
            errorMessage = "Please log in to continue";
            break;
          case 403:
            console.warn("Authorization error - user doesn't have permission");
            errorMessage = "You don't have permission to access this resource";
            break;
          case 404:
            console.warn("Resource not found");
            errorMessage = `${context} not found. It may have been deleted or never existed.`;
            break;
          case 500:
            console.warn("Server error");
            errorMessage = "Server error. Please try again later.";
            break;
          case 0: // Special case for network errors
            console.warn("Network connectivity error");
            errorMessage = "Unable to connect to server. Please check your internet connection.";
            break;
        }
        
        // Special handling for connection errors
        if (error.code === 'ECONNABORTED') {
          errorMessage = "Request timed out. Please try again.";
        } else if (error.code === 'ERR_NETWORK' || error.message?.includes('Network Error')) {
          errorMessage = "Network error. Please check your internet connection or server status.";
        }
      } else if (error instanceof Error) {
        // Handle standard JS errors
        errorMessage = error.message || defaultMessage;
      } else {
        // Handle other types of errors (e.g., strings)
        try {
          console.warn("Non-standard error type:", typeof error, error);
        } catch (typeLogError) {
          console.warn("Unknown error type");
        }
      }
    } catch (errorProcessingError) {
      console.warn("Error while processing error details:", errorProcessingError);
      errorMessage = defaultMessage;
    }
    
    // Rethrow with readable message if needed
    if (rethrow) {
      throw new Error(errorMessage);
    }
    
    // Otherwise return fallback value (must be defined if rethrow is false)
    if (fallbackValue === undefined) {
      // Fallback must be provided if not rethrowing
      console.warn(`handleApiError called without rethrow or fallbackValue for context: ${context}`);
      return [] as unknown as T; // Provide an empty array as ultimate fallback
    }
    
    return fallbackValue;
  } catch (handlerError) {
    // Ultimate fallback if the error handler itself fails
    console.warn("Error in error handler:", handlerError);
    if (options.rethrow) {
      throw new Error(`Error in ${context}. Please try again.`);
    }
    return (options.fallbackValue || []) as unknown as T;
  }
};

/**
 * Processes API response data to handle both paginated and non-paginated responses
 * @param data The response data
 * @param entityName The name of the entity for logging
 * @returns Processed data array
 */
export const processApiResponse = <T>(data: unknown, entityName: string): T[] => {
  // Handle paginated response
  if (data && typeof data === 'object' && 'results' in data && Array.isArray((data as {results: unknown[]}).results)) {
    console.log(`Retrieved ${(data as {results: unknown[]}).results.length} ${entityName} from paginated response`);
    return (data as {results: T[]}).results;
  }
  
  // Handle direct array response
  if (Array.isArray(data)) {
    console.log(`Retrieved ${data.length} ${entityName}`);
    return data as T[];
  }
  
  // If neither, log the issue and return empty array
  console.warn(`Unexpected format for ${entityName}:`, data);
  return [] as T[];
}; 