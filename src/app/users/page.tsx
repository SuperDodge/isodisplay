'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Permission, UserStatus } from '@/generated/prisma';
import { useCSRF } from '@/hooks/useCSRF';
import { useAuth } from '@/hooks/useAuth';
import { UserPermissionsPanel } from '@/components/admin/UserPermissionsPanel';
import { 
  Search, 
  Filter, 
  Download, 
  Upload, 
  MoreHorizontal, 
  Check, 
  X, 
  Users, 
  Calendar,
  SortAsc,
  SortDesc,
  RefreshCw,
  Key,
  Trash2,
  Power,
  PowerOff,
  AlertTriangle,
  CheckCircle2,
  Shield,
  Edit,
  UserRoundCog
} from 'lucide-react';
import { Input } from '@/components/ui/input';

interface User {
  id: string;
  email: string;
  username: string;
  firstName: string | null;
  lastName: string | null;
  status: UserStatus;
  permissions: Permission[];
  createdAt: string;
  updatedAt: string;
  lastLogin: string | null;
}

interface UserFilters {
  search: string;
  status: UserStatus | 'all';
  permission: Permission | 'all';
  sortBy: 'username' | 'email' | 'createdAt' | 'lastLogin';
  sortOrder: 'asc' | 'desc';
}

export default function UserManagementPage() {
  const { user: currentUser, loading: authLoading } = useAuth();
  const router = useRouter();
  const { secureFetch } = useCSRF();
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState<string | null>(null);
  const [showErrorToast, setShowErrorToast] = useState<string | null>(null);
  const [showPermissionsModal, setShowPermissionsModal] = useState<User | null>(null);
  const [tempPermissions, setTempPermissions] = useState<Permission[]>([]);
  const [showConfirmDialog, setShowConfirmDialog] = useState<{
    title: string;
    message: string;
    action: () => void;
  } | null>(null);
  
  const [filters, setFilters] = useState<UserFilters>({
    search: '',
    status: 'all',
    permission: 'all',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });

  useEffect(() => {
    if (authLoading) return;
    if (!currentUser) {
      router.push('/auth/login');
      return;
    }
    if (currentUser && !currentUser.permissions?.includes('USER_CONTROL')) {
      router.push('/unauthorized');
      return;
    }
    fetchUsers();
  }, [currentUser, authLoading, router]);

  // Filter and sort users when filters change
  useEffect(() => {
    let filtered = [...users];
    
    // Apply search filter
    if (filters.search) {
      filtered = filtered.filter(user => 
        user.username.toLowerCase().includes(filters.search.toLowerCase()) ||
        user.email.toLowerCase().includes(filters.search.toLowerCase()) ||
        (user.firstName && user.firstName.toLowerCase().includes(filters.search.toLowerCase())) ||
        (user.lastName && user.lastName.toLowerCase().includes(filters.search.toLowerCase()))
      );
    }
    
    // Apply status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(user => user.status === filters.status);
    }
    
    // Apply permission filter
    if (filters.permission !== 'all') {
      filtered = filtered.filter(user => user.permissions.includes(filters.permission));
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      let aVal: any = a[filters.sortBy];
      let bVal: any = b[filters.sortBy];
      
      // Handle null values for lastLogin
      if (filters.sortBy === 'lastLogin') {
        if (!aVal && !bVal) return 0;
        if (!aVal) return filters.sortOrder === 'asc' ? -1 : 1;
        if (!bVal) return filters.sortOrder === 'asc' ? 1 : -1;
      }
      
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }
      
      if (aVal < bVal) return filters.sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return filters.sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
    
    setFilteredUsers(filtered);
  }, [users, filters]);

  // Auto-dismiss toasts
  useEffect(() => {
    if (showSuccessToast) {
      const timer = setTimeout(() => setShowSuccessToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [showSuccessToast]);

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/users');
      if (!response.ok) throw new Error('Failed to fetch users');
      const data = await response.json();
      setUsers(data);
      setSelectedUsers(new Set()); // Clear selections when refreshing
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setShowErrorToast(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (userId: string, newStatus: UserStatus) => {
    try {
      const response = await secureFetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      });
      if (!response.ok) throw new Error('Failed to update user status');
      await fetchUsers();
      setShowSuccessToast('User status updated successfully');
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMsg);
      setShowErrorToast(errorMsg);
    }
  };

  const handlePermissionToggle = async (userId: string, permission: Permission, hasPermission: boolean) => {
    try {
      const user = users.find(u => u.id === userId);
      if (!user) return;
      
      const newPermissions = hasPermission 
        ? user.permissions.filter(p => p !== permission)
        : [...user.permissions, permission];
      
      const response = await secureFetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        body: JSON.stringify({ permissions: newPermissions }),
      });
      if (!response.ok) throw new Error('Failed to update permissions');
      await fetchUsers();
      setShowSuccessToast('User permissions updated successfully');
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMsg);
      setShowErrorToast(errorMsg);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;
    
    setShowConfirmDialog({
      title: 'DELETE USER',
      message: `Are you sure you want to delete ${user.username}? This action cannot be undone.`,
      action: async () => {
        try {
          const response = await secureFetch(`/api/admin/users/${userId}`, {
            method: 'DELETE',
          });
          if (!response.ok) throw new Error('Failed to delete user');
          await fetchUsers();
          setShowSuccessToast('User deleted successfully');
          setShowConfirmDialog(null);
        } catch (err) {
          const errorMsg = err instanceof Error ? err.message : 'An error occurred';
          setError(errorMsg);
          setShowErrorToast(errorMsg);
          setShowConfirmDialog(null);
        }
      }
    });
  };

  // Bulk operations
  const handleSelectAll = () => {
    if (selectedUsers.size === filteredUsers.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(filteredUsers.map(u => u.id)));
    }
  };

  const handleSelectUser = (userId: string) => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUsers(newSelected);
  };

  const handleBulkStatusChange = async (newStatus: UserStatus) => {
    if (selectedUsers.size === 0) return;
    
    setShowConfirmDialog({
      title: `${newStatus} USERS`,
      message: `Are you sure you want to ${newStatus.toLowerCase()} ${selectedUsers.size} selected user(s)?`,
      action: async () => {
        try {
          const promises = Array.from(selectedUsers).map(userId => 
            secureFetch(`/api/admin/users/${userId}`, {
              method: 'PATCH',
              body: JSON.stringify({ status: newStatus }),
            })
          );
          
          const results = await Promise.allSettled(promises);
          const failed = results.filter(r => r.status === 'rejected').length;
          
          if (failed > 0) {
            setShowErrorToast(`${failed} user(s) failed to update`);
          } else {
            setShowSuccessToast(`${selectedUsers.size} user(s) updated successfully`);
          }
          
          await fetchUsers();
          setSelectedUsers(new Set());
          setShowBulkActions(false);
          setShowConfirmDialog(null);
        } catch (err) {
          setShowErrorToast('Failed to update users');
          setShowConfirmDialog(null);
        }
      }
    });
  };

  const handleBulkDelete = async () => {
    if (selectedUsers.size === 0) return;
    
    setShowConfirmDialog({
      title: 'DELETE USERS',
      message: `Are you sure you want to delete ${selectedUsers.size} selected user(s)? This action cannot be undone.`,
      action: async () => {
        try {
          const promises = Array.from(selectedUsers).map(userId => 
            secureFetch(`/api/admin/users/${userId}`, {
              method: 'DELETE',
            })
          );
          
          const results = await Promise.allSettled(promises);
          const failed = results.filter(r => r.status === 'rejected').length;
          
          if (failed > 0) {
            setShowErrorToast(`${failed} user(s) failed to delete`);
          } else {
            setShowSuccessToast(`${selectedUsers.size} user(s) deleted successfully`);
          }
          
          await fetchUsers();
          setSelectedUsers(new Set());
          setShowBulkActions(false);
          setShowConfirmDialog(null);
        } catch (err) {
          setShowErrorToast('Failed to delete users');
          setShowConfirmDialog(null);
        }
      }
    });
  };

  const handlePasswordReset = async (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;
    
    setShowConfirmDialog({
      title: 'RESET PASSWORD',
      message: `Reset password for ${user.username}? A temporary password will be generated and displayed.`,
      action: async () => {
        try {
          const response = await secureFetch(`/api/admin/users/${userId}/reset-password`, {
            method: 'POST',
          });
          if (!response.ok) throw new Error('Failed to reset password');
          const data = await response.json();
          
          // Show temporary password in a modal or alert
          alert(`Password reset successful. Temporary password: ${data.temporaryPassword}\n\nPlease share this with the user securely and ask them to change it immediately.`);
          setShowSuccessToast('Password reset successfully');
          setShowConfirmDialog(null);
        } catch (err) {
          const errorMsg = err instanceof Error ? err.message : 'An error occurred';
          setShowErrorToast(errorMsg);
          setShowConfirmDialog(null);
        }
      }
    });
  };

  const exportToCSV = () => {
    const csvData = filteredUsers.map(user => ({
      Username: user.username,
      Email: user.email,
      'First Name': user.firstName || '',
      'Last Name': user.lastName || '',
      Status: user.status,
      Permissions: user.permissions.join('; '),
      'Created At': new Date(user.createdAt).toLocaleDateString(),
      'Last Login': user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'
    }));
    
    const headers = Object.keys(csvData[0] || {});
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => headers.map(header => 
        `"${(row as any)[header]?.toString().replace(/"/g, '""') || ''}"`
      ).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `users-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    setShowSuccessToast('User data exported successfully');
  };

  const getStatusBadge = (status: UserStatus) => {
    const colors = {
      ACTIVE: 'bg-green-500/20 text-green-300 border-green-500/30',
      INACTIVE: 'bg-red-500/20 text-red-300 border-red-500/30',
      SUSPENDED: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
    };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs border ${colors[status]}`}>
        {status}
      </span>
    );
  };

  const getLastLoginDisplay = (lastLogin: string | null) => {
    if (!lastLogin) return { text: 'Never', color: 'text-red-300' };
    
    const loginDate = new Date(lastLogin);
    const now = new Date();
    const diffHours = (now.getTime() - loginDate.getTime()) / (1000 * 60 * 60);
    
    if (diffHours < 24) {
      return { text: 'Online', color: 'text-green-300' };
    } else if (diffHours < 168) { // 7 days
      return { text: 'Recent', color: 'text-yellow-300' };
    } else {
      return { text: loginDate.toLocaleDateString(), color: 'text-white/60' };
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-white flex items-center gap-3">
          <RefreshCw className="w-5 h-5 animate-spin" />
          Loading users...
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white/10 backdrop-blur-md rounded-lg shadow-xl p-8 border border-white/20 custom-scrollbar">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div className="flex items-center gap-3">
              <UserRoundCog className="w-12 h-12 text-brand-orange-500" />
              <div>
                <h1 className="text-4xl font-bold text-white uppercase tracking-wide font-['Made_Tommy']">
                  User Management
                </h1>
                <p className="text-white/70">Manage users and their permissions</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={exportToCSV}
                className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-lg transition duration-200"
              >
                <Download className="w-4 h-4" />
                Export CSV
              </button>
              <button
                onClick={() => setShowImportModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-lg transition duration-200"
              >
                <Upload className="w-4 h-4" />
                Import CSV
              </button>
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2 px-6 py-3 bg-brand-orange-500 hover:bg-brand-orange-600 text-white font-semibold rounded-lg transition duration-200"
              >
                <Users className="w-4 h-4" />
                Create User
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="mb-6 space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50 w-5 h-5" />
              <Input
                type="text"
                placeholder="Search users by username, email, or name..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="w-full pl-10"
              />
            </div>
            
            {/* Filter Controls */}
            <div className="flex flex-wrap gap-3">
              {/* Status Filter */}
              <div className="relative">
                <select
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value as UserStatus | 'all' })}
                  className="appearance-none px-4 py-2 pr-10 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-brand-orange-500 cursor-pointer"
                >
                  <option value="all" className="bg-brand-gray-900 text-white">All Status</option>
                  <option value="ACTIVE" className="bg-brand-gray-900 text-white">Active</option>
                  <option value="INACTIVE" className="bg-brand-gray-900 text-white">Inactive</option>
                  <option value="SUSPENDED" className="bg-brand-gray-900 text-white">Suspended</option>
                </select>
                <Filter className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/50 w-4 h-4 pointer-events-none" />
              </div>

              {/* Permission Filter */}
              <div className="relative">
                <select
                  value={filters.permission}
                  onChange={(e) => setFilters({ ...filters, permission: e.target.value as Permission | 'all' })}
                  className="appearance-none px-4 py-2 pr-10 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-brand-orange-500 cursor-pointer"
                >
                  <option value="all" className="bg-brand-gray-900 text-white">All Permissions</option>
                  {Object.values(Permission).map((permission) => (
                    <option key={permission} value={permission} className="bg-brand-gray-900 text-white">
                      {permission.replace('_', ' ')}
                    </option>
                  ))}
                </select>
                <Filter className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/50 w-4 h-4 pointer-events-none" />
              </div>

              {/* Sort By */}
              <div className="relative">
                <select
                  value={filters.sortBy}
                  onChange={(e) => setFilters({ ...filters, sortBy: e.target.value as typeof filters.sortBy })}
                  className="appearance-none px-4 py-2 pr-10 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-brand-orange-500 cursor-pointer"
                >
                  <option value="createdAt" className="bg-brand-gray-900 text-white">Sort by Date Created</option>
                  <option value="username" className="bg-brand-gray-900 text-white">Sort by Username</option>
                  <option value="email" className="bg-brand-gray-900 text-white">Sort by Email</option>
                  <option value="lastLogin" className="bg-brand-gray-900 text-white">Sort by Last Login</option>
                </select>
                <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/50 w-4 h-4 pointer-events-none" />
              </div>

              {/* Sort Order */}
              <button
                onClick={() => setFilters({ ...filters, sortOrder: filters.sortOrder === 'asc' ? 'desc' : 'asc' })}
                className="p-2 bg-white/10 border border-white/20 rounded-lg text-white hover:bg-white/20 transition"
                title={`Sort ${filters.sortOrder === 'asc' ? 'ascending' : 'descending'}`}
              >
                {filters.sortOrder === 'asc' ? <SortAsc className="w-5 h-5" /> : <SortDesc className="w-5 h-5" />}
              </button>

              {/* Refresh */}
              <button
                onClick={fetchUsers}
                className="p-2 bg-white/10 border border-white/20 rounded-lg text-white hover:bg-white/20 transition"
                title="Refresh users"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Bulk Actions */}
          {selectedUsers.size > 0 && (
            <div className="mb-6 p-4 bg-brand-orange-500/20 border border-brand-orange-500/50 rounded-lg">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <span className="text-white font-medium">
                  {selectedUsers.size} user(s) selected
                </span>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => handleBulkStatusChange('ACTIVE')}
                    className="flex items-center gap-1 px-3 py-1 bg-green-500/20 hover:bg-green-500/30 text-green-300 border border-green-500/50 rounded transition text-sm"
                  >
                    <Power className="w-4 h-4" />
                    Enable
                  </button>
                  <button
                    onClick={() => handleBulkStatusChange('INACTIVE')}
                    className="flex items-center gap-1 px-3 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/50 rounded transition text-sm"
                  >
                    <PowerOff className="w-4 h-4" />
                    Disable
                  </button>
                  <button
                    onClick={() => handleBulkStatusChange('SUSPENDED')}
                    className="flex items-center gap-1 px-3 py-1 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-300 border border-yellow-500/50 rounded transition text-sm"
                  >
                    <AlertTriangle className="w-4 h-4" />
                    Suspend
                  </button>
                  <button
                    onClick={handleBulkDelete}
                    className="flex items-center gap-1 px-3 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/50 rounded transition text-sm"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Results Summary */}
          <div className="mb-4 flex justify-between items-center text-white/60">
            <span>Showing {filteredUsers.length} of {users.length} users</span>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200">
              {error}
            </div>
          )}

          {/* Users Table */}
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-white">
              <thead>
                <tr className="border-b border-white/20">
                  <th className="text-left p-4">
                    <input
                      type="checkbox"
                      checked={selectedUsers.size === filteredUsers.length && filteredUsers.length > 0}
                      onChange={handleSelectAll}
                      className="rounded border-white/20 bg-white/10"
                    />
                  </th>
                  <th className="text-left p-4">Username</th>
                  <th className="text-left p-4">Email</th>
                  <th className="text-left p-4">Name</th>
                  <th className="text-left p-4">Status</th>
                  <th className="text-left p-4">Activity</th>
                  <th className="text-left p-4">Permissions</th>
                  <th className="text-left p-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center p-8 text-white/60">
                      {filters.search || filters.status !== 'all' || filters.permission !== 'all' ? 
                        'No users match your filters' : 'No users found'}
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => {
                    const lastLogin = getLastLoginDisplay(user.lastLogin);
                    const isCurrentUser = user.email === currentUser?.email;
                    
                    return (
                      <tr key={user.id} className="border-b border-white/10 hover:bg-white/5">
                        <td className="p-4">
                          <input
                            type="checkbox"
                            checked={selectedUsers.has(user.id)}
                            onChange={() => handleSelectUser(user.id)}
                            disabled={isCurrentUser}
                            className="rounded border-white/20 bg-white/10 disabled:opacity-50"
                          />
                        </td>
                        <td className="p-4 font-medium">{user.username}</td>
                        <td className="p-4">{user.email}</td>
                        <td className="p-4">
                          {user.firstName || user.lastName
                            ? `${user.firstName || ''} ${user.lastName || ''}`.trim()
                            : '-'}
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            {getStatusBadge(user.status)}
                            {!isCurrentUser && (
                              <select
                                value={user.status}
                                onChange={(e) => handleStatusChange(user.id, e.target.value as UserStatus)}
                                className="ml-2 bg-white/10 border border-white/20 rounded px-2 py-1 text-xs text-white"
                              >
                                <option value="ACTIVE">Active</option>
                                <option value="INACTIVE">Inactive</option>
                                <option value="SUSPENDED">Suspended</option>
                              </select>
                            )}
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${
                              lastLogin.text === 'Online' ? 'bg-green-500' :
                              lastLogin.text === 'Recent' ? 'bg-yellow-500' : 'bg-red-500'
                            }`} />
                            <span className={`text-sm ${lastLogin.color}`}>
                              {lastLogin.text}
                            </span>
                          </div>
                          {user.lastLogin && (
                            <div className="text-xs text-white/40 mt-1">
                              {new Date(user.lastLogin).toLocaleDateString()}
                            </div>
                          )}
                        </td>
                        <td className="p-4">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Shield className="w-4 h-4 text-white/50" />
                              <span className="text-sm text-white/70">
                                {user.permissions.includes('ADMIN' as Permission) 
                                  ? 'Administrator' 
                                  : `${user.permissions.length} permissions`}
                              </span>
                            </div>
                            {!isCurrentUser && (
                              <button
                                onClick={() => {
                                  setShowPermissionsModal(user);
                                  setTempPermissions(user.permissions);
                                }}
                                className="px-3 py-1 bg-white/10 hover:bg-white/20 text-white text-xs rounded-lg transition flex items-center gap-1"
                              >
                                <Edit className="w-3 h-3" />
                                Manage Permissions
                              </button>
                            )}
                            {isCurrentUser && (
                              <span className="text-xs text-white/40 italic">Cannot edit own permissions</span>
                            )}
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            {!isCurrentUser && (
                              <>
                                <button
                                  onClick={() => handlePasswordReset(user.id)}
                                  className="p-2 bg-brand-orange-500/20 hover:bg-brand-orange-500/30 text-brand-orange-500 rounded transition"
                                  title="Reset Password"
                                >
                                  <Key className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteUser(user.id)}
                                  className="p-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded transition"
                                  title="Delete User"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </>
                            )}
                            {isCurrentUser && (
                              <span className="text-xs text-white/60 italic">Current User</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Success Toast */}
      {showSuccessToast && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 px-4 py-3 bg-green-500/90 backdrop-blur-md text-white font-bold rounded-lg shadow-lg flex items-center gap-3 animate-in fade-in slide-in-from-top">
          <CheckCircle2 className="w-6 h-6" />
          {showSuccessToast}
        </div>
      )}

      {/* Error Toast */}
      {showErrorToast && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 px-4 py-3 bg-red-500/90 backdrop-blur-md text-white font-bold rounded-lg shadow-lg flex items-center gap-3">
          <AlertTriangle className="w-6 h-6" />
          {showErrorToast}
          <button
            onClick={() => setShowErrorToast(null)}
            className="ml-2 hover:bg-white/10 rounded p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Confirmation Dialog */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-red-500/20 backdrop-blur-md border border-red-500/50 text-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-2 text-white text-lg mb-4">
              <AlertTriangle className="w-6 h-6 text-orange-500" />
              <span style={{ fontFamily: 'Made Tommy, sans-serif', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.01em' }}>
                {showConfirmDialog.title}
              </span>
            </div>
            <p className="text-red-300 pt-2 font-body mb-6">
              {showConfirmDialog.message}
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => setShowConfirmDialog(null)}
                className="flex-1 px-4 py-2 text-white hover:bg-white/10 hover:text-white font-body border border-white/20 rounded transition"
              >
                Cancel
              </button>
              <button
                onClick={showConfirmDialog.action}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-body rounded transition"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create User Modal */}
      {showCreateModal && (
        <CreateUserModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            fetchUsers();
            setShowSuccessToast('User created successfully');
          }}
        />
      )}

      {/* Permissions Modal */}
      {showPermissionsModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-brand-gray-900/95 rounded-lg shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden border border-white/20">
            <div className="p-6 border-b border-white/10">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <Shield className="w-6 h-6 text-brand-orange-500" />
                    Manage Permissions
                  </h3>
                  <p className="text-white/50 text-sm mt-1">
                    {showPermissionsModal.username} - {showPermissionsModal.email}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowPermissionsModal(null);
                    setTempPermissions([]);
                  }}
                  className="text-white/70 hover:text-white transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[60vh] custom-scrollbar">
              <UserPermissionsPanel
                permissions={tempPermissions}
                onChange={setTempPermissions}
                disabled={false}
              />
            </div>
            
            <div className="p-6 border-t border-white/10 flex gap-3">
              <button
                onClick={() => {
                  setShowPermissionsModal(null);
                  setTempPermissions([]);
                }}
                className="flex-1 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (showPermissionsModal) {
                    try {
                      const response = await secureFetch(`/api/admin/users/${showPermissionsModal.id}`, {
                        method: 'PATCH',
                        headers: {
                          'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ permissions: tempPermissions }),
                      });
                      
                      if (response.ok) {
                        setUsers(prev => prev.map(u => 
                          u.id === showPermissionsModal.id 
                            ? { ...u, permissions: tempPermissions } 
                            : u
                        ));
                        setShowSuccessToast('Permissions updated successfully');
                        setTimeout(() => setShowSuccessToast(null), 3000);
                        setShowPermissionsModal(null);
                        setTempPermissions([]);
                      } else {
                        throw new Error('Failed to update permissions');
                      }
                    } catch (error) {
                      setShowErrorToast('Failed to update permissions');
                      setTimeout(() => setShowErrorToast(null), 3000);
                    }
                  }
                }}
                className="flex-1 px-4 py-2 bg-brand-orange-500 hover:bg-brand-orange-600 text-white rounded-lg transition"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import CSV Modal */}
      {showImportModal && (
        <ImportCSVModal
          onClose={() => setShowImportModal(false)}
          onSuccess={(count) => {
            setShowImportModal(false);
            fetchUsers();
            setShowSuccessToast(`${count} user(s) imported successfully`);
          }}
          onError={(message) => {
            setShowErrorToast(message);
          }}
        />
      )}
    </div>
  );
}

function CreateUserModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const { secureFetch } = useCSRF();
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: '',
    firstName: '',
    lastName: '',
    permissions: [] as Permission[],
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await secureFetch('/api/admin/users', {
        method: 'POST',
        body: JSON.stringify(formData),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create user');
      }
      
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-brand-gray-900 rounded-lg shadow-xl p-8 max-w-md w-full mx-4 custom-scrollbar max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold text-white mb-6">Create New User</h2>
        
        {error && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded text-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-white/70 mb-2">Email</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
              />
            </div>
            
            <div>
              <label className="block text-white/70 mb-2">Username</label>
              <input
                type="text"
                required
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
              />
            </div>
            
            <div>
              <label className="block text-white/70 mb-2">Password</label>
              <input
                type="password"
                required
                minLength={8}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-white/70 mb-2">First Name</label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                />
              </div>
              
              <div>
                <label className="block text-white/70 mb-2">Last Name</label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-white/70 mb-2">Permissions</label>
              <div className="space-y-2">
                {Object.values(Permission).map((permission) => (
                  <label key={permission} className="flex items-center gap-2 text-white">
                    <input
                      type="checkbox"
                      checked={formData.permissions.includes(permission)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData({ ...formData, permissions: [...formData.permissions, permission] });
                        } else {
                          setFormData({ ...formData, permissions: formData.permissions.filter(p => p !== permission) });
                        }
                      }}
                      className="rounded border-white/20"
                    />
                    <span>{permission.replace('_', ' ')}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="flex gap-4 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-brand-orange-500 hover:bg-brand-orange-600 text-white rounded-lg transition disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ImportCSVModal({ 
  onClose, 
  onSuccess, 
  onError 
}: { 
  onClose: () => void; 
  onSuccess: (count: number) => void;
  onError: (message: string) => void;
}) {
  const { secureFetch } = useCSRF();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<any[]>([]);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    
    if (!selectedFile.name.endsWith('.csv')) {
      onError('Please select a CSV file');
      return;
    }
    
    setFile(selectedFile);
    
    // Preview file contents
    const reader = new FileReader();
    reader.onload = (event) => {
      const csv = event.target?.result as string;
      const lines = csv.split('\n').filter(line => line.trim());
      if (lines.length > 1) {
        const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
        const rows = lines.slice(1, 4).map(line => {
          const values = line.split(',').map(v => v.replace(/"/g, '').trim());
          const row: any = {};
          headers.forEach((header, index) => {
            row[header] = values[index] || '';
          });
          return row;
        });
        setPreview(rows);
      }
    };
    reader.readAsText(selectedFile);
  };
  
  const handleUpload = async () => {
    if (!file) return;
    
    setLoading(true);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await secureFetch('/api/admin/users/import', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to import users');
      }
      
      const data = await response.json();
      onSuccess(data.count);
    } catch (err) {
      onError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-brand-gray-900 rounded-lg shadow-xl p-8 max-w-2xl w-full mx-4 custom-scrollbar max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold text-white mb-6">Import Users from CSV</h2>
        
        <div className="space-y-6">
          <div>
            <label className="block text-white/70 mb-2">CSV File</label>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-brand-orange-500 file:text-white file:cursor-pointer"
            />
            <p className="text-xs text-white/60 mt-2">
              CSV should include columns: username, email, password, firstName, lastName, permissions (semicolon-separated)
            </p>
          </div>
          
          {preview.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">Preview (first 3 rows)</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-white text-sm">
                  <thead>
                    <tr className="border-b border-white/20">
                      {Object.keys(preview[0]).map(header => (
                        <th key={header} className="text-left p-2">{header}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.map((row, index) => (
                      <tr key={index} className="border-b border-white/10">
                        {Object.values(row).map((value: any, cellIndex) => (
                          <td key={cellIndex} className="p-2">{value}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          
          <div className="bg-brand-orange-500/20 border border-brand-orange-500/50 rounded-lg p-4">
            <h4 className="text-brand-orange-500 font-semibold mb-2">CSV Format Requirements:</h4>
            <ul className="text-white/80 text-sm space-y-1">
              <li>• <strong>username</strong>: Unique username (required)</li>
              <li>• <strong>email</strong>: Valid email address (required)</li>
              <li>• <strong>password</strong>: Plain text password (required, min 8 chars)</li>
              <li>• <strong>firstName</strong>: First name (optional)</li>
              <li>• <strong>lastName</strong>: Last name (optional)</li>
              <li>• <strong>permissions</strong>: Semicolon-separated (e.g., "CONTENT_CREATE;USER_CONTROL")</li>
            </ul>
          </div>
        </div>

        <div className="flex gap-4 mt-8">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition"
          >
            Cancel
          </button>
          <button
            onClick={handleUpload}
            disabled={!file || loading}
            className="flex-1 px-4 py-2 bg-brand-orange-500 hover:bg-brand-orange-600 text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Importing...' : 'Import Users'}
          </button>
        </div>
      </div>
    </div>
  );
}