"use client";

import { useState, useRef, useEffect } from "react";
import Header from '@/components/common/Header/Header'
import { useAuth } from "@/lib/hooks/useAuth";
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
  MapPin
} from "lucide-react";
import toast from "react-hot-toast";
import { useUserActivity } from "@/lib/hooks/useUserActivity";

export default function AccountPage() {
  const { user, updateUser, updateProfilePicture, removeProfilePicture, logout } = useAuth();
  const { activities, stats, isLoading: isLoadingActivities } = useUserActivity();
  const [isEditing, setIsEditing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    phone_number: "",
    bio: "",
  });
  
  // Profile form with additional fields
  const [profileFormData, setProfileFormData] = useState({
    address: "",
    city: "",
    sub_city: "",
    postal_code: "",
    date_of_birth: "",
    gender: "",
    facebook_url: "",
    twitter_url: "",
    linkedin_url: "",
    instagram_url: "",
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
      
      // Set profile data from user profile if available
      if (user.profile) {
        setProfileFormData({
          address: user.profile.address || "",
          city: user.profile.city || "",
          sub_city: user.profile.sub_city || "",
          postal_code: user.profile.postal_code || "",
          date_of_birth: user.profile.date_of_birth || "",
          gender: user.profile.gender || "",
          facebook_url: user.profile.facebook_url || "",
          twitter_url: user.profile.twitter_url || "",
          linkedin_url: user.profile.linkedin_url || "",
          instagram_url: user.profile.instagram_url || "",
        });
      }
    }
  }, [user]);

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === "language_preference") {
      setFormData(prev => ({
        ...prev,
        [name]: value as "en" | "am"
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleProfileFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setProfileFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
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
    try {
      // Prepare data for API - separate user update and profile update
      const userUpdateData = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        phone_number: formData.phone_number,
        bio: formData.bio,
      };
      
      // First update the user
      await updateUser(userUpdateData);
      toast.success("Profile updated successfully");
      setIsEditing(false);
    } catch (error: any) {
      console.error("Profile update error:", error);
      toast.error(error.response?.data?.error || "Failed to update profile");
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate passwords match
    if (passwordData.new_password !== passwordData.confirm_password) {
      toast.error("New passwords do not match");
      return;
    }
    
    // Validate password strength
    if (passwordData.new_password.length < 8) {
      toast.error("Password must be at least 8 characters long");
      return;
    }
    
    try {
      const response = await fetch('/auth/change-password/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          current_password: passwordData.current_password,
          new_password: passwordData.new_password,
        }),
      });
      
      if (response.ok) {
        toast.success("Password changed successfully");
        setPasswordData({
          current_password: "",
          new_password: "",
          confirm_password: "",
        });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to change password");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to change password");
    }
  };

  const handleProfilePictureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
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
      
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error: any) {
      console.error('Profile picture upload error:', error);
      let errorMessage = 'Failed to upload profile picture';
      if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      } else if (error.message) {
        errorMessage = error.message;
      }
      toast.error(errorMessage);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveProfilePicture = async () => {
    if (!confirm('Are you sure you want to remove your profile picture?')) return;

    try {
      await removeProfilePicture();
      toast.success('Profile picture removed successfully');
    } catch (error: any) {
      console.error('Remove profile picture error:', error);
      let errorMessage = 'Failed to remove profile picture';
      if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      }
      toast.error(errorMessage);
    }
  };

  const handleDeleteAccount = async () => {
    if (!deleteReason.trim()) {
      toast.error("Please provide a reason for deleting your account");
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch('/auth/delete-account/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reason: deleteReason
        }),
      });
      
      if (response.ok) {
        toast.success("Account deleted successfully");
        logout();
        window.location.href = "/";
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete account");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to delete account");
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const getInitials = () => {
    if (!user) return "U";
    return `${user.first_name?.[0] || ""}${user.last_name?.[0] || ""}`.toUpperCase() || "U";
  };

  const userTypeColors: Record<string, string> = {
    admin: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
    user: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getActivityIcon = (activityType: string) => {
    switch (activityType) {
      case 'login': return <User className="h-5 w-5 text-blue-600" />;
      case 'property_view': return <MapPin className="h-5 w-5 text-green-600" />;
      case 'property_save': return <Save className="h-5 w-5 text-yellow-600" />;
      case 'inquiry': return <Mail className="h-5 w-5 text-purple-600" />;
      case 'profile_update': return <Edit2 className="h-5 w-5 text-indigo-600" />;
      default: return <Activity className="h-5 w-5 text-gray-600" />;
    }
  };

  const getActivityColor = (activityType: string) => {
    switch (activityType) {
      case 'login': return 'bg-blue-100 border-blue-500';
      case 'property_view': return 'bg-green-100 border-green-500';
      case 'property_save': return 'bg-yellow-100 border-yellow-500';
      case 'inquiry': return 'bg-purple-100 border-purple-500';
      case 'profile_update': return 'bg-indigo-100 border-indigo-500';
      default: return 'bg-gray-100 border-gray-500';
    }
  };

  // Don't render anything until user is loaded
  if (!user) {
    return (
      <div className="container mx-auto py-8 px-4 flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <Header/>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar - User Info */}
        <div className="lg:col-span-1">
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col items-center space-y-4">
                <div className="relative group">
                  <Avatar className="h-32 w-32 border-4 border-white shadow-lg dark:border-gray-800">
                    <AvatarImage
                      src={user.profile_picture || undefined}
                      alt={user.email}
                      className="object-cover"
                    />
                    <AvatarFallback className="text-2xl bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                      {getInitials()}
                    </AvatarFallback>
                  </Avatar>

                  {/* Upload overlay */}
                  <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-12 w-12 bg-white hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                    >
                      {isUploading ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <Camera className="h-5 w-5 text-gray-700 dark:text-gray-300" />
                      )}
                    </Button>
                  </div>

                  {/* Remove button if profile picture exists */}
                  {user.profile_picture && (
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute -top-2 -right-2 h-8 w-8 rounded-full"
                      onClick={handleRemoveProfilePicture}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}

                  {/* Hidden file input */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleProfilePictureUpload}
                  />
                </div>

                <div className="text-center">
                  <h2 className="text-2xl font-bold dark:text-white">
                    {user.first_name} {user.last_name}
                  </h2>
                  <Badge className={`mt-2 ${userTypeColors[user.user_type || "user"]}`}>
                    {user.user_type?.toUpperCase()}
                  </Badge>
                  <div className="flex items-center justify-center gap-1 mt-1">
                    <Mail className="h-4 w-4 text-gray-500" />
                    <p className="text-gray-600 dark:text-gray-400">{user.email}</p>
                  </div>
                  {user.phone_number && (
                    <div className="flex items-center justify-center gap-1 mt-1">
                      <Phone className="h-4 w-4 text-gray-500" />
                      <p className="text-gray-600 dark:text-gray-400">{user.phone_number}</p>
                    </div>
                  )}
                  {user.is_verified && (
                    <Badge className="mt-2 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                      Verified
                    </Badge>
                  )}
                  {user.is_premium && (
                    <Badge className="mt-2 bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">
                      Premium
                    </Badge>
                  )}
                </div>

                <div className="w-full space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Profile Completion</span>
                    <span>{user.profile_completion || 0}%</span>
                  </div>
                  <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-600 transition-all duration-300"
                      style={{ width: `${user.profile_completion || 0}%` }}
                    />
                  </div>
                </div>

                <div className="text-center text-sm text-gray-500">
                  <div className="flex items-center justify-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <p>Member since {formatDate(user.created_at)}</p>
                  </div>
                </div>

                {/* User Stats */}
                {stats && (
                  <div className="w-full pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="text-center">
                        <p className="text-2xl font-bold dark:text-white">{stats.total_logins || 0}</p>
                        <p className="text-xs text-gray-500">Logins</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold dark:text-white">{stats.total_inquiries_sent || 0}</p>
                        <p className="text-xs text-gray-500">Inquiries</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Navigation */}
          <Card className="mt-6">
            <CardContent className="p-6">
              <nav className="space-y-2">
                <Button
                  variant={activeTab === "profile" ? "secondary" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => setActiveTab("profile")}
                >
                  <User className="mr-2 h-4 w-4" />
                  Edit Profile
                </Button>
                <Button
                  variant={activeTab === "password" ? "secondary" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => setActiveTab("password")}
                >
                  <Key className="mr-2 h-4 w-4" />
                  Change Password
                </Button>
                <Button
                  variant={activeTab === "activity" ? "secondary" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => setActiveTab("activity")}
                >
                  <Activity className="mr-2 h-4 w-4" />
                  My Activity
                </Button>
              </nav>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          {/* Profile Tab */}
          {activeTab === "profile" && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Edit Profile</CardTitle>
                    <CardDescription>
                      Update your personal information and profile settings
                    </CardDescription>
                  </div>
                  {!isEditing ? (
                    <Button onClick={() => setIsEditing(true)}>
                      <Edit2 className="mr-2 h-4 w-4" />
                      Edit Profile
                    </Button>
                  ) : (
                    <div className="flex space-x-2">
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
                        }}
                      >
                        <X className="mr-2 h-4 w-4" />
                        Cancel
                      </Button>
                      <Button onClick={handleProfileSubmit}>
                        <Save className="mr-2 h-4 w-4" />
                        Save Changes
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleProfileSubmit} className="space-y-8">
                  {/* Basic Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium flex items-center gap-2">
                      <User className="h-5 w-5" />
                      Basic Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="first_name">First Name *</Label>
                        <Input
                          id="first_name"
                          name="first_name"
                          value={formData.first_name}
                          onChange={handleFormChange}
                          disabled={!isEditing}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="last_name">Last Name *</Label>
                        <Input
                          id="last_name"
                          name="last_name"
                          value={formData.last_name}
                          onChange={handleFormChange}
                          disabled={!isEditing}
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={user.email || ""}
                        disabled
                      />
                      <p className="text-sm text-gray-500">
                        Email cannot be changed. Contact support if needed.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone_number">Phone Number *</Label>
                      <Input
                        id="phone_number"
                        name="phone_number"
                        value={formData.phone_number}
                        onChange={handleFormChange}
                        disabled={!isEditing}
                        required
                      />
                    </div>
                  </div>

                  {/* Profile Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium flex items-center gap-2">
                      <User className="h-5 w-5" />
                      Profile Details
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="date_of_birth">Date of Birth</Label>
                        <Input
                          id="date_of_birth"
                          name="date_of_birth"
                          type="date"
                          value={profileFormData.date_of_birth}
                          onChange={handleProfileFormChange}
                          disabled={!isEditing}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="gender">Gender</Label>
                        <select
                          id="gender"
                          name="gender"
                          value={profileFormData.gender}
                          onChange={handleProfileFormChange}
                          disabled={!isEditing}
                          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <option value="">Select gender</option>
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Location Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium flex items-center gap-2">
                      <MapPin className="h-5 w-5" />
                      Location Information
                    </h3>
                    
                    <div className="space-y-2">
                      <Label htmlFor="address">Address</Label>
                      <textarea
                        id="address"
                        name="address"
                        value={profileFormData.address}
                        onChange={handleProfileFormChange}
                        disabled={!isEditing}
                        className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        placeholder="Your full address"
                        maxLength={500}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="city">City</Label>
                        <Input
                          id="city"
                          name="city"
                          value={profileFormData.city}
                          onChange={handleProfileFormChange}
                          disabled={!isEditing}
                          placeholder="City"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="sub_city">Sub-city</Label>
                        <Input
                          id="sub_city"
                          name="sub_city"
                          value={profileFormData.sub_city}
                          onChange={handleProfileFormChange}
                          disabled={!isEditing}
                          placeholder="Sub-city"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="postal_code">Postal Code</Label>
                        <Input
                          id="postal_code"
                          name="postal_code"
                          value={profileFormData.postal_code}
                          onChange={handleProfileFormChange}
                          disabled={!isEditing}
                          placeholder="Postal code"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Social Links */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Social Links</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="facebook_url">Facebook</Label>
                        <Input
                          id="facebook_url"
                          name="facebook_url"
                          type="url"
                          value={profileFormData.facebook_url}
                          onChange={handleProfileFormChange}
                          disabled={!isEditing}
                          placeholder="https://facebook.com/username"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="twitter_url">Twitter</Label>
                        <Input
                          id="twitter_url"
                          name="twitter_url"
                          type="url"
                          value={profileFormData.twitter_url}
                          onChange={handleProfileFormChange}
                          disabled={!isEditing}
                          placeholder="https://twitter.com/username"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="linkedin_url">LinkedIn</Label>
                        <Input
                          id="linkedin_url"
                          name="linkedin_url"
                          type="url"
                          value={profileFormData.linkedin_url}
                          onChange={handleProfileFormChange}
                          disabled={!isEditing}
                          placeholder="https://linkedin.com/in/username"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="instagram_url">Instagram</Label>
                        <Input
                          id="instagram_url"
                          name="instagram_url"
                          type="url"
                          value={profileFormData.instagram_url}
                          onChange={handleProfileFormChange}
                          disabled={!isEditing}
                          placeholder="https://instagram.com/username"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Bio */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">About Me</h3>
                    <div className="space-y-2">
                      <Label htmlFor="bio">Bio</Label>
                      <textarea
                        id="bio"
                        name="bio"
                        value={formData.bio}
                        onChange={handleFormChange}
                        disabled={!isEditing}
                        className="w-full min-h-[120px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        placeholder="Tell us about yourself, your interests, and what you're looking for..."
                        maxLength={1000}
                      />
                      <p className="text-xs text-gray-500">
                        {formData.bio.length}/1000 characters
                      </p>
                    </div>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Change Password Tab */}
          {activeTab === "password" && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Change Password</CardTitle>
                  <CardDescription>
                    Update your password to keep your account secure
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handlePasswordSubmit} className="space-y-6">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="current_password">Current Password</Label>
                        <Input
                          id="current_password"
                          name="current_password"
                          type="password"
                          value={passwordData.current_password}
                          onChange={handlePasswordChange}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="new_password">New Password</Label>
                        <Input
                          id="new_password"
                          name="new_password"
                          type="password"
                          value={passwordData.new_password}
                          onChange={handlePasswordChange}
                          required
                        />
                        <p className="text-xs text-gray-500">
                          Must be at least 8 characters long
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="confirm_password">Confirm New Password</Label>
                        <Input
                          id="confirm_password"
                          name="confirm_password"
                          type="password"
                          value={passwordData.confirm_password}
                          onChange={handlePasswordChange}
                          required
                        />
                      </div>

                      <Button type="submit" className="mt-4">
                        Change Password
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>

              {/* Delete Account Section */}
              <Card className="mt-6 border-red-200 dark:border-red-800">
                <CardHeader className="bg-red-50 dark:bg-red-900/20 border-b border-red-100 dark:border-red-800">
                  <CardTitle className="text-red-700 dark:text-red-400 flex items-center gap-2">
                    <AlertCircle className="h-5 w-5" />
                    Delete Account
                  </CardTitle>
                  <CardDescription className="text-red-600 dark:text-red-300">
                    Once you delete your account, there is no going back. This action cannot be undone.
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  {!showDeleteConfirm ? (
                    <Button
                      variant="destructive"
                      onClick={() => setShowDeleteConfirm(true)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete My Account
                    </Button>
                  ) : (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="delete_reason" className="text-red-700 dark:text-red-400">
                          Please tell us why you're leaving (optional)
                        </Label>
                        <textarea
                          id="delete_reason"
                          value={deleteReason}
                          onChange={(e) => setDeleteReason(e.target.value)}
                          className="w-full min-h-[80px] rounded-md border border-red-200 dark:border-red-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                          placeholder="We'd appreciate your feedback to improve our service..."
                          maxLength={500}
                        />
                        <p className="text-xs text-gray-500">
                          {deleteReason.length}/500 characters
                        </p>
                      </div>

                      <div className="flex space-x-3">
                        <Button
                          variant="destructive"
                          onClick={handleDeleteAccount}
                          disabled={isDeleting}
                        >
                          {isDeleting ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="mr-2 h-4 w-4" />
                          )}
                          {isDeleting ? "Deleting..." : "Yes, Delete My Account"}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setShowDeleteConfirm(false);
                            setDeleteReason("");
                          }}
                        >
                          Cancel
                        </Button>
                      </div>

                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        Warning: This will permanently remove your account and all associated data including properties, favorites, and messages.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}

          {/* My Activity Tab */}
          {activeTab === "activity" && (
            <Card>
              <CardHeader>
                <CardTitle>My Activity</CardTitle>
                <CardDescription>
                  Your recent actions and activities on the platform
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingActivities ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Activity Stats */}
                    {stats && (
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-blue-700 dark:text-blue-300">Properties Viewed</p>
                              <p className="text-2xl font-bold mt-1 dark:text-white">{stats.total_properties_viewed || 0}</p>
                            </div>
                            <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-800 flex items-center justify-center">
                              <MapPin className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                            </div>
                          </div>
                        </div>

                        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-green-700 dark:text-green-300">Properties Saved</p>
                              <p className="text-2xl font-bold mt-1 dark:text-white">{stats.total_properties_saved || 0}</p>
                            </div>
                            <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-800 flex items-center justify-center">
                              <Save className="h-5 w-5 text-green-600 dark:text-green-400" />
                            </div>
                          </div>
                        </div>

                        <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-purple-700 dark:text-purple-300">Inquiries Sent</p>
                              <p className="text-2xl font-bold mt-1 dark:text-white">{stats.total_inquiries_sent || 0}</p>
                            </div>
                            <div className="h-10 w-10 rounded-full bg-purple-100 dark:bg-purple-800 flex items-center justify-center">
                              <Mail className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                            </div>
                          </div>
                        </div>

                        <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-orange-700 dark:text-orange-300">Total Searches</p>
                              <p className="text-2xl font-bold mt-1 dark:text-white">{stats.total_searches || 0}</p>
                            </div>
                            <div className="h-10 w-10 rounded-full bg-orange-100 dark:bg-orange-800 flex items-center justify-center">
                              <Activity className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Recent Activity Timeline */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Recent Activities</h3>
                      {activities && activities.length > 0 ? (
                        <div className="relative border-l border-gray-200 dark:border-gray-700 pl-6 space-y-6">
                          {activities.map((activity: any) => (
                            <div key={activity.id} className="relative">
                              <div className={`absolute -left-[29px] h-4 w-4 rounded-full border-4 border-white dark:border-gray-800 ${getActivityColor(activity.activity_type)}`}>
                                {getActivityIcon(activity.activity_type)}
                              </div>
                              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <p className="font-medium dark:text-white">
                                      {activity.metadata?.title || activity.activity_type.replace('_', ' ').toUpperCase()}
                                    </p>
                                    {activity.metadata?.description && (
                                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                        {activity.metadata.description}
                                      </p>
                                    )}
                                  </div>
                                  <span className="text-sm text-gray-400 dark:text-gray-500">
                                    {new Date(activity.created_at).toLocaleDateString('en-US', {
                                      month: 'short',
                                      day: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 border rounded-lg border-dashed border-gray-300 dark:border-gray-700">
                          <Activity className="h-12 w-12 mx-auto text-gray-400" />
                          <p className="mt-2 text-gray-500 dark:text-gray-400">No activities found</p>
                        </div>
                      )}
                    </div>

                    {/* Activity Summary */}
                    {stats && stats.last_activity && (
                      <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Last active: {new Date(stats.last_activity).toLocaleString()}
                        </p>
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
  );
}