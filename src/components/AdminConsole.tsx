import React, { useState, useRef } from 'react';
import { 
  ShieldCheck, 
  Users, 
  UserCheck, 
  UserX, 
  UserPlus, 
  Activity, 
  Search, 
  Filter, 
  Trash2, 
  Edit3, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Database, 
  RefreshCw,
  ShoppingBag,
  LogOut,
  X,
  Phone,
  Mail,
  KeyRound,
  Camera,
  Upload,
  User as UserIcon,
  Shield,
  Eye,
  EyeOff,
  Check
} from 'lucide-react';
import { User, ActivityLog } from '../types';
import { 
  updateUserStatusInFirestore, 
  updateUserRoleInFirestore, 
  deleteUserFromFirestore, 
  saveUserToFirestore,
  logUserActivity 
} from '../lib/firestoreService';
import { resizeImageFile } from '../lib/imageUtils';

interface AdminConsoleProps {
  currentUser: User;
  users: User[];
  activityLogs: ActivityLog[];
  language: 'en' | 'kh';
  onNavigateToPos: () => void;
  onLogout: () => void;
  onUpdateCurrentUser?: (user: User) => void;
}

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=200&q=80',
  'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=200&q=80',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80',
];

export const AdminConsole: React.FC<AdminConsoleProps> = ({
  currentUser,
  users,
  activityLogs,
  language,
  onNavigateToPos,
  onLogout,
  onUpdateCurrentUser
}) => {
  const isKh = language === 'kh';
  const addFileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'cashier' | 'manager'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'disabled'>('all');

  // Add Member Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newFullName, setNewFullName] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newAvatar, setNewAvatar] = useState(PRESET_AVATARS[0]);
  const [newRole, setNewRole] = useState<'cashier' | 'manager' | 'admin'>('cashier');
  const [addModalError, setAddModalError] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  // Edit Member Modal State
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editFullName, setEditFullName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editAvatar, setEditAvatar] = useState('');
  const [editRole, setEditRole] = useState<'cashier' | 'manager' | 'admin'>('cashier');
  const [editPassword, setEditPassword] = useState('');
  const [editModalError, setEditModalError] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  // Filtered Users List
  const filteredUsers = users.filter((u) => {
    const matchSearch = 
      u.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.phone && u.phone.includes(searchQuery)) ||
      (u.email && u.email.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchRole = roleFilter === 'all' || u.role === roleFilter;
    const matchStatus = statusFilter === 'all' || u.status === statusFilter;

    return matchSearch && matchRole && matchStatus;
  });

  // User & Member Specific Metrics
  const totalUsers = users.length;
  const activeUsers = users.filter(u => u.status === 'active').length;
  const disabledUsers = users.filter(u => u.status === 'disabled').length;
  const cashiersCount = users.filter(u => u.role === 'cashier').length;
  const managersCount = users.filter(u => u.role === 'manager').length;
  const adminsCount = users.filter(u => u.role === 'admin').length;

  // Handle Photo Upload Helper with auto-compression
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, callback: (url: string) => void) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert(isKh ? 'សូមជ្រើសរើសប្រភេទជារូបភាព!' : 'Please select an image file!');
      return;
    }
    try {
      const result = await resizeImageFile(file, 400, 400, 0.85);
      callback(result.dataUrl);
    } catch {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (typeof event.target?.result === 'string') {
          callback(event.target.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Open Edit Modal
  const handleOpenEditModal = (user: User) => {
    setEditingUser(user);
    setEditFullName(user.fullName);
    setEditPhone(user.phone || '');
    setEditEmail(user.email || '');
    setEditAvatar(user.avatar || '');
    setEditRole(user.role);
    setEditPassword('');
    setEditModalError('');
  };

  // Save Edit Member
  const handleSaveEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setEditModalError('');

    if (!editFullName.trim()) {
      setEditModalError(isKh ? 'សូមបញ្ចូលឈ្មោះពេញ!' : 'Please enter full name.');
      return;
    }

    setIsEditing(true);
    try {
      const updated: User = {
        ...editingUser,
        fullName: editFullName.trim(),
        phone: editPhone.trim(),
        email: editEmail.trim(),
        avatar: editAvatar || editingUser.avatar,
        role: editingUser.username === 'admin' ? 'admin' : editRole,
        password: editPassword.trim() ? editPassword.trim() : editingUser.password,
      };

      await saveUserToFirestore(updated);
      await logUserActivity(
        currentUser.id,
        currentUser.username,
        currentUser.role,
        'UPDATE_USER',
        `Admin updated member info for ${updated.fullName} (@${updated.username})`
      );

      if (currentUser.id === updated.id && onUpdateCurrentUser) {
        onUpdateCurrentUser(updated);
      }

      setEditingUser(null);
    } catch (err: any) {
      setEditModalError(err.message || 'Failed to update member');
    } finally {
      setIsEditing(false);
    }
  };

  // Handle Toggle Status
  const handleToggleStatus = async (user: User) => {
    if (user.username === 'admin') {
      alert(isKh ? 'មិនអាចផ្អាកគណនី Root Admin បានទេ!' : 'Cannot disable primary Admin account!');
      return;
    }
    const newStatus = user.status === 'active' ? 'disabled' : 'active';
    try {
      await updateUserStatusInFirestore(user.id, newStatus);
      await logUserActivity(
        currentUser.id,
        currentUser.username,
        currentUser.role,
        'UPDATE_USER_STATUS',
        `Changed ${user.username} status to ${newStatus}`
      );
    } catch (err: any) {
      alert(err.message || 'Failed to update user status');
    }
  };

  // Handle Change Role
  const handleChangeRole = async (user: User, newRole: 'admin' | 'cashier' | 'manager') => {
    if (user.username === 'admin' && newRole !== 'admin') {
      alert(isKh ? 'មិនអាចប្តូរតួនាទី Root Admin បានទេ!' : 'Cannot change root admin role!');
      return;
    }
    try {
      await updateUserRoleInFirestore(user.id, newRole);
      await logUserActivity(
        currentUser.id,
        currentUser.username,
        currentUser.role,
        'UPDATE_USER_ROLE',
        `Changed ${user.username} role to ${newRole}`
      );
    } catch (err: any) {
      alert(err.message || 'Failed to update role');
    }
  };

  // Handle Delete User
  const handleDeleteUser = async (user: User) => {
    if (user.username === 'admin') {
      alert(isKh ? 'មិនអាចលុបគណនី Root Admin បានទេ!' : 'Cannot delete primary Admin account!');
      return;
    }
    const confirm = window.confirm(
      isKh 
        ? `តើអ្នកពិតជាចង់លុបគណនីសមាជិក "${user.fullName} (@${user.username})" មែនទេ?` 
        : `Are you sure you want to delete member account "${user.fullName} (@${user.username})"?`
    );
    if (!confirm) return;

    try {
      await deleteUserFromFirestore(user.id);
      await logUserActivity(
        currentUser.id,
        currentUser.username,
        currentUser.role,
        'DELETE_USER',
        `Deleted member ${user.username}`
      );
    } catch (err: any) {
      alert(err.message || 'Failed to delete user');
    }
  };

  // Handle Create New User Submit
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddModalError('');
    if (!newFullName.trim() || !newUsername.trim() || !newPassword.trim()) {
      setAddModalError(isKh ? 'សូមបំពេញព័ត៌មានចាំបាច់ទាំងអស់!' : 'Please fill all required fields.');
      return;
    }

    const cleanUsername = newUsername.trim().toLowerCase().replace(/\s+/g, '');
    if (users.some(u => u.username.toLowerCase() === cleanUsername)) {
      setAddModalError(isKh ? 'ឈ្មោះគណនីនេះមានរួចហើយ!' : 'Username already exists.');
      return;
    }

    setIsAdding(true);
    try {
      const newUser: User = {
        id: `user-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        username: cleanUsername,
        password: newPassword.trim(),
        fullName: newFullName.trim(),
        phone: newPhone.trim(),
        email: newEmail.trim(),
        role: newRole,
        status: 'active',
        createdAt: new Date().toISOString(),
        avatar: newAvatar || PRESET_AVATARS[0]
      };

      await saveUserToFirestore(newUser);
      await logUserActivity(
        currentUser.id,
        currentUser.username,
        currentUser.role,
        'CREATE_USER',
        `Admin created new member ${newUser.fullName} (@${newUser.username}) with role ${newUser.role}`
      );

      // Reset form
      setNewFullName('');
      setNewUsername('');
      setNewPassword('');
      setNewPhone('');
      setNewEmail('');
      setNewAvatar(PRESET_AVATARS[0]);
      setShowAddModal(false);
    } catch (err: any) {
      setAddModalError(err.message || 'Failed to create member');
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans pb-16">
      {/* Top Header - Focused on User & Member Management */}
      <header className="bg-slate-900 text-white px-6 py-4 border-b border-slate-800 sticky top-0 z-20 shadow-md">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-900/50">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-black tracking-tight text-white">
                  {isKh ? 'ប្រព័ន្ធគ្រប់គ្រងសមាជិក & អ្នកប្រើប្រាស់ (User & Member Management)' : 'User & Member Management Console'}
                </h1>
                <span className="px-2 py-0.5 rounded-md bg-indigo-500/30 text-indigo-300 text-[10px] font-bold border border-indigo-400/30">
                  Live Cloud
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium">
                {isKh 
                  ? 'គ្រប់គ្រងគណនីបុគ្គលិក សមាជិក សិទ្ធិប្រើប្រាស់ និងរូបភាពផ្ទាល់ខ្លួន (Photo Upload)' 
                  : 'Manage staff, member profiles, photo uploads, access roles & security'}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              onClick={onNavigateToPos}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition-all cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4" />
              {isKh ? 'ទៅកាន់ផ្ទាំងលក់ POS' : 'Back to POS'}
            </button>
            <button
              onClick={onLogout}
              className="px-3 py-2 bg-slate-800 hover:bg-rose-900/40 text-slate-300 hover:text-rose-300 rounded-xl text-xs font-bold flex items-center gap-1.5 border border-slate-700 transition-all cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              {isKh ? 'ចាកចេញ' : 'Logout'}
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-6 pt-6 space-y-6">
        
        {/* User & Member Specific KPI Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                {isKh ? 'សមាជិក & អ្នកប្រើប្រាស់សរុប' : 'Total Members'}
              </span>
              <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900">{totalUsers}</span>
              <span className="text-xs font-bold text-slate-500">
                {isKh ? 'គណនី' : 'Accounts'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              {isKh ? 'ទិន្នន័យផ្ទុកលើ Firestore Cloud' : 'Synchronized in Firestore'}
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                {isKh ? 'គណនីសកម្ម' : 'Active Members'}
              </span>
              <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                <UserCheck className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-black text-emerald-600">{activeUsers}</span>
              {disabledUsers > 0 && (
                <span className="text-xs font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded">
                  {disabledUsers} {isKh ? 'ផ្អាក' : 'Disabled'}
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              {isKh ? 'មានសិទ្ធិចូលប្រព័ន្ធពេញលេញ' : 'Ready to sign in'}
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                {isKh ? 'បេឡាករ & បុគ្គលិកលក់' : 'Cashiers / Staff'}
              </span>
              <div className="p-2 rounded-xl bg-sky-50 text-sky-600">
                <ShoppingBag className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900">{cashiersCount}</span>
              <span className="text-xs font-bold text-sky-600 bg-sky-50 px-1.5 py-0.5 rounded">
                Cashiers
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              {isKh ? 'កាន់កាប់ការលក់ និងចេញវិក្កយបត្រ' : 'Assigned to POS Terminal'}
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                {isKh ? 'ថ្នាក់គ្រប់គ្រង (Admin & Manager)' : 'Admins & Managers'}
              </span>
              <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
                <ShieldCheck className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900">{adminsCount + managersCount}</span>
              <span className="text-xs font-bold text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded">
                {adminsCount} Admins, {managersCount} Mgrs
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              {isKh ? 'សិទ្ធិគ្រប់គ្រងទិន្នន័យ & របាយការណ៍' : 'Management & Reports'}
            </p>
          </div>
        </div>

        {/* Members Management Table Section */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
          
          {/* Table Controls */}
          <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-600" />
                {isKh ? 'បញ្ជីគណនីសមាជិក និងបុគ្គលិកទាំងអស់' : 'Registered Users & Members'}
              </h3>
              <p className="text-xs text-slate-400 font-medium">
                {isKh 
                  ? 'គ្រប់គ្រងរូបភាព Profile ព័ត៌មានលម្អិត តួនាទី និងពាក្យសម្ងាត់' 
                  : 'Manage profile photos, info, roles and passwords'}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
              {/* Search Bar */}
              <div className="relative flex-1 md:w-60">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={isKh ? 'ស្វែងរកតាមឈ្មោះ/លេខទូរស័ព្ទ...' : 'Search name, username, phone...'}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 font-medium"
                />
              </div>

              {/* Role Filter */}
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value as any)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
              >
                <option value="all">{isKh ? 'តួនាទីទាំងអស់' : 'All Roles'}</option>
                <option value="admin">Admin</option>
                <option value="manager">Manager</option>
                <option value="cashier">Cashier</option>
              </select>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
              >
                <option value="all">{isKh ? 'ស្ថានភាពទាំងអស់' : 'All Status'}</option>
                <option value="active">{isKh ? 'សកម្ម (Active)' : 'Active'}</option>
                <option value="disabled">{isKh ? 'ផ្អាក (Disabled)' : 'Disabled'}</option>
              </select>

              {/* Add Member Button */}
              <button
                onClick={() => setShowAddModal(true)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                <span>{isKh ? 'បន្ថែមសមាជិកថ្មី' : 'Add Member'}</span>
              </button>
            </div>
          </div>

          {/* Table Content */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/75 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">{isKh ? 'រូបភាព & ឈ្មោះសមាជិក' : 'Member & Avatar'}</th>
                  <th className="px-4 py-3.5">{isKh ? 'ព័ត៌មានទំនាក់ទំនង' : 'Contact'}</th>
                  <th className="px-4 py-3.5">{isKh ? 'តួនាទី' : 'Role'}</th>
                  <th className="px-4 py-3.5">{isKh ? 'ស្ថានភាព' : 'Status'}</th>
                  <th className="px-4 py-3.5">{isKh ? 'កាលបរិច្ឆេទ' : 'Created Date'}</th>
                  <th className="px-5 py-3.5 text-right">{isKh ? 'សកម្មភាព' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-10 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Users className="w-8 h-8 text-slate-300" />
                        <span>{isKh ? 'រកមិនឃើញគណនីដែលត្រូវនឹងលក្ខខណ្ឌស្វែងរកទេ' : 'No members found matching your search.'}</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => {
                    const isRootAdmin = u.username === 'admin';
                    return (
                      <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                        {/* Member Photo & Name */}
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="relative group">
                              <img
                                src={u.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'}
                                alt={u.fullName}
                                className="w-10 h-10 rounded-full object-cover ring-2 ring-slate-200 shrink-0 group-hover:opacity-80 transition-opacity"
                              />
                              <button
                                onClick={() => handleOpenEditModal(u)}
                                className="absolute inset-0 flex items-center justify-center bg-black/40 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                                title={isKh ? 'កែសម្រួលរូបភាព' : 'Edit photo'}
                              >
                                <Camera className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <div>
                              <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                                {u.fullName}
                                {isRootAdmin && (
                                  <span className="px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 text-[10px] font-extrabold">
                                    ROOT ADMIN
                                  </span>
                                )}
                              </div>
                              <div className="text-slate-400 font-mono text-xs">
                                @{u.username}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Contact */}
                        <td className="px-4 py-3.5 text-slate-600">
                          <div className="space-y-0.5">
                            {u.phone ? (
                              <div className="flex items-center gap-1.5 font-medium">
                                <Phone className="w-3 h-3 text-slate-400" />
                                <span>{u.phone}</span>
                              </div>
                            ) : (
                              <span className="text-slate-300">-</span>
                            )}
                            {u.email && (
                              <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                                <Mail className="w-3 h-3 text-slate-400" />
                                <span>{u.email}</span>
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Role Selector */}
                        <td className="px-4 py-3.5">
                          {isRootAdmin ? (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full font-bold text-[11px] bg-indigo-100 text-indigo-800">
                              Admin
                            </span>
                          ) : (
                            <select
                              value={u.role}
                              onChange={(e) => handleChangeRole(u, e.target.value as any)}
                              className="px-2.5 py-1.5 rounded-lg text-xs font-bold border border-slate-200 bg-white text-slate-800 focus:outline-none cursor-pointer"
                            >
                              <option value="cashier">{isKh ? 'បេឡាករ (Cashier)' : 'Cashier'}</option>
                              <option value="manager">{isKh ? 'អ្នកគ្រប់គ្រង (Manager)' : 'Manager'}</option>
                              <option value="admin">{isKh ? 'អ្នកគ្រប់គ្រងប្រព័ន្ធ (Admin)' : 'Admin'}</option>
                            </select>
                          )}
                        </td>

                        {/* Status Toggle */}
                        <td className="px-4 py-3.5">
                          {isRootAdmin ? (
                            <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full text-xs font-bold">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Active
                            </span>
                          ) : (
                            <button
                              onClick={() => handleToggleStatus(u)}
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                                u.status === 'active'
                                  ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                                  : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                              }`}
                            >
                              {u.status === 'active' ? (
                                <>
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>Active</span>
                                </>
                              ) : (
                                <>
                                  <UserX className="w-3.5 h-3.5" />
                                  <span>Disabled</span>
                                </>
                              )}
                            </button>
                          )}
                        </td>

                        {/* Created Date */}
                        <td className="px-4 py-3.5 text-slate-500 font-mono text-[11px]">
                          {u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-GB') : '-'}
                        </td>

                        {/* Actions */}
                        <td className="px-5 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleOpenEditModal(u)}
                              className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                              title={isKh ? 'កែសម្រួលគណនី' : 'Edit Member'}
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            {!isRootAdmin && (
                              <button
                                onClick={() => handleDeleteUser(u)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                title={isKh ? 'លុបគណនី' : 'Delete Member'}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
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

        {/* Member Audit & Activity Logs */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-5 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-indigo-600" />
              <h3 className="font-bold text-sm text-slate-900">
                {isKh ? 'កំណត់ត្រាសកម្មភាពសមាជិក (Member Activity & Audit Logs)' : 'Member Activity & Audit Logs'}
              </h3>
            </div>
            <span className="text-xs text-slate-400 font-medium font-mono">
              Live Real-Time
            </span>
          </div>

          <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto">
            {activityLogs.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400">
                {isKh ? 'មិនទាន់មានកំណត់ត្រាសកម្មភាពនៅឡើយទេ' : 'No member activities logged yet.'}
              </div>
            ) : (
              activityLogs.map((log) => (
                <div key={log.id} className="py-2.5 flex items-center justify-between text-xs gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono text-[10px] font-bold">
                      {log.action}
                    </span>
                    <span className="font-bold text-slate-800">@{log.username}</span>
                    <span className="text-slate-600 truncate">{log.details}</span>
                  </div>
                  <span className="text-slate-400 text-[11px] font-mono shrink-0">
                    {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

      </main>

      {/* Add Member Modal (With Photo Upload) */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h4 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-indigo-600" />
                {isKh ? 'បង្កើតគណនីសមាជិកថ្មី (New Member)' : 'Create New Member Account'}
              </h4>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {addModalError && (
              <div className="p-3 bg-rose-50 text-rose-700 border border-rose-200 rounded-xl text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{addModalError}</span>
              </div>
            )}

            <form onSubmit={handleCreateUser} className="space-y-3.5">
              {/* Photo Upload for New Member */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
                <label className="block text-xs font-bold text-slate-700">
                  {isKh ? 'រូបភាព Profile (Avatar Photo)' : 'Profile Avatar'}
                </label>
                <div className="flex items-center gap-3">
                  <img
                    src={newAvatar || PRESET_AVATARS[0]}
                    alt="New member"
                    className="w-14 h-14 rounded-2xl object-cover ring-2 ring-indigo-200 shadow-xs"
                  />
                  <div className="space-y-1">
                    <input
                      type="file"
                      ref={addFileInputRef}
                      onChange={(e) => handleFileUpload(e, setNewAvatar)}
                      accept="image/*"
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => addFileInputRef.current?.click()}
                      className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                      <Upload className="w-3.5 h-3.5 text-indigo-600" />
                      <span>{isKh ? 'Upload រូបភាព' : 'Upload Photo'}</span>
                    </button>
                  </div>
                </div>

                {/* Presets */}
                <div className="flex items-center gap-1.5 pt-1 overflow-x-auto">
                  {PRESET_AVATARS.slice(0, 6).map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setNewAvatar(preset)}
                      className={`w-7 h-7 rounded-lg overflow-hidden ring-2 transition-all cursor-pointer ${
                        newAvatar === preset ? 'ring-indigo-600 scale-105' : 'ring-transparent opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={preset} alt="preset" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {isKh ? 'ឈ្មោះពេញ (Full Name) *' : 'Full Name *'}
                </label>
                <input
                  type="text"
                  required
                  value={newFullName}
                  onChange={(e) => setNewFullName(e.target.value)}
                  placeholder="e.g. Sok Piseth"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {isKh ? 'ឈ្មោះគណនី (Username) *' : 'Username *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    placeholder="piseth01"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {isKh ? 'តួនាទី (Role)' : 'Role'}
                  </label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none font-bold text-indigo-700 cursor-pointer"
                  >
                    <option value="cashier">Cashier (បេឡាករ)</option>
                    <option value="manager">Manager (អ្នកគ្រប់គ្រង)</option>
                    <option value="admin">Admin (អ្នកគ្រប់គ្រងប្រព័ន្ធ)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {isKh ? 'ពាក្យសម្ងាត់ (Password) *' : 'Password *'}
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {isKh ? 'លេខទូរស័ព្ទ' : 'Phone'}
                  </label>
                  <input
                    type="tel"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    placeholder="012 345 678"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {isKh ? 'អ៊ីមែល' : 'Email'}
                  </label>
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="user@pos.com"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
                >
                  {isKh ? 'បោះបង់' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={isAdding}
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold cursor-pointer disabled:opacity-50"
                >
                  {isAdding ? 'Saving...' : (isKh ? 'បង្កើតសមាជិក' : 'Create Member')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Member Modal (With Photo Upload & Details) */}
      {editingUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h4 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-indigo-600" />
                {isKh ? 'កែប្រែព័ត៌មានសមាជិក (Edit Member)' : 'Edit Member Details'}
              </h4>
              <button
                onClick={() => setEditingUser(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {editModalError && (
              <div className="p-3 bg-rose-50 text-rose-700 border border-rose-200 rounded-xl text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{editModalError}</span>
              </div>
            )}

            <form onSubmit={handleSaveEditUser} className="space-y-3.5">
              {/* Photo Upload */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
                <label className="block text-xs font-bold text-slate-700">
                  {isKh ? 'រូបភាពផ្ទាល់ខ្លួន (Profile Photo / Avatar)' : 'Member Profile Photo'}
                </label>
                <div className="flex items-center gap-3">
                  <img
                    src={editAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'}
                    alt="Editing"
                    className="w-14 h-14 rounded-2xl object-cover ring-2 ring-indigo-200 shadow-xs"
                  />
                  <div className="space-y-1">
                    <input
                      type="file"
                      ref={editFileInputRef}
                      onChange={(e) => handleFileUpload(e, setEditAvatar)}
                      accept="image/*"
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => editFileInputRef.current?.click()}
                      className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                      <Upload className="w-3.5 h-3.5 text-indigo-600" />
                      <span>{isKh ? 'Upload រូបភាពថ្មី' : 'Change Photo'}</span>
                    </button>
                  </div>
                </div>

                {/* Presets */}
                <div className="flex items-center gap-1.5 pt-1 overflow-x-auto">
                  {PRESET_AVATARS.slice(0, 6).map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setEditAvatar(preset)}
                      className={`w-7 h-7 rounded-lg overflow-hidden ring-2 transition-all cursor-pointer ${
                        editAvatar === preset ? 'ring-indigo-600 scale-105' : 'ring-transparent opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={preset} alt="preset" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {isKh ? 'ឈ្មោះពេញ *' : 'Full Name *'}
                </label>
                <input
                  type="text"
                  required
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {isKh ? 'ឈ្មោះគណនី (មិនអាចប្តូរ)' : 'Username (Readonly)'}
                  </label>
                  <input
                    type="text"
                    disabled
                    value={editingUser.username}
                    className="w-full px-3.5 py-2 bg-slate-100 border border-slate-200 rounded-xl text-sm text-slate-500 font-mono cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {isKh ? 'តួនាទី' : 'Role'}
                  </label>
                  <select
                    disabled={editingUser.username === 'admin'}
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none font-bold text-indigo-700 cursor-pointer disabled:opacity-60"
                  >
                    <option value="cashier">Cashier</option>
                    <option value="manager">Manager</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {isKh ? 'លេខទូរស័ព្ទ' : 'Phone'}
                  </label>
                  <input
                    type="tel"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    placeholder="012 345 678"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {isKh ? 'អ៊ីមែល' : 'Email'}
                  </label>
                  <input
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    placeholder="user@pos.com"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {isKh ? 'ប្តូរពាក្យសម្ងាត់ (ទុកទទេបើមិនចង់ប្តូរ)' : 'Reset Password (Leave blank to keep)'}
                </label>
                <input
                  type="password"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
                >
                  {isKh ? 'បោះបង់' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={isEditing}
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold cursor-pointer disabled:opacity-50"
                >
                  {isEditing ? 'Saving...' : (isKh ? 'រក្សាទុកការកែប្រែ' : 'Save Changes')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
