/**
 * Validate email format
 */
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate password strength
 * Minimum 8 characters, at least one uppercase, one lowercase, one number
 */
export const validatePassword = (password) => {
  if (password.length < 8) {
    return { valid: false, message: 'Password must be at least 8 characters long' };
  }
  
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one uppercase letter' };
  }
  
  if (!/[a-z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one lowercase letter' };
  }
  
  if (!/[0-9]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one number' };
  }
  
  return { valid: true, message: 'Password is strong' };
};

/**
 * Validate phone number (Indian format)
 */
export const validatePhone = (phone) => {
  const phoneRegex = /^[6-9]\d{9}$/;
  return phoneRegex.test(phone);
};

/**
 * Validate name (only letters and spaces)
 */
export const validateName = (name) => {
  if (!name || name.trim().length < 2) {
    return { valid: false, message: 'Name must be at least 2 characters long' };
  }
  
  if (!/^[a-zA-Z\s]+$/.test(name)) {
    return { valid: false, message: 'Name can only contain letters and spaces' };
  }
  
  return { valid: true, message: 'Valid name' };
};

/**
 * Validate required field
 */
export const validateRequired = (value, fieldName = 'This field') => {
  if (!value || (typeof value === 'string' && value.trim().length === 0)) {
    return { valid: false, message: `${fieldName} is required` };
  }
  return { valid: true, message: '' };
};

/**
 * Validate number range
 */
export const validateNumberRange = (value, min, max, fieldName = 'Value') => {
  const num = Number(value);
  
  if (isNaN(num)) {
    return { valid: false, message: `${fieldName} must be a number` };
  }
  
  if (num < min || num > max) {
    return { valid: false, message: `${fieldName} must be between ${min} and ${max}` };
  }
  
  return { valid: true, message: '' };
};

/**
 * Validate date (must be today or future)
 */
export const validateFutureDate = (date) => {
  const selectedDate = new Date(date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  if (selectedDate < today) {
    return { valid: false, message: 'Date must be today or in the future' };
  }
  
  return { valid: true, message: '' };
};

/**
 * Validate form data
 */
export const validateForm = (data, rules) => {
  const errors = {};
  
  Object.keys(rules).forEach((field) => {
    const rule = rules[field];
    const value = data[field];
    
    if (rule.required) {
      const result = validateRequired(value, rule.label || field);
      if (!result.valid) {
        errors[field] = result.message;
        return;
      }
    }
    
    if (rule.type === 'email' && value) {
      if (!validateEmail(value)) {
        errors[field] = 'Please enter a valid email address';
      }
    }
    
    if (rule.type === 'password' && value) {
      const result = validatePassword(value);
      if (!result.valid) {
        errors[field] = result.message;
      }
    }
    
    if (rule.type === 'phone' && value) {
      if (!validatePhone(value)) {
        errors[field] = 'Please enter a valid 10-digit phone number';
      }
    }
    
    if (rule.type === 'name' && value) {
      const result = validateName(value);
      if (!result.valid) {
        errors[field] = result.message;
      }
    }
    
    if (rule.minLength && value && value.length < rule.minLength) {
      errors[field] = `${rule.label || field} must be at least ${rule.minLength} characters`;
    }
    
    if (rule.maxLength && value && value.length > rule.maxLength) {
      errors[field] = `${rule.label || field} must not exceed ${rule.maxLength} characters`;
    }
    
    if (rule.match && data[rule.match] !== value) {
      errors[field] = `${rule.label || field} does not match`;
    }
  });
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

/**
 * Sanitize user input (remove HTML tags)
 */
export const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  return input.replace(/<[^>]*>/g, '').trim();
};

/**
 * Validate URL format
 */
export const validateURL = (url) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

export default {
  validateEmail,
  validatePassword,
  validatePhone,
  validateName,
  validateRequired,
  validateNumberRange,
  validateFutureDate,
  validateForm,
  sanitizeInput,
  validateURL,
};