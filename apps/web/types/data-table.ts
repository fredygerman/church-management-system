/**
 * Data Table Types
 * Types for data table filtering, sorting, and configuration
 */

import type { Row } from "@tanstack/react-table"
import type { Option } from "./common"

export interface DataTableFilterField<TData> {
  label: string
  value: keyof TData
  placeholder?: string
  options?: Option[]
}

export interface DataTableAdvancedFilterField<TData>
  extends DataTableFilterField<TData> {
  type: any
}

export interface FilterCondition<TData> {
  id: keyof TData
  value: string | string[]
  type: any
  operator: any
}

export interface DataTableRowAction<TData> {
  row: Row<TData>
  type: "update" | "delete"
}

export interface DataTableFilterOption<TData> {
  id: string
  label: string
  value: keyof TData
  options: Option[]
  filterValues?: string[]
  filterOperator?: string
  isMulti?: boolean
}
