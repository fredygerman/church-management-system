/**
 * General/Common Types
 * Shared types used across the application
 */

import type { Row } from "@tanstack/react-table"

export type Genders = "male" | "female" | "others"

export type Prettify<T> = {
  [K in keyof T]: T[K]
} & {}

export interface Option {
  label: string
  value: string
  icon?: React.ComponentType<{ className?: string }>
  count?: number
  withCount?: boolean
}

export interface SearchParams {
  [key: string]: string | string[] | undefined
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface ChartProps {
  data: any
  className?: string
}
