/**
 * Error handling utilities for the application
 */

export interface ApiErrorResponse {
  success: false
  message: string
  error?: any
  statusCode: number
  timestamp: string
  path: string
}

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public details?: any
  ) {
    super(message)
    this.name = 'ApiError'
  }

  static fromResponse(response: ApiErrorResponse): ApiError {
    return new ApiError(response.statusCode, response.message, response.error)
  }

  isNetworkError(): boolean {
    return this.statusCode === 0
  }

  isAuthError(): boolean {
    return this.statusCode === 401
  }

  isForbiddenError(): boolean {
    return this.statusCode === 403
  }

  isNotFoundError(): boolean {
    return this.statusCode === 404
  }

  isServerError(): boolean {
    return this.statusCode >= 500
  }

  isClientError(): boolean {
    return this.statusCode >= 400 && this.statusCode < 500
  }

  getDisplayMessage(): string {
    if (this.isNetworkError()) {
      return 'Network connection error. Please check your internet connection.'
    }
    if (this.isAuthError()) {
      return 'Your session has expired. Please sign in again.'
    }
    if (this.isForbiddenError()) {
      return 'You do not have permission to access this resource.'
    }
    if (this.isNotFoundError()) {
      return 'The resource you are looking for does not exist.'
    }
    if (this.isServerError()) {
      return 'A server error occurred. Please try again later.'
    }
    return this.message || 'An unexpected error occurred.'
  }
}

/**
 * Check if an error is an API error response
 */
export function isApiErrorResponse(data: any): data is ApiErrorResponse {
  return (
    data &&
    typeof data === 'object' &&
    'success' in data &&
    data.success === false &&
    'message' in data &&
    'statusCode' in data
  )
}

/**
 * Handle API errors consistently
 */
export function handleApiError(error: any): never {
  if (isApiErrorResponse(error)) {
    throw ApiError.fromResponse(error)
  }

  if (error instanceof Error) {
    throw new ApiError(0, error.message, { originalError: error })
  }

  throw new ApiError(0, 'An unknown error occurred', { originalError: error })
}

/**
 * Get user-friendly error message
 */
export function getUserFriendlyMessage(error: any): string {
  if (error instanceof ApiError) {
    return error.getDisplayMessage()
  }

  if (error instanceof Error) {
    return error.message || 'An unexpected error occurred.'
  }

  return 'An unexpected error occurred.'
}

/**
 * Detect error type for better UI handling
 */
export function getErrorType(error: any): 'auth' | 'server' | 'client' | 'network' | 'unknown' {
  if (error instanceof ApiError) {
    if (error.isAuthError()) return 'auth'
    if (error.isServerError()) return 'server'
    if (error.isClientError()) return 'client'
    if (error.isNetworkError()) return 'network'
  }

  if (error instanceof Error) {
    const message = error.message.toLowerCase()
    if (message.includes('auth') || message.includes('unauthorized')) return 'auth'
    if (message.includes('network') || message.includes('fetch')) return 'network'
  }

  return 'unknown'
}
