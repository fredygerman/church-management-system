"use server"

import { apiRequest, type ApiResponse } from './api-client'

// ============================================
// Helper Functions
// ============================================

/**
 * GET request helper
 */
export async function apiGet<T = any>(
  endpoint: string, 
  params?: Record<string, any>,
  options?: { skipAuth?: boolean }
): Promise<T> {
  try {
    const response = await apiRequest<T>({
      requestConfig: {
        method: "GET",
        url: endpoint,
        params,
      },
      skipAuth: options?.skipAuth,
    })
    
    // If response is not successful, let the redirect happen if it's a 401
    // Otherwise throw the error
    if (!response.success) {
      throw new Error(response.message || 'API request failed')
    }
    
    return response.data as T
  } catch (error) {
    // Re-throw Next.js control flow errors (redirect, notFound, etc.)
    if (error instanceof Error && (error.message === 'NEXT_REDIRECT' || error.message?.includes('NEXT_REDIRECT'))) {
      throw error
    }
    throw error
  }
}

/**
 * POST request helper
 */
export async function apiPost<T = any>(
  endpoint: string, 
  data?: any,
  options?: { skipAuth?: boolean }
): Promise<T> {
  try {
    const response = await apiRequest<T>({
      requestConfig: {
        method: "POST",
        url: endpoint,
        data,
      },
      skipAuth: options?.skipAuth,
    })
    
    if (!response.success) {
      throw new Error(response.message || 'API request failed')
    }
    
    return response.data as T
  } catch (error) {
    // Re-throw Next.js control flow errors
    if (error instanceof Error && (error.message === 'NEXT_REDIRECT' || error.message?.includes('NEXT_REDIRECT'))) {
      throw error
    }
    throw error
  }
}

/**
 * PUT request helper
 */
export async function apiPut<T = any>(
  endpoint: string, 
  data?: any,
  options?: { skipAuth?: boolean }
): Promise<T> {
  try {
    const response = await apiRequest<T>({
      requestConfig: {
        method: "PUT",
        url: endpoint,
        data,
      },
      skipAuth: options?.skipAuth,
    })
    
    if (!response.success) {
      throw new Error(response.message || 'API request failed')
    }
    
    return response.data as T
  } catch (error) {
    // Re-throw Next.js control flow errors
    if (error instanceof Error && (error.message === 'NEXT_REDIRECT' || error.message?.includes('NEXT_REDIRECT'))) {
      throw error
    }
    throw error
  }
}

/**
 * DELETE request helper
 */
export async function apiDelete<T = any>(
  endpoint: string,
  params?: Record<string, any>,
  options?: { skipAuth?: boolean }
): Promise<T> {
  try {
    const response = await apiRequest<T>({
      requestConfig: {
        method: "DELETE",
        url: endpoint,
        params,
      },
      skipAuth: options?.skipAuth,
    })
    
    if (!response.success) {
      throw new Error(response.message || 'API request failed')
    }
    
    return response.data as T
  } catch (error) {
    // Re-throw Next.js control flow errors
    if (error instanceof Error && (error.message === 'NEXT_REDIRECT' || error.message?.includes('NEXT_REDIRECT'))) {
      throw error
    }
    throw error
  }
}

/**
 * PATCH request helper  
 */
export async function apiPatch<T = any>(
  endpoint: string, 
  data?: any,
  options?: { skipAuth?: boolean }
): Promise<T> {
  try {
    const response = await apiRequest<T>({
      requestConfig: {
        method: "PATCH",
        url: endpoint,
        data,
      },
      skipAuth: options?.skipAuth,
    })
    
    if (!response.success) {
      throw new Error(response.message || 'API request failed')
    }
    
    return response.data as T
  } catch (error) {
    // Re-throw Next.js control flow errors
    if (error instanceof Error && (error.message === 'NEXT_REDIRECT' || error.message?.includes('NEXT_REDIRECT'))) {
      throw error
    }
    throw error
  }
}
