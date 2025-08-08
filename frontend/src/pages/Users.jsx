
import React, { useState, useEffect } from "react";
import { User } from "@/api/entities";
import { SendEmail } from "@/api/integrations";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { 
  Users as UsersIcon, 
  Plus, 
  Edit, 
  Trash2, 
  Shield, 
  User as UserIcon,
  Mail,
  Crown,
  Settings
} from "lucide-react";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function Users() {
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [inviteEmail, setInviteEmail] = useState('');
  const [isInviting, setIsInviting] = useState(false);
  const [inviteMessage, setInviteMessage] = useState('');
  const [editPermissions, setEditPermissions] = useState({
    is_admin: false,
    can_manage_users: false,
    can_manage_displays: false,
    can_manage_settings: false,
    can_edit_content: true,
    can_create_playlists: true
  });

  useEffect(() => {
    loadUsers();
    loadCurrentUser();
  }, []);

  const loadCurrentUser = async () => {
    try {
      const userData = await User.me();
      setCurrentUser(userData);
    } catch (error) {
      console.error('Error loading current user:', error);
    }
  };

  const loadUsers = async () => {
    try {
      const usersData = await User.list('-created_date');
      setUsers(usersData);
    } catch (error) {
      console.error('Error loading users:', error);
    }
    setIsLoading(false);
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
    setEditPermissions({
      is_admin: user.is_admin || false,
      can_manage_users: user.permissions?.can_manage_users || false,
      can_manage_displays: user.permissions?.can_manage_displays || false,
      can_manage_settings: user.permissions?.can_manage_settings || false,
      can_edit_content: user.permissions?.can_edit_content !== false,
      can_create_playlists: user.permissions?.can_create_playlists !== false
    });
    setShowEditDialog(true);
  };

  const handleUpdatePermissions = async (e) => {
    e.preventDefault();
    try {
      const permissions = { ...editPermissions };
      const isAdmin = permissions.is_admin;
      delete permissions.is_admin;

      await User.update(editingUser.id, {
        is_admin: isAdmin,
        permissions: isAdmin ? {
          can_manage_users: true,
          can_manage_displays: true,
          can_manage_settings: true,
          can_edit_content: true,
          can_create_playlists: true
        } : permissions
      });
      
      setShowEditDialog(false);
      loadUsers();
    } catch (error) {
      console.error('Error updating user permissions:', error);
    }
  };

  const deleteUser = async (userId) => {
    if (userId === currentUser?.id) {
      alert("You cannot delete your own account.");
      return;
    }
    
    if (window.confirm('Are you sure you want to remove this user?')) {
      try {
        await User.delete(userId);
        loadUsers();
      } catch (error) {
        console.error('Error deleting user:', error);
      }
    }
  };

  const sendInvite = async (e) => {
    e.preventDefault();
    setIsInviting(true);
    setInviteMessage('');

    try {
        const appUrl = window.location.origin;
        const subject = "You're invited to join IsoDisplay!";
        const body = `
          <div style="font-family: sans-serif; padding: 20px; color: #333;">
            <h2 style="color: #FF8C00;">You're Invited to IsoDisplay!</h2>
            <p>Hello,</p>
            <p>You have been invited to collaborate on the IsoDisplay digital signage platform.</p>
            <p>Please click the link below to access the application and sign in with your Google account associated with this email address (${inviteEmail}).</p>
            <a href="${appUrl}" style="background-color: #FF8C00; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Access IsoDisplay</a>
            <p style="margin-top: 20px;">Thanks,<br>The IsoDisplay Team</p>
          </div>
        `;

        await SendEmail({
            to: inviteEmail,
            subject: subject,
            body: body,
        });
        
        setInviteMessage('Invitation sent successfully!');
        setTimeout(() => {
            setShowInviteDialog(false);
            setInviteEmail('');
            setInviteMessage('');
        }, 2000);

    } catch (error) {
        console.error('Error sending invitation:', error);
        setInviteMessage('Failed to send invitation. Please try again.');
    } finally {
        setIsInviting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="h-8 bg-slate-200 rounded w-48 animate-pulse mb-2"></div>
            <div className="h-4 bg-slate-200 rounded w-64 animate-pulse"></div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-12 w-12 bg-slate-200 rounded-full mb-4"></div>
                <div className="h-4 bg-slate-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-slate-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">User Management</h1>
            <p className="text-gray-300">Manage user access and permissions for your digital signage system</p>
          </div>
          <Button 
            onClick={() => setShowInviteDialog(true)}
            className="bg-orange-500 hover:bg-orange-600 text-white border-none shadow-lg transition-all duration-300"
          >
            <Plus className="w-4 h-4 mr-2" />
            Invite User
          </Button>
        </div>

        {/* Users Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {users.map((user) => (
            <Card key={user.id} className="glass-effect hover:border-white/20 transition-all duration-300">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${user.full_name}`} />
                      <AvatarFallback className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
                        {user.full_name?.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                        {user.full_name}
                        {user.is_admin && <Crown className="w-4 h-4 text-yellow-400" />}
                      </CardTitle>
                      <p className="text-gray-400 text-sm flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        {user.email}
                      </p>
                    </div>
                  </div>
                  {user.id === currentUser?.id && (
                    <Badge className="bg-blue-500/20 text-blue-300">You</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Role Badge */}
                  <div className="flex items-center gap-2">
                    {user.is_admin ? (
                      <Badge className="bg-purple-500/20 text-purple-300 flex items-center gap-1">
                        <Shield className="w-3 h-3" />
                        Administrator
                      </Badge>
                    ) : (
                      <Badge className="bg-white/10 text-gray-200 flex items-center gap-1">
                        <UserIcon className="w-3 h-3" />
                        User
                      </Badge>
                    )}
                  </div>

                  {/* Permissions */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-gray-200">Permissions</h4>
                    <div className="grid grid-cols-1 gap-1 text-xs">
                      {user.is_admin ? (
                        <div className="flex items-center gap-2 text-green-400">
                          <div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div>
                          Full Administrator Access
                        </div>
                      ) : (
                        <>
                          <div className={`flex items-center gap-2 ${user.permissions?.can_edit_content !== false ? 'text-green-400' : 'text-gray-500'}`}>
                            <div className={`w-1.5 h-1.5 rounded-full ${user.permissions?.can_edit_content !== false ? 'bg-green-400' : 'bg-gray-600'}`}></div>
                            Edit Content
                          </div>
                          <div className={`flex items-center gap-2 ${user.permissions?.can_create_playlists !== false ? 'text-green-400' : 'text-gray-500'}`}>
                            <div className={`w-1.5 h-1.5 rounded-full ${user.permissions?.can_create_playlists !== false ? 'bg-green-400' : 'bg-gray-600'}`}></div>
                            Create Playlists
                          </div>
                          <div className={`flex items-center gap-2 ${user.permissions?.can_manage_displays ? 'text-green-400' : 'text-gray-500'}`}>
                            <div className={`w-1.5 h-1.5 rounded-full ${user.permissions?.can_manage_displays ? 'bg-green-400' : 'bg-gray-600'}`}></div>
                            Manage Displays
                          </div>
                          <div className={`flex items-center gap-2 ${user.permissions?.can_manage_users ? 'text-green-400' : 'text-gray-500'}`}>
                            <div className={`w-1.5 h-1.5 rounded-full ${user.permissions?.can_manage_users ? 'bg-green-400' : 'bg-gray-600'}`}></div>
                            Manage Users
                          </div>
                          <div className={`flex items-center gap-2 ${user.permissions?.can_manage_settings ? 'text-green-400' : 'text-gray-500'}`}>
                            <div className={`w-1.5 h-1.5 rounded-full ${user.permissions?.can_manage_settings ? 'bg-green-400' : 'bg-gray-600'}`}></div>
                            System Settings
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditUser(user)}
                      className="flex-1 border-white/20 bg-white/10 text-white hover:bg-white/20"
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                    {user.id !== currentUser?.id && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteUser(user.id)}
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/20 border-red-400/30"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Invite User Dialog */}
        <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
          <DialogContent className="max-w-md glass-effect border-white/20 text-white">
            <DialogHeader>
              <DialogTitle>Invite New User</DialogTitle>
              <DialogDescription className="text-gray-300">
                Send an invitation to a new user to join your digital signage system
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={sendInvite} className="space-y-4">
              <div>
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="user@example.com"
                  className="mt-2 bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-orange-500"
                  required
                  disabled={isInviting}
                />
              </div>

              {inviteMessage && (
                <p className={`text-sm ${inviteMessage.includes('Failed') ? 'text-red-400' : 'text-green-400'}`}>
                  {inviteMessage}
                </p>
              )}

              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowInviteDialog(false);
                    setInviteEmail('');
                    setInviteMessage('');
                  }}
                   className="border-white/20 bg-white/10 text-white hover:bg-white/20"
                   disabled={isInviting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-orange-500 hover:bg-orange-600 text-white"
                  disabled={isInviting || !inviteEmail}
                >
                  {isInviting ? (
                    <>
                      <div className="w-4 h-4 mr-2 animate-spin border-2 border-white border-t-transparent rounded-full" />
                      Sending...
                    </>
                  ) : 'Send Invitation'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Edit User Permissions Dialog */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="max-w-2xl glass-effect border-white/20 text-white">
            <DialogHeader>
              <DialogTitle>Edit User Permissions</DialogTitle>
              <DialogDescription className="text-gray-300">
                Modify permissions for {editingUser?.full_name}
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleUpdatePermissions} className="space-y-6">
              {/* Admin Toggle */}
              <div className="flex items-center justify-between p-4 bg-purple-500/10 rounded-lg border border-purple-500/20">
                <div>
                  <Label className="text-base font-medium">Administrator Access</Label>
                  <p className="text-sm text-gray-300">Full system access including user management</p>
                </div>
                <Switch
                  checked={editPermissions.is_admin}
                  onCheckedChange={(checked) => setEditPermissions(prev => ({ ...prev, is_admin: checked }))}
                />
              </div>

              {/* Individual Permissions */}
              {!editPermissions.is_admin && (
                <div className="space-y-4">
                  <h4 className="font-medium text-white">Individual Permissions</h4>
                  
                  <div className="space-y-4 p-4 bg-black/20 rounded-lg border border-white/10">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Edit Content</Label>
                        <p className="text-sm text-gray-400">Upload and modify content items</p>
                      </div>
                      <Switch
                        checked={editPermissions.can_edit_content}
                        onCheckedChange={(checked) => setEditPermissions(prev => ({ ...prev, can_edit_content: checked }))}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Create Playlists</Label>
                        <p className="text-sm text-gray-400">Create and manage playlists</p>
                      </div>
                      <Switch
                        checked={editPermissions.can_create_playlists}
                        onCheckedChange={(checked) => setEditPermissions(prev => ({ ...prev, can_create_playlists: checked }))}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Manage Displays</Label>
                        <p className="text-sm text-gray-400">Configure display settings and assignments</p>
                      </div>
                      <Switch
                        checked={editPermissions.can_manage_displays}
                        onCheckedChange={(checked) => setEditPermissions(prev => ({ ...prev, can_manage_displays: checked }))}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Manage Users</Label>
                        <p className="text-sm text-gray-400">Invite and manage other users</p>
                      </div>
                      <Switch
                        checked={editPermissions.can_manage_users}
                        onCheckedChange={(checked) => setEditPermissions(prev => ({ ...prev, can_manage_users: checked }))}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label>System Settings</Label>
                        <p className="text-sm text-gray-400">Modify system-wide settings</p>
                      </div>
                      <Switch
                        checked={editPermissions.can_manage_settings}
                        onCheckedChange={(checked) => setEditPermissions(prev => ({ ...prev, can_manage_settings: checked }))}
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-6 border-t border-white/10">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowEditDialog(false)}
                  className="border-white/20 bg-white/10 text-white hover:bg-white/20"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-orange-500 hover:bg-orange-600 text-white"
                >
                  Update Permissions
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
