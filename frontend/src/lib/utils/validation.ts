// src/lib/utils/validation.ts
export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

export interface AuthValidationErrors {
  email?: string[];
  password?: string[];
  first_name?: string[];
  last_name?: string[];
  phone_number?: string[];
  non_field_errors?: string[];
  [key: string]: string[] | undefined;
}

// Enhanced email validation
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(email)) return false;
  
  // Additional checks
  if (email.length > 254) return false;
  if (email.split('@')[0].length > 64) return false;
  
  return true;
};

// Enhanced phone validation for Ethiopia
export const validatePhone = (phone: string): boolean => {
  const phoneRegex = /^(?:\+251|0)(?:9[0-9]{8}|[1-9][0-9]{7})$/;
  return phoneRegex.test(phone.replace(/\s+/g, ''));
};

// Enhanced password validation
export const validatePassword = (password: string): ValidationResult => {
  const errors: Record<string, string> = {};
  
  if (password.length < 8) {
    errors.length = 'Password must be at least 8 characters long';
  }
  if (password.length > 128) {
    errors.maxLength = 'Password cannot exceed 128 characters';
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
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.special = 'Password must contain at least one special character';
  }
  
  // Check for common weak passwords
  const weakPasswords = ['password123', '12345678', 'qwerty123', 'admin123'];
  if (weakPasswords.includes(password.toLowerCase())) {
    errors.weak = 'Password is too common. Please choose a stronger password';
  }
  
  // Check for sequential characters
  if (/(.)\1{2,}/.test(password)) {
    errors.sequential = 'Password contains repeating characters';
  }
  
  // Check for sequential numbers
  if (/123|234|345|456|567|678|789|890/.test(password)) {
    errors.sequentialNumbers = 'Password contains sequential numbers';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

// Validate names
export const validateName = (name: string): ValidationResult => {
  const errors: Record<string, string> = {};
  
  if (!name.trim()) {
    errors.required = 'Name is required';
  } else if (name.trim().length < 2) {
    errors.minLength = 'Name must be at least 2 characters';
  } else if (name.trim().length > 50) {
    errors.maxLength = 'Name cannot exceed 50 characters';
  } else if (!/^[a-zA-Z\s\-']+$/.test(name)) {
    errors.format = 'Name can only contain letters, spaces, hyphens, and apostrophes';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

// Enhanced property validation
export const validateProperty = (property: any): ValidationResult => {
  const errors: Record<string, string> = {};
  
  // Title validation
  if (!property.title || property.title.trim().length < 5) {
    errors.title = 'Title must be at least 5 characters long';
  } else if (property.title.trim().length > 200) {
    errors.title = 'Title cannot exceed 200 characters';
  }
  
  // Price validation
  if (!property.price_etb || isNaN(property.price_etb)) {
    errors.price_etb = 'Valid price is required';
  } else if (property.price_etb <= 0) {
    errors.price_etb = 'Price must be greater than 0';
  } else if (property.price_etb > 1000000000000) {
    errors.price_etb = 'Price is too high';
  }
  
  // Property type validation
  const validPropertyTypes = ['house', 'apartment', 'land', 'commercial', 'other'];
  if (!property.property_type || !validPropertyTypes.includes(property.property_type)) {
    errors.property_type = 'Valid property type is required';
  }
  
  // Transaction type validation
  const validTransactionTypes = ['sale', 'rent', 'lease'];
  if (!property.transaction_type || !validTransactionTypes.includes(property.transaction_type)) {
    errors.transaction_type = 'Valid transaction type is required';
  }
  
  // Bedrooms validation
  if (!property.bedrooms || isNaN(property.bedrooms) || property.bedrooms < 0) {
    errors.bedrooms = 'Valid number of bedrooms is required';
  } else if (property.bedrooms > 50) {
    errors.bedrooms = 'Number of bedrooms is too high';
  }
  
  // Bathrooms validation
  if (!property.bathrooms || isNaN(property.bathrooms) || property.bathrooms < 0) {
    errors.bathrooms = 'Valid number of bathrooms is required';
  } else if (property.bathrooms > 50) {
    errors.bathrooms = 'Number of bathrooms is too high';
  }
  
  // Area validation
  if (!property.area_sqm || isNaN(property.area_sqm) || property.area_sqm <= 0) {
    errors.area_sqm = 'Valid area is required (greater than 0)';
  } else if (property.area_sqm > 1000000) {
    errors.area_sqm = 'Area is too large';
  }
  
  // City validation
  if (!property.city || property.city.trim().length < 2) {
    errors.city = 'Valid city name is required';
  } else if (property.city.trim().length > 100) {
    errors.city = 'City name is too long';
  }
  
  // Address validation
  if (!property.address || property.address.trim().length < 5) {
    errors.address = 'Address must be at least 5 characters long';
  } else if (property.address.trim().length > 500) {
    errors.address = 'Address is too long';
  }
  
  // Description validation (if exists)
  if (property.description && property.description.length > 5000) {
    errors.description = 'Description cannot exceed 5000 characters';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

// Enhanced valuation request validation
export const validateValuationRequest = (data: any): ValidationResult => {
  const errors: Record<string, string> = {};
  
  if (!data.address || data.address.trim().length < 5) {
    errors.address = 'Address must be at least 5 characters long';
  }
  
  if (!data.city || data.city.trim().length < 2) {
    errors.city = 'Valid city name is required';
  }
  
  if (!data.property_type) {
    errors.property_type = 'Property type is required';
  }
  
  if (!data.bedrooms || isNaN(data.bedrooms) || data.bedrooms < 0) {
    errors.bedrooms = 'Valid number of bedrooms is required';
  }
  
  if (!data.bathrooms || isNaN(data.bathrooms) || data.bathrooms < 0) {
    errors.bathrooms = 'Valid number of bathrooms is required';
  }
  
  if (!data.area_sqm || isNaN(data.area_sqm) || data.area_sqm <= 0) {
    errors.area_sqm = 'Valid area is required (greater than 0)';
  }
  
  // Contact information validation
  if (data.contact_email && !validateEmail(data.contact_email)) {
    errors.contact_email = 'Valid email is required';
  }
  
  if (data.contact_phone && !validatePhone(data.contact_phone)) {
    errors.contact_phone = 'Valid phone number is required';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

// Enhanced input sanitization
export const sanitizeInput = (input: string): string => {
  return input
    .trim()
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    .replace(/\n/g, '<br>')
    .replace(/\r/g, '')
    .substring(0, 1000); // Limit input length
};

// Validate price range
export const validatePriceRange = (min: number | undefined, max: number | undefined): boolean => {
  if (min !== undefined && max !== undefined && min > max) {
    return false;
  }
  if (min !== undefined && min < 0) {
    return false;
  }
  if (max !== undefined && max < 0) {
    return false;
  }
  return true;
};

// Validate date range
export const validateDateRange = (startDate: Date, endDate: Date): boolean => {
  return startDate <= endDate;
};

// Validate image file
export const validateImageFile = (file: File): ValidationResult => {
  const errors: Record<string, string> = {};
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  const maxSize = 10 * 1024 * 1024; // 10MB
  
  if (!validTypes.includes(file.type)) {
    errors.type = 'Invalid file type. Only JPEG, PNG, and WebP are allowed';
  }
  
  if (file.size > maxSize) {
    errors.size = 'File size cannot exceed 10MB';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

// Parse API error response
export const parseApiError = (error: any): string[] => {
  const errors: string[] = [];
  
  if (error.response?.data) {
    const errorData = error.response.data;
    
    if (typeof errorData === 'string') {
      errors.push(errorData);
    } else if (typeof errorData === 'object') {
      Object.entries(errorData).forEach(([field, messages]) => {
        if (Array.isArray(messages)) {
          messages.forEach((message: string) => {
            errors.push(`${field}: ${message}`);
          });
        } else if (typeof messages === 'string') {
          errors.push(messages);
        }
      });
    }
  } else if (error.message) {
    errors.push(error.message);
  } else {
    errors.push('An unknown error occurred');
  }
  
  return errors;
};

// Validate form field in real-time
export const validateField = (name: string, value: string): string | null => {
  switch (name) {
    case 'email':
      if (!value.trim()) return 'Email is required';
      if (!validateEmail(value)) return 'Invalid email format';
      break;
      
    case 'phone_number':
      if (!value.trim()) return 'Phone number is required';
      if (!validatePhone(value)) return 'Invalid phone number format';
      break;
      
    case 'password':
      const passwordResult = validatePassword(value);
      if (!passwordResult.isValid) {
        return Object.values(passwordResult.errors)[0];
      }
      break;
      
    case 'first_name':
    case 'last_name':
      const nameResult = validateName(value);
      if (!nameResult.isValid) {
        return Object.values(nameResult.errors)[0];
      }
      break;
      
    case 'title':
      if (!value.trim()) return 'Title is required';
      if (value.trim().length < 5) return 'Title must be at least 5 characters';
      break;
  }
  
  return null;
};