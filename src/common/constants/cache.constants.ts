/**
 * 🔥 CACHE CONFIGURATION
 * Centralized cache settings for the entire application
 */

export const CACHE_CONFIG = {
  // ⏱️ Default TTL values (in seconds)
  TTL: {
    SHORT: 60,         // 1 minute - for frequently changing data
    MEDIUM: 300,       // 5 minutes - for regular data
    LONG: 600,         // 10 minutes - for stable data
    VERY_LONG: 1800,   // 30 minutes - for very stable data
    HOUR: 3600,        // 1 hour
    DAY: 86400,        // 24 hours
  },

  // 🔄 HTTP methods that should be cached
  CACHEABLE_METHODS: ['GET'],

  // 🗑️ HTTP methods that should invalidate cache
  INVALIDATE_METHODS: ['POST', 'PUT', 'PATCH', 'DELETE'],

  // ❌ Routes that should NEVER be cached (regex patterns)
  EXCLUDED_ROUTES: [
    // Authentication routes
    /\/auth\/login/,
    /\/auth\/register/,
    /\/auth\/refresh/,
    /\/auth\/logout/,
    
    // Payment & financial routes
    /\/payments/,
    /\/checkout/,
    /\/transactions/,
    
    // Real-time data routes
    /\/notifications/,
    /\/chat/,
    /\/live/,
    
    // Admin sensitive routes
    /\/admin\/.*\/delete/,
    /\/admin\/settings/,
    
    // Analytics routes
    /\/analytics/,
    /\/reports/,
    
    // User sensitive data
    /\/users\/balance/,
    /\/users\/wallet/,
    /\/orders\/active/,
  ],

  // ⏱️ Route-specific TTL configuration
  ROUTE_TTL_MAP: {
    // Products
    '/products': 300,                    // 5 minutes - product listings
    '/products/(.*)': 600,              // 10 minutes - product details
    '/products/category/(.*)': 300,     // 5 minutes - category pages
    '/products/search': 180,            // 3 minutes - search results
    '/products/trending': 60,           // 1 minute - trending products
    '/products/featured': 1800,         // 30 minutes - featured products
    
    // Users
    '/users/profile': 1800,             // 30 minutes - user profile
    '/users/(.*)': 600,                 // 10 minutes - user details
    
    // Categories
    '/categories': 3600,                // 1 hour - categories list
    '/categories/(.*)': 3600,           // 1 hour - category details
    
    // Static content
    '/settings/public': 86400,          // 1 day - public settings
    '/content/pages/(.*)': 3600,        // 1 hour - static pages
    '/faqs': 3600,                      // 1 hour - FAQs
    
    // Other
    '/sellers/(.*)': 600,               // 10 minutes - seller info
    '/reviews/(.*)': 300,               // 5 minutes - reviews
  },

  // 🔗 Cache invalidation relationships
  // When namespace X is invalidated, also clear these namespaces
  INVALIDATION_RELATIONSHIPS: {
    'products': ['categories', 'sellers', 'reviews'],
    'users': ['sellers', 'products', 'orders'],
    'orders': ['products', 'users'],
    'categories': ['products'],
    'reviews': ['products'],
  },
};

// 🏷️ Metadata keys for decorators
export const CACHE_KEY_METADATA = 'cache:key';
export const CACHE_TTL_METADATA = 'cache:ttl';
export const NO_CACHE_METADATA = 'cache:disabled';