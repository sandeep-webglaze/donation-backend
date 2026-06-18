/**
 * Centralized error messages
 * USE: Services aur controllers mein consistent errors ke liye
 */
export const ErrorMessages = {
  // User errors
  USER_NOT_FOUND: 'User not found',
  USER_ALREADY_EXISTS: 'User already exists',
  USER_INACTIVE: 'User account is deactivated',
  USER_UNAUTHORIZED: 'Unauthorized to perform this action',

  // Auth errors
  INVALID_CREDENTIALS: 'Invalid email or password',
  TOKEN_MISSING: 'Access token missing',
  TOKEN_INVALID: 'Invalid or expired token',

  // Product errors
  PRODUCT_NOT_FOUND: 'Product not found',
  PRODUCT_UPDATE_FORBIDDEN: 'You can only update your own products',
  PRODUCT_DELETE_FORBIDDEN: 'You can only delete your own products',

  // Generic errors
  INTERNAL_SERVER_ERROR: 'Internal server error',
  VALIDATION_FAILED: 'Validation failed',
  DUPLICATE_ENTRY: 'Duplicate entry detected',
};


