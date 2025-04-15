import axios, { AxiosError } from 'axios';

interface ErrorHandlerOptions {
  defaultMessage?: string;
  fallbackValue?: any;
  rethrow?: boolean;
}

/**
 * Standardized error handler for API calls
 * @param error The caught error
 * @param context Description of where the error occurred
 * @param options Additional options for handling the error
 * @returns The fallback value if rethrow is false
 */
export const handleApiError = (
  error: any, 
  context: string, 
  options: ErrorHandlerOptions = {}
) => {
  const { 
    defaultMessage = "An unexpected error occurred", 
    fallbackValue = [], 
    rethrow = false 
  } = options;

  // Log detailed error information
  console.error(`Error in ${context}:`, error);
  
  if (axios.isAxiosError(error) && error.response) {
    console.error(`Status: ${error.response.status}`, error.response.data);
    
    // Handle common status codes
    switch (error.response.status) {
      case 401:
        console.error("Authentication error - user not authenticated");
        if (rethrow) throw new Error("Please log in to continue");
        break;
      case 403:
        console.error("Authorization error - user doesn't have permission");
        if (rethrow) throw new Error("You don't have permission to access this resource");
        break;
      case 404:
        console.error("Resource not found");
        if (rethrow) throw new Error(`${context} not found. It may have been deleted or never existed.`);
        break;
      case 500:
        console.error("Server error");
        if (rethrow) throw new Error("Server error. Please try again later.");
        break;
    }
  }
  
  // Rethrow with readable message if needed
  if (rethrow) {
    const message = error.response?.data?.detail || 
                   error.response?.data?.message || 
                   error.message || 
                   defaultMessage;
    throw new Error(message);
  }
  
  // Otherwise return fallback value
  return fallbackValue;
};

/**
 * Processes API response data to handle both paginated and non-paginated responses
 * @param data The response data
 * @param entityName The name of the entity for logging
 * @returns Processed data array
 */
export const processApiResponse = <T>(data: any, entityName: string): T[] => {
  // Handle paginated response
  if (data && typeof data === 'object' && 'results' in data) {
    console.log(`Retrieved ${data.results.length} ${entityName} from paginated response`);
    return data.results as T[];
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