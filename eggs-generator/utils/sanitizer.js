import { escape } from 'validator';

/**
 * Sanitizes input data by removing potentially dangerous characters and escaping values
 * @param {Object} data - The input data to sanitize
 * @returns {Object} - Sanitized data
 */
export const sanitizeInput = (data) => {
  if (!data || typeof data !== 'object') {
    return data;
  }

  const sanitized = {};
  
  for (const [key, value] of Object.entries(data)) {
    if (typeof value === 'string') {
      sanitized[key] = escape(value);
    } else if (typeof value === 'number') {
      sanitized[key] = Number(value);
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map(item => sanitizeInput(item));
    } else if (typeof value === 'object') {
      sanitized[key] = sanitizeInput(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
};

/**
 * Sanitizes MongoDB query operators
 * @param {Object} query - The query object to sanitize
 * @returns {Object} - Sanitized query
 */
export const sanitizeMongoQuery = (query) => {
  const allowedOperators = ['$eq', '$ne', '$gt', '$gte', '$lt', '$lte', '$in', '$nin'];
  const sanitized = {};

  for (const [key, value] of Object.entries(query)) {
    if (key.startsWith('$')) {
      if (allowedOperators.includes(key)) {
        sanitized[key] = sanitizeInput(value);
      }
    } else {
      sanitized[key] = sanitizeInput(value);
    }
  }

  return sanitized;
}; 