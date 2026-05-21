import { z } from 'zod'

export const phonePattern = /^[+0-9][0-9\s().-]{7,19}$/
export const strongPasswordPattern = /^(?=.*[A-Za-z])(?=.*\d).+$/

export const requiredText = (field: string) =>
  z.string().trim().min(1, `${field} is required`)

export const emailSchema = z.string().trim().toLowerCase().email('Enter a valid email address')

export const optionalPhoneSchema = z
  .string()
  .trim()
  .optional()
  .transform((value) => value || null)
  .refine((value) => value === null || phonePattern.test(value), 'Enter a valid phone number')

export const requiredPhoneSchema = z
  .string()
  .trim()
  .min(1, 'Phone number is required')
  .regex(phonePattern, 'Enter a valid phone number')

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(strongPasswordPattern, 'Password must include letters and numbers')

export function isEndAfterStart(startDate?: string, endDate?: string) {
  if (!startDate || !endDate) return true
  return new Date(endDate) > new Date(startDate)
}
