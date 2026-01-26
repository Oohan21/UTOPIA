export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePhone = (phone: string): boolean => {
  // Basic validation: allows +, (), -, space, and digits.
  // Checks if there are at least 10 digits.
  const digits = phone.replace(/\D/g, '');
  return digits.length >= 10 && digits.length <= 15;
};

export const sanitizeInput = (input: string): string => {
  return input ? input.trim() : '';
};