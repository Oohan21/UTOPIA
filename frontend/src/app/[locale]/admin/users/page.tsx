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
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';

const UsersManagement = () => {
  const t = useTranslations('admin.users');
  const [users, setUsers] = useState<PaginatedResponse<AdminUser>>({
    count: 0,
    results: [],
    next: null,
    previous: null,
    total_pages: 1,
    current_page: 1
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
      toast.error(t('errors.loadFailed'));
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
      toast.success(t('actions.deleteSuccess'));
      fetchUsers();
    } catch (err) {
      toast.error(t('errors.deleteFailed'));
    } finally {
      setDeleteDialog({ open: false, userId: null });
    }
  };

  const handleToggleVerification = async () => {
    if (!verifyDialog.userId) return;

    try {
      // Use the dedicated toggle endpoint
      await adminApi.toggleUserVerification(verifyDialog.userId);
      toast.success(t(`actions.${verifyDialog.verify ? 'verifySuccess' : 'unverifySuccess'}`));
      fetchUsers();
    } catch (err: any) {
      console.error('Toggle verification error:', err);

      // Fallback: Try the regular update method
      try {
        console.log('Trying fallback update method...');
        await adminApi.updateUser(verifyDialog.userId, {
          is_verified: verifyDialog.verify
        });
        toast.success(t(`actions.${verifyDialog.verify ? 'verifySuccess' : 'unverifySuccess'}`));
        fetchUsers();
      } catch (fallbackErr: any) {
        console.error('Fallback also failed:', fallbackErr);
        toast.error(t('errors.toggleFailed'));
      }
    } finally {
      setVerifyDialog({ open: false, userId: null, verify: true, userName: '' });
    }
  };

  const handleToggleStatus = async (userId: number, isActive: boolean) => {
    try {
      // Use dedicated toggle endpoint if available
      if (adminApi.toggleUserActiveStatus) {
        await adminApi.toggleUserActiveStatus(userId);
      } else {
        // Fallback to update method
        await adminApi.updateUser(userId, { is_active: !isActive });
      }
      toast.success(t(`actions.${isActive ? 'deactivateSuccess' : 'activateSuccess'}`));
      fetchUsers();
    } catch (err) {
      toast.error(t('errors.toggleFailed'));
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
      toast.success(t('actions.makeAdminSuccess'));
      fetchUsers();
    } catch (err) {
      toast.error(t('errors.makeAdminFailed'));
    }
  };

  const getStatusBadge = (user: AdminUser) => {
    if (!user.is_active) return (
      <Badge variant="destructive" className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300">
        {t('status.inactive')}
      </Badge>
    );
    if (!user.is_verified) return (
      <Badge variant="warning" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">
        {t('status.pending')}
      </Badge>
    );
    if (user.user_type === 'admin') return (
      <Badge variant="success" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
        {t('status.admin')}
      </Badge>
    );
    return (
      <Badge variant="outline" className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300">
        {t('status.active')}
      </Badge>
    );
  };

  const getVerificationBadge = (isVerified: boolean) => {
    return isVerified ? (
      <Badge variant="success" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
        <CheckCircle className="h-3 w-3 mr-1" />
        {t('status.verified')}
      </Badge>
    ) : (
      <Badge variant="warning" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">
        <XCircle className="h-3 w-3 mr-1" />
        {t('status.unverified')}
      </Badge>
    );
  };

  return (
    <div className="space-y-6 p-3 md:p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t('title')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {t('subtitle')}
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card className="border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <CardContent className="p-4 md:p-6">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
                  <Input
                    placeholder={t('searchPlaceholder')}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                  />
                </div>
              </div>
              <div>
                <Select value={userType} onValueChange={setUserType} placeholder={t('filters.userType')}>
                  <SelectContent className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600">
                    <SelectItem value="all" className="dark:text-gray-300 dark:hover:bg-gray-700">
                      {t('filters.allTypes')}
                    </SelectItem>
                    <SelectItem value="admin" className="dark:text-gray-300 dark:hover:bg-gray-700">
                      {t('filters.admin')}
                    </SelectItem>
                    <SelectItem value="user" className="dark:text-gray-300 dark:hover:bg-gray-700">
                      {t('filters.regularUser')}
                    </SelectItem>
                    <SelectItem value="agent" className="dark:text-gray-300 dark:hover:bg-gray-700">
                      {t('filters.agent')}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800">
                  {t('actions.search')}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm('');
                    setUserType('all');
                    setPage(1);
                    fetchUsers();
                  }}
                  className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  {t('actions.reset')}
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card className="border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <CardTitle className="text-gray-900 dark:text-white">
              {t('tableTitle', { count: users.count })}
            </CardTitle>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {t('showingRange', {
                start: (page - 1) * 20 + 1,
                end: Math.min(page * 20, users.count),
                total: users.count
              })}
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
                    <th className="text-left py-3 px-2 md:px-4 text-sm font-medium text-gray-600 dark:text-gray-400">
                      {t('columns.user')}
                    </th>
                    <th className="text-left py-3 px-2 md:px-4 text-sm font-medium text-gray-600 dark:text-gray-400">
                      {t('columns.type')}
                    </th>
                    <th className="text-left py-3 px-2 md:px-4 text-sm font-medium text-gray-600 dark:text-gray-400">
                      {t('columns.status')}
                    </th>
                    <th className="text-left py-3 px-2 md:px-4 text-sm font-medium text-gray-600 dark:text-gray-400">
                      {t('columns.verified')}
                    </th>
                    <th className="text-left py-3 px-2 md:px-4 text-sm font-medium text-gray-600 dark:text-gray-400">
                      {t('columns.joined')}
                    </th>
                    <th className="text-left py-3 px-2 md:px-4 text-sm font-medium text-gray-600 dark:text-gray-400">
                      {t('columns.actions')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {users.results.map((user) => (
                    <tr
                      key={user.id}
                      className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                    >
                      <td className="py-3 px-2 md:px-4">
                        <div className="flex items-center space-x-3">
                          <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                            {user.profile_picture ? (
                              <img
                                src={user.profile_picture}
                                alt={user.first_name}
                                className="h-10 w-10 rounded-full object-cover"
                              />
                            ) : (
                              <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                                {user.first_name?.[0] || user.email[0]}
                              </span>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-gray-900 dark:text-white truncate">
                              {user.first_name} {user.last_name}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                              {user.email}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-500 truncate">
                              {user.phone_number}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-2 md:px-4">
                        <Badge variant={user.user_type === 'admin' ? 'success' : 'outline'} 
                               className={cn(
                                 user.user_type === 'admin' 
                                   ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                                   : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300'
                               )}>
                          {t(`userTypes.${user.user_type}`)}
                        </Badge>
                      </td>
                      <td className="py-3 px-2 md:px-4">
                        {getStatusBadge(user)}
                      </td>
                      <td className="py-3 px-2 md:px-4">
                        {getVerificationBadge(user.is_verified)}
                      </td>
                      <td className="py-3 px-2 md:px-4 text-sm text-gray-600 dark:text-gray-400">
                        {formatDate(user.created_at)}
                      </td>
                      <td className="py-3 px-2 md:px-4">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent 
                            align="end" 
                            className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700"
                          >
                            <DropdownMenuItem 
                              onClick={() => router.push(`/admin/users/${user.id}`)}
                              className="dark:text-gray-300 dark:hover:bg-gray-700"
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              {t('actions.viewDetails')}
                            </DropdownMenuItem>

                            {/* Verify/Unverify Action */}
                            <DropdownMenuItem
                              onClick={() => confirmToggleVerification(
                                user.id,
                                user.is_verified,
                                `${user.first_name} ${user.last_name}`
                              )}
                              className="dark:text-gray-300 dark:hover:bg-gray-700"
                            >
                              {user.is_verified ? (
                                <>
                                  <UserX className="h-4 w-4 mr-2" />
                                  {t('actions.unverifyUser')}
                                </>
                              ) : (
                                <>
                                  <UserCheck className="h-4 w-4 mr-2" />
                                  {t('actions.verifyUser')}
                                </>
                              )}
                            </DropdownMenuItem>

                            {user.user_type !== 'admin' && (
                              <DropdownMenuItem 
                                onClick={() => handleMakeAdmin(user.id)}
                                className="dark:text-gray-300 dark:hover:bg-gray-700"
                              >
                                <Shield className="h-4 w-4 mr-2" />
                                {t('actions.makeAdmin')}
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem 
                              onClick={() => handleToggleStatus(user.id, user.is_active)}
                              className="dark:text-gray-300 dark:hover:bg-gray-700"
                            >
                              <Ban className="h-4 w-4 mr-2" />
                              {user.is_active ? t('actions.deactivate') : t('actions.activate')}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-red-600 dark:text-red-400 dark:hover:bg-gray-700"
                              onClick={() => setDeleteDialog({ open: true, userId: user.id })}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              {t('actions.deleteUser')}
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
              <div className="text-gray-400 dark:text-gray-500 mb-4">{t('emptyState.noUsers')}</div>
              <Button 
                onClick={() => router.push('/admin/users/create')}
                className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800"
              >
                {t('emptyState.addFirstUser')}
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
        <DialogContent className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-gray-900 dark:text-white">
              {t('dialogs.delete.title')}
            </DialogTitle>
            <DialogDescription className="text-gray-600 dark:text-gray-400">
              {t('dialogs.delete.description')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button 
                variant="outline" 
                className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                {t('dialogs.delete.cancel')}
              </Button>
            </DialogClose>
            <Button
              variant="destructive"
              onClick={handleDeleteUser}
            >
              {t('dialogs.delete.confirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Verify/Unverify Confirmation Dialog */}
      <Dialog open={verifyDialog.open} onOpenChange={(open: boolean) =>
        setVerifyDialog({ ...verifyDialog, open })
      }>
        <DialogContent className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-gray-900 dark:text-white">
              {verifyDialog.verify ? t('dialogs.verify.title') : t('dialogs.unverify.title')}
            </DialogTitle>
            <DialogDescription className="text-gray-600 dark:text-gray-400">
              {verifyDialog.verify
                ? t('dialogs.verify.description', { userName: verifyDialog.userName })
                : t('dialogs.unverify.description', { userName: verifyDialog.userName })
              }
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button 
                variant="outline" 
                className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                {t('dialogs.verify.cancel')}
              </Button>
            </DialogClose>
            <Button
              variant={verifyDialog.verify ? 'default' : 'destructive'}
              onClick={handleToggleVerification}
              className={verifyDialog.verify ? 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800' : ''}
            >
              {verifyDialog.verify ? (
                <>
                  <UserCheck className="h-4 w-4 mr-2" />
                  {t('dialogs.verify.confirm')}
                </>
              ) : (
                <>
                  <UserX className="h-4 w-4 mr-2" />
                  {t('dialogs.unverify.confirm')}
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