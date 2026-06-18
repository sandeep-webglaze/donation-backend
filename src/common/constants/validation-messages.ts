/**
 * Centralized validation messages
 * USE: DTOs mein consistent error messages ke liye
 * BENEFIT: Ek jagah change karo, sab jagah update ho jayega
 */
export const ValidationMessages = {
  // Name validations
  NAME_REQUIRED: 'Name is required',
  NAME_MIN_LENGTH: 'Name must be at least 2 characters',
  NAME_MAX_LENGTH: 'Name must not exceed 50 characters',

  // Email validations
  EMAIL_REQUIRED: 'Email is required',
  EMAIL_INVALID: 'Invalid email format',
  EMAIL_ALREADY_EXISTS: 'Email already exists',

  // Password validations
  PASSWORD_REQUIRED: 'Password is required',
  PASSWORD_MIN_LENGTH: 'Password must be at least 8 characters',
  PASSWORD_WEAK: 'Password must contain uppercase, lowercase, and number',
  PASSWORD_MISMATCH: 'Current password is incorrect',

  // Phone validations
  PHONE_INVALID: 'Invalid phone number',

  // Product validations
  PRODUCT_NAME_REQUIRED: 'Product name is required',
  PRODUCT_PRICE_MIN: 'Price must be greater than 0',
  PRODUCT_STOCK_MIN: 'Stock cannot be negative',

  // General
  FIELD_REQUIRED: (field: string) => `${field} is required`,
  FIELD_INVALID: (field: string) => `Invalid ${field}`,
};