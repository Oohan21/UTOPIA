// src/app/admin/users/page.tsx - Fixed with Solution 1
'use client'

import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminApi } from '@/lib/api/admin'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { 
  BaseSelect,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from '@/components/ui/Select'
import { 
  Users, 
  Search, 
  UserPlus, 
  Edit, 
  Trash2, 
  Shield,
  CheckCircle,
  XCircle,
  MoreVertical,
  Download,
  Mail,
  Phone,
  Key,
  EyeOff,
  Filter,
  RefreshCw,
  UserCog,
  BadgeCheck,
  UserX,
  Loader2
} from 'lucide-react'
import toast from 'react-hot-toast'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu"
import { Badge } from '@/components/ui/Badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/Avatar'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table'
import { Pagination } from '@/components/ui/Pagination'
import { Skeleton } from '@/components/ui/Skeleton'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/Dialog'
import { Label } from '@/components/ui/Label'

// User type options (no empty string values)
const USER_TYPES = [
  { value: 'buyer', label: 'Buyer' },
  { value: 'seller', label: 'Seller' },
  { value: 'landlord', label: 'Landlord' },
  { value: 'agent', label: 'Agent' },
  { value: 'developer', label: 'Developer' },
  { value: 'admin', label: 'Admin' },
]

// Status options (no empty string values)
const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'verified', label: 'Verified' },
  { value: 'unverified', label: 'Unverified' },
]

// Function to clean parameters before sending to API
const cleanParams = (params: any): any => {
  if (!params) return undefined
  
  const cleaned: any = {}
  for (const [key, value] of Object.entries(params)) {
    // Skip undefined, null, empty string, or 'undefined' string
    if (value === undefined || value === null || value === '' || value === 'undefined') {
      continue
    }
    cleaned[key] = value
  }
  return Object.keys(cleaned).length > 0 ? cleaned : undefined
}

