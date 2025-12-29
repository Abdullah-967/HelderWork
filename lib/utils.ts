/**
 * Utility functions for the application
 */

import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Merge Tailwind CSS classes with conflict resolution
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format date to YYYY-MM-DD using local time
 */
export function formatDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Get the next Sunday from a given date
 */
export function getNextSunday(date: Date = new Date()): Date {
  const dayOfWeek = date.getDay()
  const daysUntilSunday = (7 - dayOfWeek) % 7
  const nextSunday = new Date(date)
  nextSunday.setDate(date.getDate() + daysUntilSunday)
  return nextSunday
}

/**
 * Get the Sunday of the current week
 */
export function getWeekStart(date: Date = new Date()): Date {
  const dayOfWeek = date.getDay()
  const sunday = new Date(date)
  sunday.setDate(date.getDate() - dayOfWeek)
  sunday.setHours(0, 0, 0, 0)
  return sunday
}

/**
 * Add days to a date
 */
export function addDays(date: Date, days: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

/**
 * Format date as day name (short)
 */
export function getShortDayName(date: Date): string {
  return date.toLocaleDateString('en-US', { weekday: 'short' })
}

/**
 * Format date as MM/DD
 */
export function getShortDate(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' })
}

/**
 * Get the start and end dates for a week starting on Sunday
 */
export function getWeekRange(startDate: Date): { start: Date; end: Date } {
  const end = new Date(startDate)
  end.setDate(startDate.getDate() + 6)
  return { start: startDate, end }
}

/**
 * Get array of dates for a week
 */
export function getWeekDates(startDate: Date): Date[] {
  const dates: Date[] = []
  for (let i = 0; i < 7; i++) {
    const date = new Date(startDate)
    date.setDate(startDate.getDate() + i)
    dates.push(date)
  }
  return dates
}

/**
 * Get day name from date
 */
export function getDayName(date: Date): string {
  return date.toLocaleDateString('en-US', { weekday: 'long' })
}

/**
 * Check if a date is within a range
 */
export function isDateInRange(
  date: Date,
  start: Date | string,
  end: Date | string
): boolean {
  const checkDate = new Date(date)
  const startDate = new Date(start)
  const endDate = new Date(end)
  return checkDate >= startDate && checkDate <= endDate
}

/**
 * Parse shift part from string
 */
export function parseShiftPart(part: string): 'morning' | 'noon' | 'evening' {
  const normalized = part.toLowerCase()
  if (normalized === 'morning' || normalized === 'noon' || normalized === 'evening') {
    return normalized
  }
  throw new Error(`Invalid shift part: ${part}`)
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Generate username from email
 */
export function generateUsername(email: string): string {
  return email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '')
}

/**
 * Capitalize first letter
 */
export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1)
}
