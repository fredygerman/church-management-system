"use server"

import { redirect } from "next/navigation"
import { getSession } from "@/auth"
import axios, { type AxiosRequestConfig } from "axios"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  meta?: any
}

/**
 * Create axios instance with auth headers
 */
async function createAuthenticatedAxios() {
  const session = await getSession()
  
  if (!session?.accessToken) {
    redirect('/auth/signin')
  }

  return axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache',
      'Authorization': `Bearer ${session.accessToken}`,
      'X-User-Email': session.user?.email || '',
    },
  })
}

/**
 * Make an API request with automatic auth handling
 * @param method HTTP method (GET, POST, PUT, DELETE, etc)
 * @param endpoint API endpoint (e.g., '/members', '/members/123')
 * @param data Optional request body
 * @returns The response data
 */
export async function apiRequest<T = any>(
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
  endpoint: string,
  data?: any
): Promise<T> {
  try {
    const axiosInstance = await createAuthenticatedAxios()
    
    const response = await axiosInstance<ApiResponse<T>>({
      method,
      url: endpoint,
      ...(data && { data }),
    })

    if (!response.data?.success) {
      throw new Error(response.data?.message || 'API request failed')
    }

    return response.data.data as T
  } catch (error) {
    // Re-throw Next.js control flow errors (redirect, notFound, etc)
    if (error instanceof Error && error.message === 'NEXT_REDIRECT') {
      throw error
    }

    if (axios.isAxiosError(error)) {
      if (error.response?.status === 401) {
        redirect('/auth/signin')
      }
      throw new Error(error.response?.data?.message || error.message)
    }
    throw error
  }
}

/**
 * GET request helper
 */
export async function apiGet<T = any>(endpoint: string): Promise<T> {
  return apiRequest<T>('GET', endpoint)
}

/**
 * POST request helper
 */
export async function apiPost<T = any>(endpoint: string, data?: any): Promise<T> {
  return apiRequest<T>('POST', endpoint, data)
}

/**
 * PUT request helper
 */
export async function apiPut<T = any>(endpoint: string, data?: any): Promise<T> {
  return apiRequest<T>('PUT', endpoint, data)
}

/**
 * DELETE request helper
 */
export async function apiDelete<T = any>(endpoint: string): Promise<T> {
  return apiRequest<T>('DELETE', endpoint)
}
