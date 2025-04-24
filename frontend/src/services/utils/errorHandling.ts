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
  const { 
    defaultMessage = "An unexpected error occurred", 
    fallbackValue = [] as unknown as T,
    rethrow = false 
  } = options;

  // Log detailed error information
  let errorMessage = defaultMessage;
  let statusCode: number | undefined;

  console.error(`Error in ${context}:`, error);
  
  if (axios.isAxiosError(error)) {
    statusCode = error.response?.status;
    const responseData = error.response?.data;
    console.error(`Status: ${statusCode}`, responseData);
    errorMessage = responseData?.detail || responseData?.message || error.message || defaultMessage;
    
    // Handle common status codes
    switch (statusCode) {
      case 401:
        console.error("Authentication error - user not authenticated");
        errorMessage = "Please log in to continue";
        break;
      case 403:
        console.error("Authorization error - user doesn't have permission");
        errorMessage = "You don't have permission to access this resource";
        break;
      case 404:
        console.error("Resource not found");
        errorMessage = `${context} not found. It may have been deleted or never existed.`;
        break;
      case 500:
        console.error("Server error");
        errorMessage = "Server error. Please try again later.";
        break;
    }
  } else if (error instanceof Error) {
    // Handle standard JS errors
    errorMessage = error.message || defaultMessage;
  } else {
    // Handle other types of errors (e.g., strings)
    console.error("Non-standard error type:", typeof error, error);
  }
  
  // Rethrow with readable message if needed
  if (rethrow) {
    throw new Error(errorMessage);
  }
  
  // Otherwise return fallback value (must be defined if rethrow is false)
  if (fallbackValue === undefined) {
    // Fallback must be provided if not rethrowing
    console.error(`handleApiError called without rethrow or fallbackValue for context: ${context}`);
    throw new Error(`API call failed in ${context} and no fallback was specified.`);
  }
  return fallbackValue;
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