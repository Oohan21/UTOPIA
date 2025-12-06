// src/lib/utils/validation.ts
export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePhone = (phone: string): boolean => {
  const phoneRegex = /^(\+251|0)[79]\d{8}$/;
  return phoneRegex.test(phone);
};

export const validatePassword = (password: string): ValidationResult => {
  const errors: Record<string, string> = {};
  
  if (password.length < 8) {
    errors.length = 'Password must be at least 8 characters long';
  }
  if (!/[A-Z]/.test(password)) {
    errors.uppercase = 'Password must contain at least one uppercase letter';
  }
  if (!/[a-z]/.test(password)) {
    errors.lowercase = 'Password must contain at least one lowercase letter';
  }
  if (!/\d/.test(password)) {
    errors.number = 'Password must contain at least one number';
  }
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.special = 'Password must contain at least one special character';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

export const validateProperty = (property: any): ValidationResult => {
  const errors: Record<string, string> = {};
  
  if (!property.title || property.title.trim().length < 5) {
    errors.title = 'Title must be at least 5 characters long';
  }
  
  if (!property.price_etb || property.price_etb <= 0) {
    errors.price_etb = 'Price must be greater than 0';
  }
  
  if (!property.property_type) {
    errors.property_type = 'Property type is required';
  }
  
  if (!property.transaction_type) {
    errors.transaction_type = 'Transaction type is required';
  }
  
  if (!property.bedrooms || property.bedrooms < 0) {
    errors.bedrooms = 'Bedrooms must be 0 or more';
  }
  
  if (!property.bathrooms || property.bathrooms < 0) {
    errors.bathrooms = 'Bathrooms must be 0 or more';
  }
  
  if (!property.area_sqm || property.area_sqm <= 0) {
    errors.area_sqm = 'Area must be greater than 0';
  }
  
  if (!property.city) {
    errors.city = 'City is required';
  }
  
  if (!property.address || property.address.trim().length < 5) {
    errors.address = 'Address must be at least 5 characters long';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

export const validateValuationRequest = (data: any): ValidationResult => {
  const errors: Record<string, string> = {};
  
  if (!data.address || data.address.trim().length < 5) {
    errors.address = 'Address must be at least 5 characters long';
  }
  
  if (!data.city) {
    errors.city = 'City is required';
  }
  
  if (!data.property_type) {
    errors.property_type = 'Property type is required';
  }
  
  if (!data.bedrooms || data.bedrooms < 0) {
    errors.bedrooms = 'Bedrooms must be 0 or more';
  }
  
  if (!data.bathrooms || data.bathrooms < 0) {
    errors.bathrooms = 'Bathrooms must be 0 or more';
  }
  
  if (!data.area_sqm || data.area_sqm <= 0) {
    errors.area_sqm = 'Area must be greater than 0';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

export const sanitizeInput = (input: string): string => {
  return input
    .trim()
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

export const validatePriceRange = (min: number, max: number): boolean => {
  if (min && max && min > max) {
    return false;
  }
  return true;
};