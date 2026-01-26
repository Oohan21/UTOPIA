"use client";

import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import Header from "@/components/common/Header/Header";
import { apiClient } from "@/lib/api/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Label } from "@/components/ui/Label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import {
  Edit2,
  Save,
  X,
  Upload,
  User,
  Key,
  Activity,
  Camera,
  Trash2,
  Loader2,
  AlertCircle,
  Phone,
  Mail,
  Calendar,
  MapPin,
  Globe,
  Link as LinkIcon,
  Eye,
  Search,
  MessageSquare,
  Heart,
  Shield,
  LogOut,
  Building,
  Home,
  Smartphone,
  Menu,
  ChevronRight
} from "lucide-react";
import toast from "react-hot-toast";
import { useUserActivity } from "@/lib/hooks/useUserActivity";
import type { UserProfile, Activity as ActivityType } from "@/lib/types/user";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

export default function AccountPage() {
  const { user, updateUser, updateProfilePicture, removeProfilePicture, logout, checkAuth, rehydrateFromSession } = useAuth();
  const { activities, stats, isLoading: isLoadingActivities } = useUserActivity();
  const [isEditing, setIsEditing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [activeTab, setActiveTab] = useState<"profile" | "password" | "activity">("profile");
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const t = useTranslations();
  const tCommon = useTranslations('common');
  const tAccount = useTranslations('account');

  // Basic user form
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    phone_number: "",
    bio: "",
  });

  // Profile form
  const [profileFormData, setProfileFormData] = useState<UserProfile>({
    id: 0,
    user: 0,
    date_of_birth: "",
    gender: "",
    address: "",
    city: "",
    sub_city: "",
    postal_code: "",
    occupation: "",
    company: "",
    website: "",
    facebook_url: "",
    twitter_url: "",
    linkedin_url: "",
    instagram_url: "",
    created_at: "",
    updated_at: "",
  });

  // Password change form
  const [passwordData, setPasswordData] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });

  // Delete account confirmation
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteReason, setDeleteReason] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize form data when user loads
  useEffect(() => {
    if (user) {
      setFormData({
        first_name: user.first_name || "",
        last_name: user.last_name || "",
        phone_number: user.phone_number || "",
        bio: user.bio || "",
      });

      // Fetch profile data
      fetchProfileData();
    }
  }, [user]);

  // Fetch profile data from API
  const fetchProfileData = async () => {
    if (!user) return;

    setIsLoadingProfile(true);
    try {
      const response = await apiClient.get('/auth/profile/');

      if (response.status === 200) {
        const profileData = response.data;

        // Format date for input field
        let dateOfBirth = "";
        if (profileData.date_of_birth) {
          const date = new Date(profileData.date_of_birth);
          dateOfBirth = date.toISOString().split('T')[0];
        }

        setProfileFormData({
          ...profileData,
          date_of_birth: dateOfBirth,
        });
      } else {
        console.log("No profile found, will create one on update");
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setIsLoadingProfile(false);
    }
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleProfileFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    setProfileFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswordData({
      ...passwordData,
      [e.target.name]: e.target.value,
    });
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isUpdatingProfile) return;

    setIsUpdatingProfile(true);

    try {
      const userData: any = {
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        phone_number: formData.phone_number.trim() || null,
        bio: formData.bio.trim() || null,
      };

      const profileData: any = {};

      const profileFields = [
        'date_of_birth', 'gender', 'address',
        'facebook_url', 'twitter_url', 'linkedin_url', 'instagram_url'
      ];

      profileFields.forEach(field => {
        const value = profileFormData[field as keyof UserProfile];
        if (value && value.toString().trim() !== '') {
          profileData[field] = value.toString().trim();
        }
      });

      const response = await apiClient.put('/auth/bulk-update/', {
        user: userData,
        profile: profileData
      });

      if (response.data.success === true || response.status === 200) {
        await checkAuth();

        toast.success(tAccount('profileUpdated'));
        setIsEditing(false);

        await fetchProfileData();
      } else {
        throw new Error("Failed to update profile: Invalid response");
      }

    } catch (error: any) {
      console.error("Profile update error:", error);

      if (error.response?.data?.error) {
        toast.error(error.response.data.error);
      } else if (error.response?.data?.detail) {
        toast.error(error.response.data.detail);
      } else if (error.response?.data?.errors) {
        const errors = error.response.data.errors;
        const firstErrorKey = Object.keys(errors)[0];
        const firstError = errors[firstErrorKey];

        if (Array.isArray(firstError)) {
          toast.error(firstError[0]);
        } else if (typeof firstError === 'string') {
          toast.error(firstError);
        } else if (firstError && typeof firstError === 'object') {
          const nestedKey = Object.keys(firstError)[0];
          const nestedError = firstError[nestedKey];
          toast.error(Array.isArray(nestedError) ? nestedError[0] : nestedError);
        } else {
          toast.error("Validation error occurred");
        }
      } else if (error.message) {
        toast.error(error.message);
      } else {
        toast.error("Failed to update profile");
      }
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!passwordData.current_password) {
      toast.error(tAccount('currentPassword') + " " + tAccount('fieldRequired'));
      return;
    }

    if (passwordData.new_password.length < 8) {
      toast.error(tAccount('passwordTooShort'));
      return;
    }

    if (passwordData.new_password !== passwordData.confirm_password) {
      toast.error(tAccount('passwordMismatch'));
      return;
    }

    if (passwordData.new_password === passwordData.current_password) {
      toast.error("New password cannot be the same as current password");
      return;
    }

    setIsUpdatingPassword(true);

    try {
      const response = await apiClient.post('/auth/change-password/', {
        current_password: passwordData.current_password,
        new_password: passwordData.new_password,
        confirm_password: passwordData.confirm_password
      });

      if (response.status === 200) {
        toast.success(tAccount('passwordUpdated'));

        setPasswordData({
          current_password: "",
          new_password: "",
          confirm_password: "",
        });

      } else {
        throw new Error("Failed to change password");
      }
    } catch (error: any) {
      console.error("Password change error:", error);

      if (error.response?.status === 400) {
        const errors = error.response.data;

        if (typeof errors === 'object') {
          const firstErrorKey = Object.keys(errors)[0];
          const firstErrorMessage = Array.isArray(errors[firstErrorKey])
            ? errors[firstErrorKey][0]
            : errors[firstErrorKey];

          toast.error(firstErrorMessage);
        } else if (errors.error) {
          toast.error(errors.error);
        } else {
          toast.error("Failed to change password. Please check your inputs.");
        }
      } else if (error.response?.status === 401) {
        toast.error("Your session has expired. Please log in again.");
        logout();
        window.location.href = "/auth/login";
      } else if (error.response?.status === 403) {
        toast.error("You don't have permission to perform this action");
      } else {
        toast.error(error.response?.data?.error || error.message || "Failed to change password");
      }
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleProfilePictureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file (JPG, PNG, GIF)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB');
      return;
    }

    setIsUploading(true);

    try {
      await updateProfilePicture(file);

      rehydrateFromSession();

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      toast.success(tAccount('profilePictureUpdated'));
    } catch (error: any) {
      console.error('Profile picture upload error:', error);
      toast.error(error.message || 'Failed to upload profile picture');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveProfilePicture = async () => {
    if (!confirm('Are you sure you want to remove your profile picture?')) return;

    try {
      await removeProfilePicture();
      toast.success(tAccount('profilePictureRemoved'));
    } catch (error: any) {
      console.error('Remove profile picture error:', error);
      toast.error(error.message || 'Failed to remove profile picture');
    }
  };

  const handleDeleteAccount = async () => {
    if (!deleteReason.trim()) {
      toast.error(tAccount('deleteAccountReason') + " " + tAccount('fieldRequired'));
      return;
    }

    setIsDeleting(true);
    try {
      const response = await apiClient.post('/auth/delete-account/', {
        reason: deleteReason
      });

      if (response.status === 200) {
        toast.success(tAccount('accountDeleted'));
        logout();
        window.location.href = "/";
      } else {
        throw new Error("Failed to delete account");
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || error.message || "Failed to delete account");
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const getInitials = () => {
    if (!user) return "U";
    const firstInitial = user.first_name?.[0] || "";
    const lastInitial = user.last_name?.[0] || "";
    return `${firstInitial}${lastInitial}`.toUpperCase() || "U";
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getActivityIcon = (activityType: string) => {
    switch (activityType) {
      case 'login': return <User className="h-5 w-5" />;
      case 'property_view': return <Eye className="h-5 w-5" />;
      case 'property_save': return <Heart className="h-5 w-5" />;
      case 'inquiry': return <MessageSquare className="h-5 w-5" />;
      case 'profile_update': return <Edit2 className="h-5 w-5" />;
      case 'search': return <Search className="h-5 w-5" />;
      default: return <Activity className="h-5 w-5" />;
    }
  };

  const getActivityColor = (activityType: string) => {
    switch (activityType) {
      case 'login': return 'border-blue-500 dark:border-blue-400';
      case 'property_view': return 'border-green-500 dark:border-green-400';
      case 'property_save': return 'border-yellow-500 dark:border-yellow-400';
      case 'inquiry': return 'border-purple-500 dark:border-purple-400';
      case 'profile_update': return 'border-indigo-500 dark:border-indigo-400';
      case 'search': return 'border-orange-500 dark:border-orange-400';
      default: return 'border-gray-500 dark:border-gray-400';
    }
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  if (!user) {
    return (
      <div className="container mx-auto py-8 px-4 flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-gray-500 dark:text-gray-400">{tAccount('loadingAccountInfo')}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />

      <div className="container mx-auto py-6 md:py-8 px-3 md:px-4 max-w-7xl">
        <div className="lg:hidden mb-6">
          <Button
            variant="outline"
            className="w-full justify-between"
            onClick={toggleMobileMenu}
          >
            <div className="flex items-center gap-3">
              <Menu className="h-5 w-5" />
              <span className="font-medium">
                {activeTab === "profile" ? tAccount('profileSettings') :
                  activeTab === "password" ? tAccount('passwordSecurity') :
                    tAccount('activityHistory')}
              </span>
            </div>
            <ChevronRight className={cn(
              "h-5 w-5 transition-transform",
              mobileMenuOpen ? "rotate-90" : ""
            )} />
          </Button>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          <div className={cn(
            "lg:w-80 flex-shrink-0",
            mobileMenuOpen ? "block" : "hidden lg:block"
          )}>
            <div className="sticky top-8 space-y-6 max-h-[calc(100vh-4rem)] overflow-visible">
              <Card className="border-gray-200 dark:border-gray-700 shadow-sm bg-white dark:bg-gray-800">
                <CardContent className="p-4 md:p-6">
                  <div className="flex flex-col items-center space-y-4 md:space-y-5">
                    <div className="relative">
                      <Avatar className="h-24 w-24 md:h-32 md:w-32 border-4 border-white dark:border-gray-800 shadow-lg">
                        <AvatarImage
                          src={user.profile_picture || undefined}
                          alt={user.email}
                          className="object-cover"
                        />
                        <AvatarFallback className="text-xl md:text-2xl bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                          {getInitials()}
                        </AvatarFallback>
                      </Avatar>

                      <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                        className="absolute bottom-1 right-1 md:bottom-2 md:right-2 h-8 w-8 md:h-10 md:w-10 rounded-full bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-600 flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-md"
                      >
                        {isUploading ? (
                          <Loader2 className="h-3 w-3 md:h-4 md:w-4 animate-spin" />
                        ) : (
                          <Camera className="h-3 w-3 md:h-4 md:w-4 text-gray-700 dark:text-gray-300" />
                        )}
                      </button>

                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleProfilePictureUpload}
                      />
                    </div>

                    <div className="text-center space-y-2 md:space-y-3">
                      <div>
                        <h2 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-white">
                          {user.first_name} {user.last_name}
                        </h2>
                        <div className="flex items-center justify-center gap-1 mt-1">
                          <Mail className="h-3 w-3 md:h-4 md:w-4 text-gray-400" />
                          <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 truncate max-w-[200px]">
                            {user.email}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-1 md:gap-2 justify-center">
                        <Badge variant="secondary" className="px-2 py-0.5 md:px-3 md:py-1 text-xs">
                          {user.user_type?.toUpperCase() || "USER"}
                        </Badge>
                        {user.is_verified && (
                          <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 text-xs px-2 py-0.5 md:px-3 md:py-1">
                            {tAccount('verified')}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-gray-200 dark:border-gray-700 shadow-sm bg-white dark:bg-gray-800">
                <CardContent className="p-3 md:p-4">
                  <nav className="space-y-1">
                    <button
                      onClick={() => {
                        setActiveTab("profile");
                        setMobileMenuOpen(false);
                      }}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 md:px-4 py-2 md:py-3 rounded-lg transition-colors text-sm md:text-base",
                        activeTab === "profile"
                          ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800"
                          : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                      )}
                    >
                      <User className="h-4 w-4 md:h-5 md:w-5" />
                      <span className="font-medium">{tCommon('myAccount')}</span>
                    </button>

                    <button
                      onClick={() => {
                        setActiveTab("password");
                        setMobileMenuOpen(false);
                      }}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 md:px-4 py-2 md:py-3 rounded-lg transition-colors text-sm md:text-base",
                        activeTab === "password"
                          ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800"
                          : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                      )}
                    >
                      <Shield className="h-4 w-4 md:h-5 md:w-5" />
                      <span className="font-medium">{tAccount('passwordSecurity')}</span>
                    </button>

                    <button
                      onClick={() => {
                        setActiveTab("activity");
                        setMobileMenuOpen(false);
                      }}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 md:px-4 py-2 md:py-3 rounded-lg transition-colors text-sm md:text-base",
                        activeTab === "activity"
                          ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800"
                          : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                      )}
                    >
                      <Activity className="h-4 w-4 md:h-5 md:w-5" />
                      <span className="font-medium">{tAccount('activityHistory')}</span>
                    </button>
                  </nav>
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="flex-1 min-w-0">
            {activeTab === "profile" && (
              <Card className="border-gray-200 dark:border-gray-700 shadow-sm bg-white dark:bg-gray-800">
                <CardHeader className="pb-4 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <CardTitle className="text-lg md:text-xl text-gray-900 dark:text-white">
                        {tAccount('profileSettings')}
                      </CardTitle>
                      <CardDescription className="text-gray-600 dark:text-gray-400">
                        {tAccount('updatePreferences')}
                      </CardDescription>
                    </div>
                    {!isEditing ? (
                      <Button
                        onClick={() => setIsEditing(true)}
                        className="gap-2 w-full md:w-auto"
                        size="sm"
                      >
                        <Edit2 className="h-4 w-4" />
                        {tAccount('updateProfile')}
                      </Button>
                    ) : (
                      <div className="flex gap-2 w-full md:w-auto">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setIsEditing(false);
                            setFormData({
                              first_name: user.first_name || "",
                              last_name: user.last_name || "",
                              phone_number: user.phone_number || "",
                              bio: user.bio || "",
                            });
                            fetchProfileData();
                          }}
                          disabled={isUpdatingProfile}
                          className="flex-1 md:flex-none"
                          size="sm"
                        >
                          <X className="h-4 w-4 mr-2" />
                          {tAccount('cancel')}
                        </Button>
                        <Button
                          onClick={handleProfileSubmit}
                          disabled={isUpdatingProfile}
                          className="gap-2 flex-1 md:flex-none"
                          size="sm"
                        >
                          {isUpdatingProfile ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Save className="h-4 w-4" />
                          )}
                          {isUpdatingProfile ? tAccount('uploading') : tAccount('saveChanges')}
                        </Button>
                      </div>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="pt-6">
                  <form onSubmit={handleProfileSubmit} className="space-y-6 md:space-y-8">
                    <div className="space-y-4 md:space-y-6">
                      <div className="flex items-center gap-3 mb-3 md:mb-4">
                        <div className="h-8 w-8 md:h-10 md:w-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                          <User className="h-4 w-4 md:h-5 md:w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <h3 className="text-base md:text-lg font-semibold text-gray-900 dark:text-white">
                            {tAccount('basicInformation')}
                          </h3>
                          <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400">
                            {tAccount('essentialDetails')}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                        <div className="space-y-2 md:space-y-3">
                          <Label htmlFor="first_name" className="text-xs md:text-sm font-medium">
                            {tAccount('firstName')}
                          </Label>
                          <Input
                            id="first_name"
                            name="first_name"
                            value={formData.first_name}
                            onChange={handleFormChange}
                            disabled={!isEditing || isUpdatingProfile}
                            required
                            className="h-9 md:h-11"
                            placeholder={tAccount('enterFirstName')}
                          />
                        </div>
                        <div className="space-y-2 md:space-y-3">
                          <Label htmlFor="last_name" className="text-xs md:text-sm font-medium">
                            {tAccount('lastName')}
                          </Label>
                          <Input
                            id="last_name"
                            name="last_name"
                            value={formData.last_name}
                            onChange={handleFormChange}
                            disabled={!isEditing || isUpdatingProfile}
                            required
                            className="h-9 md:h-11"
                            placeholder={tAccount('enterLastName')}
                          />
                        </div>
                      </div>

                      <div className="space-y-2 md:space-y-3">
                        <Label htmlFor="phone_number" className="text-xs md:text-sm font-medium">
                          {tAccount('phoneNumber')}
                        </Label>
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-gray-400" />
                          <Input
                            id="phone_number"
                            name="phone_number"
                            value={formData.phone_number}
                            onChange={handleFormChange}
                            disabled={!isEditing || isUpdatingProfile}
                            required
                            className="h-9 md:h-11"
                            placeholder={tAccount('enterPhoneNumber')}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4 md:space-y-6">
                      <div className="flex items-center gap-3 mb-3 md:mb-4">
                        <div className="h-8 w-8 md:h-10 md:w-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                          <User className="h-4 w-4 md:h-5 md:w-5 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div>
                          <h3 className="text-base md:text-lg font-semibold text-gray-900 dark:text-white">
                            {tAccount('personalDetails')}
                          </h3>
                          <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400">
                            {tAccount('additionalInfo')}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                        <div className="space-y-2 md:space-y-3">
                          <Label htmlFor="date_of_birth" className="text-xs md:text-sm font-medium">
                            {tAccount('dateOfBirth')}
                          </Label>
                          <Input
                            id="date_of_birth"
                            name="date_of_birth"
                            type="date"
                            value={profileFormData.date_of_birth || ""}
                            onChange={handleProfileFormChange}
                            disabled={!isEditing || isUpdatingProfile || isLoadingProfile}
                            className="h-9 md:h-11"
                          />
                        </div>

                        <div className="space-y-2 md:space-y-3">
                          <Label htmlFor="gender" className="text-xs md:text-sm font-medium">
                            {tAccount('gender')}
                          </Label>
                          <select
                            id="gender"
                            name="gender"
                            value={profileFormData.gender || ""}
                            onChange={handleProfileFormChange}
                            disabled={!isEditing || isUpdatingProfile || isLoadingProfile}
                            className="w-full h-9 md:h-11 rounded-md border border-input bg-background px-3 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <option value="">{tAccount('selectGender')}</option>
                            <option value="male">{tAccount('male')}</option>
                            <option value="female">{tAccount('female')}</option>
                            <option value="other">{tAccount('other')}</option>
                            <option value="prefer_not_to_say">{tAccount('preferNotToSay')}</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4 md:space-y-6">
                      <div className="flex items-center gap-3 mb-3 md:mb-4">
                        <div className="h-8 w-8 md:h-10 md:w-10 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                          <Globe className="h-4 w-4 md:h-5 md:w-5 text-orange-600 dark:text-orange-400" />
                        </div>
                        <div>
                          <h3 className="text-base md:text-lg font-semibold text-gray-900 dark:text-white">
                            {tAccount('socialProfiles')}
                          </h3>
                          <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400">
                            {tAccount('connectSocialMedia')}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                        <div className="space-y-2 md:space-y-3">
                          <Label htmlFor="facebook_url" className="text-xs md:text-sm font-medium">
                            {tAccount('facebook')}
                          </Label>
                          <div className="flex items-center gap-2">
                            <LinkIcon className="h-4 w-4 text-blue-500" />
                            <Input
                              id="facebook_url"
                              name="facebook_url"
                              type="url"
                              value={profileFormData.facebook_url || ""}
                              onChange={handleProfileFormChange}
                              disabled={!isEditing || isUpdatingProfile || isLoadingProfile}
                              className="h-9 md:h-11"
                              placeholder={tAccount('enterFacebookUrl')}
                            />
                          </div>
                        </div>

                        <div className="space-y-2 md:space-y-3">
                          <Label htmlFor="twitter_url" className="text-xs md:text-sm font-medium">
                            {tAccount('twitter')}
                          </Label>
                          <div className="flex items-center gap-2">
                            <LinkIcon className="h-4 w-4 text-blue-400" />
                            <Input
                              id="twitter_url"
                              name="twitter_url"
                              type="url"
                              value={profileFormData.twitter_url || ""}
                              onChange={handleProfileFormChange}
                              disabled={!isEditing || isUpdatingProfile || isLoadingProfile}
                              className="h-9 md:h-11"
                              placeholder={tAccount('enterTwitterUrl')}
                            />
                          </div>
                        </div>

                        <div className="space-y-2 md:space-y-3">
                          <Label htmlFor="instagram_url" className="text-xs md:text-sm font-medium">
                            {tAccount('instagram')}
                          </Label>
                          <div className="flex items-center gap-2">
                            <LinkIcon className="h-4 w-4 text-pink-500" />
                            <Input
                              id="instagram_url"
                              name="instagram_url"
                              type="url"
                              value={profileFormData.instagram_url || ""}
                              onChange={handleProfileFormChange}
                              disabled={!isEditing || isUpdatingProfile || isLoadingProfile}
                              className="h-9 md:h-11"
                              placeholder={tAccount('enterInstagramUrl')}
                            />
                          </div>
                        </div>

                        <div className="space-y-2 md:space-y-3">
                          <Label htmlFor="linkedin_url" className="text-xs md:text-sm font-medium">
                            {tAccount('linkedin')}
                          </Label>
                          <div className="flex items-center gap-2">
                            <LinkIcon className="h-4 w-4 text-blue-700" />
                            <Input
                              id="linkedin_url"
                              name="linkedin_url"
                              type="url"
                              value={profileFormData.linkedin_url || ""}
                              onChange={handleProfileFormChange}
                              disabled={!isEditing || isUpdatingProfile || isLoadingProfile}
                              className="h-9 md:h-11"
                              placeholder={tAccount('enterLinkedinUrl')}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4 md:space-y-6">
                      <div className="flex items-center gap-3 mb-3 md:mb-4">
                        <div className="h-8 w-8 md:h-10 md:w-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                          <Home className="h-4 w-4 md:h-5 md:w-5 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <div>
                          <h3 className="text-base md:text-lg font-semibold text-gray-900 dark:text-white">
                            {tAccount('aboutMe')}
                          </h3>
                          <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400">
                            {tAccount('tellAboutYourself')}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-2 md:space-y-3">
                        <Label htmlFor="bio" className="text-xs md:text-sm font-medium">
                          {tAccount('bio')}
                        </Label>
                        <textarea
                          id="bio"
                          name="bio"
                          value={formData.bio}
                          onChange={handleFormChange}
                          disabled={!isEditing || isUpdatingProfile}
                          className="w-full min-h-[100px] md:min-h-[120px] rounded-md border border-input bg-background px-3 py-2 md:py-3 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          placeholder={tAccount('enterBio')}
                          maxLength={1000}
                        />
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>{tAccount('shareYourStory')}</span>
                          <span>{tAccount('characterCount', { current: formData.bio.length, max: 1000 })}</span>
                        </div>
                      </div>
                    </div>

                    {isEditing && (
                      <div className="pt-4 md:pt-6 border-t border-gray-200 dark:border-gray-700">
                        <div className="flex justify-end">
                          <Button
                            type="submit"
                            disabled={isUpdatingProfile}
                            className="min-w-[120px] h-9 md:h-11"
                            size="sm"
                          >
                            {isUpdatingProfile ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                {tAccount('uploading')}
                              </>
                            ) : (
                              tAccount('saveChanges')
                            )}
                          </Button>
                        </div>
                      </div>
                    )}
                  </form>
                </CardContent>
              </Card>
            )}

            {activeTab === "password" && (
              <div className="space-y-4 md:space-y-6">
                <Card className="border-gray-200 dark:border-gray-700 shadow-sm bg-white dark:bg-gray-800">
                  <CardHeader className="pb-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 md:h-10 md:w-10 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                        <Shield className="h-4 w-4 md:h-5 md:w-5 text-red-600 dark:text-red-400" />
                      </div>
                      <div>
                        <CardTitle className="text-lg md:text-xl text-gray-900 dark:text-white">
                          {tAccount('passwordSecurity')}
                        </CardTitle>
                        <CardDescription className="text-gray-600 dark:text-gray-400">
                          {tAccount('updatePasswordSecure')}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="pt-6">
                    <form onSubmit={handlePasswordSubmit} className="space-y-6 md:space-y-8">
                      <div className="grid grid-cols-1 gap-4 md:gap-6">
                        <div className="space-y-2 md:space-y-3">
                          <Label htmlFor="current_password" className="text-xs md:text-sm font-medium">
                            {tAccount('currentPassword')}
                            <span className="text-red-500 ml-1">*</span>
                          </Label>
                          <Input
                            id="current_password"
                            name="current_password"
                            type="password"
                            value={passwordData.current_password}
                            onChange={handlePasswordChange}
                            required
                            className="h-9 md:h-11"
                            placeholder={tAccount('enterCurrentPassword')}
                            disabled={isUpdatingPassword}
                          />
                        </div>

                        <div className="space-y-2 md:space-y-3">
                          <Label htmlFor="new_password" className="text-xs md:text-sm font-medium">
                            {tAccount('newPassword')}
                            <span className="text-red-500 ml-1">*</span>
                          </Label>
                          <Input
                            id="new_password"
                            name="new_password"
                            type="password"
                            value={passwordData.new_password}
                            onChange={handlePasswordChange}
                            required
                            className="h-9 md:h-11"
                            placeholder={tAccount('enterNewPassword')}
                            disabled={isUpdatingPassword}
                          />
                          <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                            <p>• {tAccount('passwordRequirements')}</p>
                            <p>• {tAccount('passwordCannotBeSame')}</p>
                            <p>• {tAccount('passwordCannotBeNumeric')}</p>
                          </div>
                        </div>

                        <div className="space-y-2 md:space-y-3">
                          <Label htmlFor="confirm_password" className="text-xs md:text-sm font-medium">
                            {tAccount('confirmPassword')}
                            <span className="text-red-500 ml-1">*</span>
                          </Label>
                          <Input
                            id="confirm_password"
                            name="confirm_password"
                            type="password"
                            value={passwordData.confirm_password}
                            onChange={handlePasswordChange}
                            required
                            className="h-9 md:h-11"
                            placeholder={tAccount('enterConfirmPassword')}
                            disabled={isUpdatingPassword}
                          />
                        </div>

                        <div className="pt-2 md:pt-4">
                          <Button
                            type="submit"
                            className="h-9 md:h-11 px-6 md:px-8 min-w-[140px] md:min-w-[160px] w-full md:w-auto"
                            disabled={isUpdatingPassword}
                          >
                            {isUpdatingPassword ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                {tAccount('uploading')}
                              </>
                            ) : (
                              tAccount('updatePassword')
                            )}
                          </Button>
                        </div>
                      </div>
                    </form>
                  </CardContent>
                </Card>

                <Card className="border-red-200 dark:border-red-800 shadow-sm bg-white dark:bg-gray-800">
                  <CardHeader className="bg-red-50 dark:bg-red-900/20 border-b border-red-100 dark:border-red-800">
                    <div className="flex items-center gap-3">
                      <AlertCircle className="h-5 w-5 md:h-6 md:w-6 text-red-600 dark:text-red-400" />
                      <div>
                        <CardTitle className="text-red-700 dark:text-red-400 text-base md:text-lg">
                          {tAccount('deleteAccount')}
                        </CardTitle>
                        <CardDescription className="text-red-600 dark:text-red-300 text-xs md:text-sm">
                          {tAccount('permanentlyRemoveAccount')}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="pt-4 md:pt-6">
                    {!showDeleteConfirm ? (
                      <div className="space-y-3 md:space-y-4">
                        <p className="text-sm md:text-base text-gray-700 dark:text-gray-300">
                          {tAccount('deleteAccountWarning')}
                        </p>
                        <Button
                          variant="destructive"
                          onClick={() => setShowDeleteConfirm(true)}
                          className="gap-2 w-full md:w-auto"
                          size="sm"
                        >
                          <Trash2 className="h-4 w-4" />
                          {tAccount('deleteAccount')}
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-4 md:space-y-6">
                        <div className="space-y-2 md:space-y-3">
                          <Label htmlFor="delete_reason" className="text-xs md:text-sm font-medium text-gray-900 dark:text-white">
                            {tAccount('deleteAccountReason')}
                          </Label>
                          <textarea
                            id="delete_reason"
                            value={deleteReason}
                            onChange={(e) => setDeleteReason(e.target.value)}
                            className="w-full min-h-[80px] md:min-h-[100px] rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 md:py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                            placeholder="We'd appreciate your feedback to improve our service..."
                            maxLength={500}
                          />
                          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                            <span>{tAccount('feedbackHelpsImprove')}</span>
                            <span>{tAccount('characterCount', { current: deleteReason.length, max: 500 })}</span>
                          </div>
                        </div>

                        <div className="space-y-3 md:space-y-4">
                          <div className="flex flex-col md:flex-row gap-3">
                            <Button
                              variant="destructive"
                              onClick={handleDeleteAccount}
                              disabled={isDeleting}
                              className="gap-2 flex-1"
                              size="sm"
                            >
                              {isDeleting ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                              {isDeleting ? tAccount('uploading') : tAccount('deleteAccountConfirm')}
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => {
                                setShowDeleteConfirm(false);
                                setDeleteReason("");
                              }}
                              className="flex-1"
                              size="sm"
                            >
                              {tAccount('cancel')}
                            </Button>
                          </div>

                          <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400">
                            <AlertCircle className="inline h-3 w-3 md:h-4 md:w-4 mr-1" />
                            {tAccount('actionCannotBeUndone')}
                          </p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {activeTab === "activity" && (
              <Card className="border-gray-200 dark:border-gray-700 shadow-sm bg-white dark:bg-gray-800">
                <CardHeader className="pb-4 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 md:h-10 md:w-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                      <Activity className="h-4 w-4 md:h-5 md:w-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <CardTitle className="text-lg md:text-xl text-gray-900 dark:text-white">
                        {tAccount('activityHistory')}
                      </CardTitle>
                      <CardDescription className="text-gray-600 dark:text-gray-400">
                        {tAccount('recentActions')}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="pt-6">
                  {isLoadingActivities ? (
                    <div className="flex flex-col items-center justify-center py-8 md:py-12 space-y-3 md:space-y-4">
                      <Loader2 className="h-8 w-8 md:h-12 md:w-12 animate-spin text-primary" />
                      <p className="text-gray-500 dark:text-gray-400">{tAccount('loadingActivities')}</p>
                    </div>
                  ) : (
                    <div className="space-y-6 md:space-y-8">
                      {/* {stats && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                          <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl p-4 md:p-5 border border-blue-200 dark:border-blue-800">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-xs md:text-sm font-medium text-blue-700 dark:text-blue-300">
                                  {tAccount('activity.propertiesViewed')}
                                </p>
                                <p className="text-xl md:text-2xl font-bold mt-1 text-gray-900 dark:text-white">
                                  {stats.total_properties_viewed || 0}
                                </p>
                              </div>
                              <div className="h-8 w-8 md:h-12 md:w-12 rounded-full bg-blue-100 dark:bg-blue-800 flex items-center justify-center">
                                <Eye className="h-4 w-4 md:h-6 md:w-6 text-blue-600 dark:text-blue-400" />
                              </div>
                            </div>
                          </div>

                          <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-xl p-4 md:p-5 border border-green-200 dark:border-green-800">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-xs md:text-sm font-medium text-green-700 dark:text-green-300">
                                  {tAccount('activity.propertiesSaved')}
                                </p>
                                <p className="text-xl md:text-2xl font-bold mt-1 text-gray-900 dark:text-white">
                                  {stats.total_properties_saved || 0}
                                </p>
                              </div>
                              <div className="h-8 w-8 md:h-12 md:w-12 rounded-full bg-green-100 dark:bg-green-800 flex items-center justify-center">
                                <Heart className="h-4 w-4 md:h-6 md:w-6 text-green-600 dark:text-green-400" />
                              </div>
                            </div>
                          </div>

                          <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-xl p-4 md:p-5 border border-purple-200 dark:border-purple-800">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-xs md:text-sm font-medium text-purple-700 dark:text-purple-300">
                                  {tAccount('activity.inquiriesSent')}
                                </p>
                                <p className="text-xl md:text-2xl font-bold mt-1 text-gray-900 dark:text-white">
                                  {stats.total_inquiries_sent || 0}
                                </p>
                              </div>
                              <div className="h-8 w-8 md:h-12 md:w-12 rounded-full bg-purple-100 dark:bg-purple-800 flex items-center justify-center">
                                <MessageSquare className="h-4 w-4 md:h-6 md:w-6 text-purple-600 dark:text-purple-400" />
                              </div>
                            </div>
                          </div>

                          <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 rounded-xl p-4 md:p-5 border border-orange-200 dark:border-orange-800">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-xs md:text-sm font-medium text-orange-700 dark:text-orange-300">
                                  {tAccount('activity.searchesMade')}
                                </p>
                                <p className="text-xl md:text-2xl font-bold mt-1 text-gray-900 dark:text-white">
                                  {stats.total_searches || 0}
                                </p>
                              </div>
                              <div className="h-8 w-8 md:h-12 md:w-12 rounded-full bg-orange-100 dark:bg-orange-800 flex items-center justify-center">
                                <Search className="h-4 w-4 md:h-6 md:w-6 text-orange-600 dark:text-orange-400" />
                              </div>
                            </div>
                          </div>
                        </div>
                      )} */}

                      <div className="space-y-4 md:space-y-6">
                        <h3 className="text-base md:text-lg font-semibold text-gray-900 dark:text-white">
                          {tAccount('activity.recentActivity')}
                        </h3>
                        {activities && activities.length > 0 ? (
                          <div className="relative">
                            <div className="absolute left-3 md:left-4 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700" />
                            <div className="space-y-3 md:space-y-4">
                              {activities.slice(0, 10).map((activity: ActivityType) => (
                                <div key={activity.id} className="relative pl-8 md:pl-12">
                                  <div className={cn(
                                    "absolute left-2 md:left-4 top-2 h-5 w-5 md:h-6 md:w-6 rounded-full border-2 border-white dark:border-gray-800",
                                    getActivityColor(activity.activity_type),
                                    "bg-white dark:bg-gray-800 flex items-center justify-center z-10"
                                  )}>
                                    {getActivityIcon(activity.activity_type)}
                                  </div>
                                  <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3 md:p-4 shadow-sm">
                                    <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-2">
                                      <div className="space-y-1">
                                        <p className="font-medium text-gray-900 dark:text-white text-sm md:text-base">
                                          {activity.metadata?.title || activity.activity_type.replace('_', ' ').toUpperCase()}
                                        </p>
                                        {activity.metadata?.description && (
                                          <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400">
                                            {activity.metadata.description}
                                          </p>
                                        )}
                                      </div>
                                      <span className="text-xs md:text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
                                        {new Date(activity.created_at).toLocaleTimeString('en-US', {
                                          hour: '2-digit',
                                          minute: '2-digit'
                                        })}
                                      </span>
                                    </div>
                                    <div className="mt-2 text-xs text-gray-400 dark:text-gray-500">
                                      {new Date(activity.created_at).toLocaleDateString('en-US', {
                                        weekday: 'short',
                                        month: 'short',
                                        day: 'numeric',
                                        year: 'numeric'
                                      })}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="text-center py-8 md:py-12 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl">
                            <Activity className="h-12 w-12 md:h-16 md:w-16 mx-auto text-gray-400 dark:text-gray-600" />
                            <p className="mt-4 text-gray-500 dark:text-gray-400 font-medium">
                              {tAccount('activity.noActivity')}
                            </p>
                            <p className="text-xs md:text-sm text-gray-400 dark:text-gray-500 mt-1">
                              {tAccount('activitiesWillAppear')}
                            </p>
                          </div>
                        )}
                      </div>

                      {stats && stats.last_activity && (
                        <div className="pt-4 md:pt-6 border-t border-gray-200 dark:border-gray-700">
                          <div className="flex flex-col md:flex-row md:items-center justify-between text-xs md:text-sm text-gray-600 dark:text-gray-400 gap-1">
                            <span>{tAccount('activity.lastActivity')}:</span>
                            <span className="font-medium">{new Date(stats.last_activity).toLocaleString()}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}