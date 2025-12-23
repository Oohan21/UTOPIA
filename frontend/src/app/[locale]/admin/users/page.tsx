// src/app/admin/users/page.tsx - UPDATED WITH VERIFY ACTION
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  Filter,
  MoreVertical,
  Edit,
  Trash2,
  UserPlus,
  Download,
  Eye,
  Shield,
  Ban,
  CheckCircle,
  XCircle, // Added for verify/unverify
  UserCheck, // Added for verify
  UserX, // Added for unverify
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import { Pagination } from '@/components/ui/Pagination';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/Dialog';
import { adminApi, AdminUser, PaginatedResponse } from '@/lib/api/admin';
import { formatDate } from '@/lib/utils/formatDate';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import AdminLayout from '@/components/admin/AdminLayout';
import { toast } from 'react-hot-toast';

const UsersManagement = () => {
  const [users, setUsers] = useState<PaginatedResponse<AdminUser>>({
    count: 0,
    results: [],
    next: null,
    previous: null,
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [userType, setUserType] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; userId: number | null }>({
    open: false,
    userId: null,
  });
  const [verifyDialog, setVerifyDialog] = useState<{
    open: boolean;
    userId: number | null;
    verify: boolean;
    userName: string;
  }>({
    open: false,
    userId: null,
    verify: true,
    userName: '',
  });
  const router = useRouter();

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params: any = { page };
      if (searchTerm) params.search = searchTerm;
      if (userType && userType !== 'all') params.user_type = userType;

      const data = await adminApi.getUsers(params);
      setUsers(data);
    } catch (err) {
      toast.error('Failed to load users');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page, userType]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchUsers();
  };

  const handleDeleteUser = async () => {
    if (!deleteDialog.userId) return;

    try {
      await adminApi.deleteUser(deleteDialog.userId);
      toast.success('User deleted successfully');
      fetchUsers();
    } catch (err) {
      toast.error('Failed to delete user');
    } finally {
      setDeleteDialog({ open: false, userId: null });
    }
  };

  const handleToggleVerification = async () => {
    if (!verifyDialog.userId) return;

    try {
      // Use the dedicated toggle endpoint
      await adminApi.toggleUserVerification(verifyDialog.userId);
      toast.success(`User ${verifyDialog.verify ? 'verified' : 'unverified'}`);
      fetchUsers();
    } catch (err: any) {
      console.error('Toggle verification error:', err);

      // Fallback: Try the regular update method
      try {
        console.log('Trying fallback update method...');
        await adminApi.updateUser(verifyDialog.userId, {
          is_verified: verifyDialog.verify
        });
        toast.success(`User ${verifyDialog.verify ? 'verified' : 'unverified'}`);
        fetchUsers();
      } catch (fallbackErr: any) {
        console.error('Fallback also failed:', fallbackErr);
        toast.error(`Failed: ${fallbackErr.response?.data?.detail || fallbackErr.message}`);
      }
    } finally {
      setVerifyDialog({ open: false, userId: null, verify: true, userName: '' });
    }
  };

  // You can also update the handleToggleStatus to use the toggle_active endpoint
  const handleToggleStatus = async (userId: number, isActive: boolean) => {
    try {
      // Use dedicated toggle endpoint if available
      if (adminApi.toggleUserActiveStatus) {
        await adminApi.toggleUserActiveStatus(userId);
      } else {
        // Fallback to update method
        await adminApi.updateUser(userId, { is_active: !isActive });
      }
      toast.success(`User ${isActive ? 'deactivated' : 'activated'}`);
      fetchUsers();
    } catch (err) {
      toast.error('Failed to update user status');
    }
  };

  const confirmToggleVerification = (userId: number, isVerified: boolean, userName: string) => {
    setVerifyDialog({
      open: true,
      userId,
      verify: !isVerified,
      userName,
    });
  };

  const handleMakeAdmin = async (userId: number) => {
    try {
      await adminApi.updateUser(userId, { user_type: 'admin' });
      toast.success('User promoted to admin');
      fetchUsers();
    } catch (err) {
      toast.error('Failed to update user role');
    }
  };

  const getStatusBadge = (user: AdminUser) => {
    if (!user.is_active) return <Badge variant="destructive">Inactive</Badge>;
    if (!user.is_verified) return <Badge variant="warning">Pending</Badge>;
    if (user.user_type === 'admin') return <Badge variant="success">Admin</Badge>;
    return <Badge variant="outline">Active</Badge>;
  };

  const getVerificationBadge = (isVerified: boolean) => {
    return isVerified ? (
      <Badge variant="success" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
        <CheckCircle className="h-3 w-3 mr-1" />
        Verified
      </Badge>
    ) : (
      <Badge variant="warning" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">
        <XCircle className="h-3 w-3 mr-1" />
        Unverified
      </Badge>
    );
  };

  return (

    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Users Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage all platform users and their permissions
          </p>
        </div>
        <Button onClick={() => router.push('/admin/users/create')}>
          <UserPlus className="h-4 w-4 mr-2" />
          Add User
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search users by name, email, or phone..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div>
                <Select value={userType} onValueChange={setUserType}>
                  <SelectTrigger>
                    <div className="flex items-center">
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="User Type" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="admin">Administrator</SelectItem>
                    <SelectItem value="user">Regular User</SelectItem>
                    <SelectItem value="agent">Agent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex space-x-2">
                <Button type="submit">
                  Search
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm('');
                    setUserType('all');
                    setPage(1);
                    fetchUsers();
                  }}
                >
                  Reset
                </Button>
                <Button variant="outline">
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>All Users ({users.count})</CardTitle>
            <div className="text-sm text-gray-500">
              Showing {(page - 1) * 20 + 1} - {Math.min(page * 20, users.count)} of {users.count}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <LoadingSpinner size="lg" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-400">
                      User
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-400">
                      Type
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-400">
                      Status
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-400">
                      Verified
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-400">
                      Joined
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-400">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {users.results.map((user) => (
                    <tr
                      key={user.id}
                      className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-3">
                          <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                            {user.profile_picture ? (
                              <img
                                src={user.profile_picture}
                                alt={user.first_name}
                                className="h-10 w-10 rounded-full object-cover"
                              />
                            ) : (
                              <span className="text-sm font-medium">
                                {user.first_name?.[0] || user.email[0]}
                              </span>
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {user.first_name} {user.last_name}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {user.email}
                            </p>
                            <p className="text-xs text-gray-500">
                              {user.phone_number}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={user.user_type === 'admin' ? 'success' : 'outline'}>
                          {user.user_type}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        {getStatusBadge(user)}
                      </td>
                      <td className="py-3 px-4">
                        {getVerificationBadge(user.is_verified)}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                        {formatDate(user.created_at)}
                      </td>
                      <td className="py-3 px-4">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => router.push(`/admin/users/${user.id}`)}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>

                            {/* Verify/Unverify Action */}
                            <DropdownMenuItem
                              onClick={() => confirmToggleVerification(
                                user.id,
                                user.is_verified,
                                `${user.first_name} ${user.last_name}`
                              )}
                            >
                              {user.is_verified ? (
                                <>
                                  <UserX className="h-4 w-4 mr-2" />
                                  Unverify User
                                </>
                              ) : (
                                <>
                                  <UserCheck className="h-4 w-4 mr-2" />
                                  Verify User
                                </>
                              )}
                            </DropdownMenuItem>

                            {user.user_type !== 'admin' && (
                              <DropdownMenuItem onClick={() => handleMakeAdmin(user.id)}>
                                <Shield className="h-4 w-4 mr-2" />
                                Make Admin
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={() => handleToggleStatus(user.id, user.is_active)}>
                              <Ban className="h-4 w-4 mr-2" />
                              {user.is_active ? 'Deactivate' : 'Activate'}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() => setDeleteDialog({ open: true, userId: user.id })}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete User
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {!loading && users.results.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">No users found</div>
              <Button onClick={() => router.push('/admin/users/create')}>
                Add Your First User
              </Button>
            </div>
          )}

          {/* Pagination */}
          {users.count > 0 && (
            <div className="mt-6">
              <Pagination
                currentPage={page}
                totalPages={Math.ceil(users.count / 20)}
                onPageChange={setPage}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog.open} onOpenChange={(open: boolean) => setDeleteDialog({ open, userId: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Are you sure?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete the user account
              and all associated data.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button
              variant="destructive"
              onClick={handleDeleteUser}
            >
              Delete User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Verify/Unverify Confirmation Dialog */}
      <Dialog open={verifyDialog.open} onOpenChange={(open: boolean) =>
        setVerifyDialog({ ...verifyDialog, open })
      }>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {verifyDialog.verify ? 'Verify User' : 'Unverify User'}
            </DialogTitle>
            <DialogDescription>
              {verifyDialog.verify
                ? `Are you sure you want to verify "${verifyDialog.userName}"? Verified users gain full platform access.`
                : `Are you sure you want to unverify "${verifyDialog.userName}"? Unverified users will have limited access.`
              }
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button
              variant={verifyDialog.verify ? 'default' : 'destructive'}
              onClick={handleToggleVerification}
            >
              {verifyDialog.verify ? (
                <>
                  <UserCheck className="h-4 w-4 mr-2" />
                  Verify User
                </>
              ) : (
                <>
                  <UserX className="h-4 w-4 mr-2" />
                  Unverify User
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>

  );
};

export default UsersManagement;