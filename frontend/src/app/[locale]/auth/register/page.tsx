"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/hooks/useAuth";
import { authApi } from "@/lib/api/auth";
import type { RegisterData } from "@/lib/types/user";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/Card";
import { Label } from "@/components/ui/Label";
import toast from "react-hot-toast";
import { Eye, EyeOff, Loader2, AlertCircle } from "lucide-react";
import { validateEmail, validatePhone, validatePassword, sanitizeInput } from "@/lib/utils/validation";

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    password2: "",
    first_name: "",
    last_name: "",
    phone_number: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const router = useRouter();
  const { register } = useAuth();

  const validateForm = (): boolean => {
    const errors: string[] = [];
    const fieldErrors: Record<string, string> = {};

    // Validate email
    if (!formData.email.trim()) {
      errors.push("Email is required");
      fieldErrors.email = "Email is required";
    } else if (!validateEmail(formData.email)) {
      errors.push("Invalid email format");
      fieldErrors.email = "Invalid email format";
    }

    // Validate names
    if (!formData.first_name.trim()) {
      errors.push("First name is required");
      fieldErrors.first_name = "First name is required";
    } else if (formData.first_name.trim().length < 2) {
      errors.push("First name must be at least 2 characters");
      fieldErrors.first_name = "First name must be at least 2 characters";
    }

    if (!formData.last_name.trim()) {
      errors.push("Last name is required");
      fieldErrors.last_name = "Last name is required";
    } else if (formData.last_name.trim().length < 2) {
      errors.push("Last name must be at least 2 characters");
      fieldErrors.last_name = "Last name must be at least 2 characters";
    }

    // Validate phone number
    if (!formData.phone_number.trim()) {
      errors.push("Phone number is required");
      fieldErrors.phone_number = "Phone number is required";
    } else if (!validatePhone(formData.phone_number)) {
      errors.push("Invalid phone number format. Use +251 followed by 9 digits");
      fieldErrors.phone_number = "Invalid phone number format";
    }

    // Validate passwords
    const passwordValidation = validatePassword(formData.password);
    if (!passwordValidation.isValid) {
      errors.push(...Object.values(passwordValidation.errors));
      fieldErrors.password = Object.values(passwordValidation.errors).join(", ");
    }

    if (formData.password !== formData.password2) {
      errors.push("Passwords don't match");
      fieldErrors.password2 = "Passwords don't match";
    }

    setFormErrors(errors);
    setFieldErrors(fieldErrors);

    return errors.length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });

    // Clear field-specific errors when user starts typing
    if (fieldErrors[name]) {
      setFieldErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }

    // Clear general form errors
    if (formErrors.length > 0) {
      setFormErrors([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Please fix the errors in the form");
      return;
    }

    const registrationData: RegisterData = {
      email: sanitizeInput(formData.email.toLowerCase()),
      password: sanitizeInput(formData.password),
      password2: sanitizeInput(formData.password2),
      first_name: sanitizeInput(formData.first_name),
      last_name: sanitizeInput(formData.last_name),
      phone_number: sanitizeInput(formData.phone_number),
      user_type: "user",
    };

    setIsLoading(true);

    try {
      // Use the store's register method instead of direct API call
      const result = await register(registrationData);

      if (result.user) {
        toast.success("Registration successful! Please check your email for verification.");

        // Store user info for verification page
        sessionStorage.setItem('pending_verification_email', formData.email);
        sessionStorage.setItem('pending_user_id', result.user.id);

        // Show debug link in development
        if (result.debug_verification_link) {
          console.log("Debug verification link:", result.debug_verification_link);
          toast.success(`Verification link: ${result.debug_verification_link}`, {
            duration: 10000,
          });
        }

        // Redirect to verification page
        router.push(`/auth/verify-email?email=${encodeURIComponent(formData.email)}&new_user=true`);
      } else {
        toast.error("Registration failed - no user data returned");
      }
    } catch (error: any) {
      // Error handling remains similar but uses store state
      const errorMessage = error.message || "Registration failed";
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-gray-50 dark:from-gray-900 dark:to-gray-800 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Create Account</CardTitle>
          <CardDescription className="text-center">
            Join UTOPIA - Ethiopian Real Estate Platform
          </CardDescription>
        </CardHeader>

        {formErrors.length > 0 && (
          <div className="mx-6 mb-4 rounded-md bg-destructive/10 p-3">
            <div className="flex items-start">
              <AlertCircle className="mr-2 mt-0.5 h-4 w-4 text-destructive flex-shrink-0" />
              <div className="space-y-1">
                {formErrors.map((error, index) => (
                  <p key={index} className="text-sm font-medium text-destructive">
                    {error}
                  </p>
                ))}
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first_name" className={fieldErrors.first_name ? "text-destructive" : ""}>
                  First Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="first_name"
                  name="first_name"
                  placeholder="John"
                  value={formData.first_name}
                  onChange={handleChange}
                  disabled={isLoading}
                  required
                  error={fieldErrors.first_name}
                  aria-invalid={!!fieldErrors.first_name}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last_name" className={fieldErrors.last_name ? "text-destructive" : ""}>
                  Last Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="last_name"
                  name="last_name"
                  placeholder="Doe"
                  value={formData.last_name}
                  onChange={handleChange}
                  disabled={isLoading}
                  required
                  error={fieldErrors.last_name}
                  aria-invalid={!!fieldErrors.last_name}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className={fieldErrors.email ? "text-destructive" : ""}>
                Email <span className="text-red-500">*</span>
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={handleChange}
                disabled={isLoading}
                required
                error={fieldErrors.email}
                aria-invalid={!!fieldErrors.email}
              />
              <p className="text-xs text-gray-500">
                This will be your username for login
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone_number" className={fieldErrors.phone_number ? "text-destructive" : ""}>
                Phone Number <span className="text-red-500">*</span>
              </Label>
              <Input
                id="phone_number"
                name="phone_number"
                placeholder="+251911223344"
                value={formData.phone_number}
                onChange={handleChange}
                disabled={isLoading}
                required
                error={fieldErrors.phone_number}
                aria-invalid={!!fieldErrors.phone_number}
              />
              <p className="text-xs text-gray-500">
                Format: +251911223344 (Ethiopian format)
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="password" className={fieldErrors.password ? "text-destructive" : ""}>
                  Password <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="At least 8 characters"
                    value={formData.password}
                    onChange={handleChange}
                    disabled={isLoading}
                    required
                    minLength={8}
                    error={fieldErrors.password}
                    aria-invalid={!!fieldErrors.password}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 disabled:opacity-50"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password2" className={fieldErrors.password2 ? "text-destructive" : ""}>
                  Confirm Password <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="password2"
                    name="password2"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm your password"
                    value={formData.password2}
                    onChange={handleChange}
                    disabled={isLoading}
                    required
                    minLength={8}
                    error={fieldErrors.password2}
                    aria-invalid={!!fieldErrors.password2}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 disabled:opacity-50"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    disabled={isLoading}
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            </div>

            <div className="text-sm text-gray-600 dark:text-gray-400">
              By creating an account, you agree to our{" "}
              <Link href="/terms" className="text-blue-600 hover:text-blue-800 dark:text-blue-400">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link href="/privacy" className="text-blue-600 hover:text-blue-800 dark:text-blue-400">
                Privacy Policy
              </Link>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
              aria-busy={isLoading}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isLoading ? "Creating Account..." : "Create Account"}
            </Button>
            <div className="text-center text-sm text-gray-600 dark:text-gray-400">
              Already have an account?{" "}
              <Link
                href="/auth/login"
                className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
              >
                Sign in
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}