export default function AdminUsersPage() {
  const queryClient = useQueryClient()
  const [filters, setFilters] = useState({
    search: '',
    user_type: '', // Empty string for "All"
    status: '', // Empty string for "All"
  })
  const [page, setPage] = useState(1)
  const [pageSize] = useState(20)
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isResetPasswordDialogOpen, setIsResetPasswordDialogOpen] = useState(false)
  
  // Clean filters for API call
  const apiFilters = cleanParams({
    search: filters.search || undefined,
    user_type: filters.user_type || undefined,
    is_verified: filters.status === 'verified' ? 'true' : filters.status === 'unverified' ? 'false' : undefined,
    is_active: filters.status === 'active' ? 'true' : filters.status === 'inactive' ? 'false' : undefined,
  })

  // Fetch users with cleaned parameters
  const { 
    data: usersData, 
    isLoading, 
    error,
    refetch 
  } = useQuery({
    queryKey: ['admin-users', { ...apiFilters, page }],
    queryFn: () => adminApi.getUsers({
      ...apiFilters,
      page,
      page_size: pageSize
    }),
    retry: 1,
  })

  // Mutations
  const deleteUserMutation = useMutation({
    mutationFn: (userId: number) => adminApi.deleteUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      toast.success('User deleted successfully')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to delete user')
    },
  })

  const updateUserMutation = useMutation({
    mutationFn: ({ userId, data }: { userId: number; data: any }) => 
      adminApi.updateUser(userId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      setIsEditDialogOpen(false)
      toast.success('User updated successfully')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to update user')
    },
  })

  const createUserMutation = useMutation({
    mutationFn: (data: any) => {
      // Temporary placeholder - implement actual API call
      return Promise.resolve({ ...data, id: Date.now(), created_at: new Date().toISOString() })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      setIsCreateDialogOpen(false)
      toast.success('User created successfully')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to create user')
    },
  })

  const resetPasswordMutation = useMutation({
    mutationFn: ({ userId }: { userId: number }) => {
      // Temporary placeholder - implement actual API call
      return Promise.resolve()
    },
    onSuccess: () => {
      setIsResetPasswordDialogOpen(false)
      toast.success('Password reset email sent')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to reset password')
    },
  })

  const users = usersData?.results || []
  const totalCount = usersData?.count || 0
  const totalPages = Math.ceil(totalCount / pageSize)

  // Handle filter changes
  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setPage(1) // Reset to first page when filters change
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    refetch()
  }

  const handleClearFilters = () => {
    setFilters({
      search: '',
      user_type: '',
      status: '',
    })
    setPage(1)
  }

  // User actions
  const handleDeleteUser = (user: any) => {
    if (window.confirm(`Are you sure you want to delete user "${user.email}"? This action cannot be undone.`)) {
      deleteUserMutation.mutate(user.id)
    }
  }

  const handleEditUser = (user: any) => {
    setSelectedUser(user)
    setIsEditDialogOpen(true)
  }

  const handleCreateUser = () => {
    setIsCreateDialogOpen(true)
  }

  const handleResetPassword = (user: any) => {
    setSelectedUser(user)
    setIsResetPasswordDialogOpen(true)
  }

  const handleUpdateUser = () => {
    if (selectedUser) {
      // In a real app, get form data here
      const formData = {
        first_name: (document.getElementById('edit-first-name') as HTMLInputElement)?.value || selectedUser.first_name,
        last_name: (document.getElementById('edit-last-name') as HTMLInputElement)?.value || selectedUser.last_name,
        user_type: (document.getElementById('edit-user-type') as HTMLInputElement)?.value || selectedUser.user_type,
        is_active: (document.getElementById('edit-is-active') as HTMLInputElement)?.checked,
        is_verified: (document.getElementById('edit-is-verified') as HTMLInputElement)?.checked,
      }
      updateUserMutation.mutate({ userId: selectedUser.id, data: formData })
    }
  }

  const handleCreateNewUser = () => {
    // In a real app, get form data here
    const formData = {
      email: (document.getElementById('create-email') as HTMLInputElement)?.value,
      first_name: (document.getElementById('create-first-name') as HTMLInputElement)?.value,
      last_name: (document.getElementById('create-last-name') as HTMLInputElement)?.value,
      phone_number: (document.getElementById('create-phone') as HTMLInputElement)?.value,
      user_type: (document.getElementById('create-user-type') as HTMLInputElement)?.value || 'buyer',
      password: (document.getElementById('create-password') as HTMLInputElement)?.value,
    }
    createUserMutation.mutate(formData)
  }

  const handleResetPasswordConfirm = () => {
    if (selectedUser) {
      resetPasswordMutation.mutate({ userId: selectedUser.id })
    }
  }

  // Stats
  const activeUsers = users.filter((u: any) => u.is_active).length
  const verifiedUsers = users.filter((u: any) => u.is_verified).length
  const agentsCount = users.filter((u: any) => u.user_type === 'agent').length
  const adminsCount = users.filter((u: any) => u.user_type === 'admin').length

  // Helper functions
  const getUserTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      admin: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
      agent: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
      developer: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
      seller: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      landlord: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      buyer: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
    }
    return colors[type] || 'bg-gray-100 text-gray-800'
  }

  const getInitials = (user: any) => {
    return `${user.first_name?.[0] || ''}${user.last_name?.[0] || ''}`.toUpperCase() || 'U'
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card className="border-red-200 dark:border-red-800">
          <CardContent className="p-6">
            <div className="text-center">
              <XCircle className="mx-auto h-12 w-12 text-red-500" />
              <h3 className="mt-4 text-lg font-semibold">Error Loading Users</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Failed to load user data. Please try again.
              </p>
              <Button className="mt-4" onClick={() => refetch()}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
          <p className="text-muted-foreground">
            Manage all user accounts, permissions, and roles in the system
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleClearFilters} disabled={isLoading}>
            <Filter className="mr-2 h-4 w-4" />
            Clear Filters
          </Button>
          <Button onClick={handleCreateUser} disabled={isLoading}>
            <UserPlus className="mr-2 h-4 w-4" />
            Add User
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                <p className="text-3xl font-bold">{totalCount}</p>
              </div>
              <div className="rounded-full bg-blue-100 p-3 dark:bg-blue-900">
                <Users className="h-5 w-5 text-blue-600 dark:text-blue-300" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Users</p>
                <p className="text-3xl font-bold">{activeUsers}</p>
              </div>
              <div className="rounded-full bg-green-100 p-3 dark:bg-green-900">
                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-300" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Verified Users</p>
                <p className="text-3xl font-bold">{verifiedUsers}</p>
              </div>
              <div className="rounded-full bg-purple-100 p-3 dark:bg-purple-900">
                <Shield className="h-5 w-5 text-purple-600 dark:text-purple-300" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Agents</p>
                <p className="text-3xl font-bold">{agentsCount}</p>
              </div>
              <div className="rounded-full bg-orange-100 p-3 dark:bg-orange-900">
                <UserCog className="h-5 w-5 text-orange-600 dark:text-orange-300" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Search and filter users by specific criteria</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-4">
              <div className="space-y-2">
                <Label htmlFor="search">Search</Label>
                <Input
                  id="search"
                  placeholder="Name, email, phone..."
                  value={filters.search}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFilterChange('search', e.target.value)}
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="user-type">User Type</Label>
                <BaseSelect
                  value={filters.user_type}
                  onValueChange={(value: string) => handleFilterChange('user_type', value)}
                >
                  <SelectTrigger id="user-type" className="w-full">
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    {USER_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </BaseSelect>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <BaseSelect
                  value={filters.status}
                  onValueChange={(value: string) => handleFilterChange('status', value)}
                >
                  <SelectTrigger id="status" className="w-full">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </BaseSelect>
              </div>

              <div className="flex items-end">
                <Button type="submit" className="w-full">
                  <Search className="mr-2 h-4 w-4" />
                  Search
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between">
            <div>
              <CardTitle>Users</CardTitle>
              <CardDescription>
                {isLoading ? 'Loading...' : `${totalCount} users found`}
              </CardDescription>
            </div>
            <div className="mt-2 md:mt-0">
              <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isLoading}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-[250px]" />
                    <Skeleton className="h-4 w-[200px]" />
                  </div>
                </div>
              ))}
            </div>
          ) : users.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Users className="h-16 w-16 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No users found</h3>
              <p className="text-sm text-muted-foreground">
                {Object.values(filters).some(f => f) ? 'Try adjusting your search filters' : 'No users in the system yet'}
              </p>
              {Object.values(filters).some(f => f) && (
                <Button className="mt-4" variant="outline" onClick={handleClearFilters}>
                  Clear Filters
                </Button>
              )}
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user: any) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarImage src={user.profile_picture} />
                              <AvatarFallback>{getInitials(user)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">
                                {user.first_name} {user.last_name}
                              </p>
                              <p className="text-sm text-muted-foreground">{user.email}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getUserTypeColor(user.user_type)} variant="outline">
                            {user.user_type}
                          </Badge>
                          {user.is_staff && (
                            <Badge className="ml-2" variant="secondary">Staff</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {user.phone_number && (
                              <div className="flex items-center gap-2 text-sm">
                                <Phone className="h-3 w-3" />
                                {user.phone_number}
                              </div>
                            )}
                            <div className="flex items-center gap-2 text-sm">
                              <Mail className="h-3 w-3" />
                              {user.email}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                              {user.is_active ? (
                                <>
                                  <CheckCircle className="h-4 w-4 text-green-500" />
                                  <span className="text-sm">Active</span>
                                </>
                              ) : (
                                <>
                                  <XCircle className="h-4 w-4 text-red-500" />
                                  <span className="text-sm">Inactive</span>
                                </>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              {user.is_verified ? (
                                <>
                                  <Shield className="h-4 w-4 text-green-500" />
                                  <span className="text-sm">Verified</span>
                                </>
                              ) : (
                                <>
                                  <EyeOff className="h-4 w-4 text-yellow-500" />
                                  <span className="text-sm">Unverified</span>
                                </>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {formatDate(user.created_at)}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem onClick={() => handleEditUser(user)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleResetPassword(user)}>
                                <Key className="mr-2 h-4 w-4" />
                                Reset Password
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                className="text-red-600"
                                onClick={() => handleDeleteUser(user)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-6">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="text-sm text-muted-foreground">
                      Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, totalCount)} of {totalCount} users
                    </div>
                    
                    <Pagination
                      currentPage={page}
                      totalPages={totalPages}
                      onPageChange={setPage}
                      showFirstLast={true}
                      showPageNumbers={true}
                      maxVisiblePages={5}
                      className="justify-center"
                    />
                    
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Page:</span>
                      <BaseSelect
                        value={page.toString()}
                        onValueChange={(value: string) => setPage(parseInt(value))}
                      >
                        <SelectTrigger className="w-20">
                          <SelectValue placeholder={page.toString()} />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                            <SelectItem key={pageNum} value={pageNum.toString()}>
                              {pageNum}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </BaseSelect>
                      <span className="text-sm text-muted-foreground">of {totalPages}</span>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user information and permissions
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-first-name">First Name</Label>
                  <Input 
                    id="edit-first-name" 
                    defaultValue={selectedUser.first_name}
                    placeholder="First name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-last-name">Last Name</Label>
                  <Input 
                    id="edit-last-name" 
                    defaultValue={selectedUser.last_name}
                    placeholder="Last name"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-email">Email</Label>
                <Input 
                  id="edit-email" 
                  defaultValue={selectedUser.email}
                  placeholder="Email"
                  type="email"
                  disabled
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-user-type">User Type</Label>
                <BaseSelect 
                  defaultValue={selectedUser.user_type}
                >
                  <SelectTrigger id="edit-user-type">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {USER_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </BaseSelect>
              </div>
              <div className="flex items-center justify-between pt-4 border-t">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <input 
                      type="checkbox" 
                      id="edit-is-active" 
                      defaultChecked={selectedUser.is_active}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    <Label htmlFor="edit-is-active" className="text-sm font-normal">Active</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input 
                      type="checkbox" 
                      id="edit-is-verified" 
                      defaultChecked={selectedUser.is_verified}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    <Label htmlFor="edit-is-verified" className="text-sm font-normal">Verified</Label>
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateUser} disabled={updateUserMutation.isPending}>
              {updateUserMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create User Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create New User</DialogTitle>
            <DialogDescription>
              Add a new user to the system
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="create-first-name">First Name</Label>
                <Input id="create-first-name" placeholder="John" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-last-name">Last Name</Label>
                <Input id="create-last-name" placeholder="Doe" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-email">Email</Label>
              <Input id="create-email" placeholder="john@example.com" type="email" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-phone">Phone Number</Label>
              <Input id="create-phone" placeholder="+251911223344" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-user-type">User Type</Label>
              <BaseSelect defaultValue="buyer">
                <SelectTrigger id="create-user-type">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {USER_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </BaseSelect>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="create-password">Password</Label>
                <Input id="create-password" type="password" placeholder="••••••••" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-password-confirm">Confirm Password</Label>
                <Input id="create-password-confirm" type="password" placeholder="••••••••" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateNewUser} disabled={createUserMutation.isPending}>
              {createUserMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : 'Create User'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={isResetPasswordDialogOpen} onOpenChange={setIsResetPasswordDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>
              Send password reset instructions to {selectedUser?.email}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              This will send a password reset link to the user's email address. 
              They will be able to set a new password using that link.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsResetPasswordDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleResetPasswordConfirm} 
              disabled={resetPasswordMutation.isPending}
              variant="destructive"
            >
              {resetPasswordMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : 'Send Reset Link'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}