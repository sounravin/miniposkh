import React, { useState, useRef } from 'react';
import { 
  User as UserIcon, 
  Upload, 
  Camera, 
  X, 
  Check, 
  KeyRound, 
  Phone, 
  Mail, 
  ShieldCheck, 
  Sparkles, 
  Trash2, 
  Image as ImageIcon,
  Eye,
  EyeOff,
  AlertCircle
} from 'lucide-react';
import { User } from '../types';
import { saveUserToFirestore, logUserActivity } from '../lib/firestoreService';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  onUpdateUser?: (updatedUser: User) => void;
  onUserUpdated?: (updatedUser: User) => void;
  language: 'en' | 'kh';
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

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUpdateUser,
  onUserUpdated,
  language,
}) => {
  const isKh = language === 'kh';
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [fullName, setFullName] = useState(currentUser.fullName || '');
  const [phone, setPhone] = useState(currentUser.phone || '');
  const [email, setEmail] = useState(currentUser.email || '');
  const [avatar, setAvatar] = useState(currentUser.avatar || '');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  // Handle local file upload with base64 conversion
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMessage(isKh ? 'សូមជ្រើសរើសប្រភេទឯកសារជារូបភាព (JPG, PNG, WebP)!' : 'Please choose an image file (JPG, PNG, WebP)!');
      return;
    }

    if (file.size > 3 * 1024 * 1024) {
      setErrorMessage(isKh ? 'ទំហំរូបភាពមិនគួរលើសពី 3MB ឡើយ!' : 'Image file size should not exceed 3MB.');
      return;
    }

    setErrorMessage('');
    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === 'string') {
        setAvatar(event.target.result);
      }
    };
    reader.readAsDataURL(file);
  };

  // Handle Save
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!fullName.trim()) {
      setErrorMessage(isKh ? 'សូមបញ្ចូលឈ្មោះពេញ!' : 'Please enter full name.');
      return;
    }

    setIsSaving(true);
    try {
      const updatedUser: User = {
        ...currentUser,
        fullName: fullName.trim(),
        phone: phone.trim(),
        email: email.trim(),
        avatar: avatar || currentUser.avatar,
        password: newPassword.trim() ? newPassword.trim() : currentUser.password,
      };

      await saveUserToFirestore(updatedUser);
      await logUserActivity(
        currentUser.id,
        currentUser.username,
        currentUser.role,
        'UPDATE_PROFILE',
        `${currentUser.username} updated their profile info and photo`
      );

      if (onUpdateUser) {
        onUpdateUser(updatedUser);
      }
      if (onUserUpdated) {
        onUserUpdated(updatedUser);
      }
      setSuccessMessage(isKh ? 'បានកែប្រែព័ត៌មាន Profile ជោគជ័យ!' : 'Profile updated successfully!');
      
      setTimeout(() => {
        setSuccessMessage('');
        onClose();
      }, 1000);
    } catch (err: any) {
      console.error('Update profile error:', err);
      setErrorMessage(err.message || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 border border-slate-100 my-8">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <UserIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-900">
                {isKh ? 'កែសម្រួលព័ត៌មានគណនី (Member Profile)' : 'Edit Member Profile'}
              </h3>
              <p className="text-xs text-slate-400 font-mono">@{currentUser.username}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback Messages */}
        {errorMessage && (
          <div className="p-3 bg-rose-50 text-rose-700 border border-rose-200 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="p-3 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-xs flex items-center gap-2">
            <Check className="w-4 h-4 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        <form onSubmit={handleSaveProfile} className="space-y-4">
          {/* Avatar Upload Section */}
          <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200/80 space-y-3">
            <label className="block text-xs font-extrabold text-slate-700">
              {isKh ? 'រូបភាពផ្ទាល់ខ្លួន (Profile Photo / Avatar)' : 'Profile Photo & Avatar'}
            </label>
            
            <div className="flex flex-col sm:flex-row items-center gap-4">
              {/* Preview with Overlaid Upload Trigger */}
              <div className="relative group">
                <img
                  src={avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'}
                  alt={fullName}
                  className="w-20 h-20 rounded-2xl object-cover ring-4 ring-white shadow-md group-hover:opacity-90 transition-opacity"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 text-white rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-[10px] font-bold gap-1"
                >
                  <Camera className="w-5 h-5" />
                  <span>{isKh ? 'ប្តូររូប' : 'Change'}</span>
                </button>
              </div>

              {/* Upload Buttons */}
              <div className="flex-1 space-y-2 text-center sm:text-left">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageFileChange}
                  accept="image/*"
                  className="hidden"
                />
                <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>{isKh ? 'Upload រូបភាពផ្ទាល់ខ្លួន' : 'Upload From Computer'}</span>
                  </button>
                  {avatar && (
                    <button
                      type="button"
                      onClick={() => setAvatar('')}
                      className="px-2.5 py-1.5 bg-slate-200 hover:bg-rose-100 hover:text-rose-700 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
                      title={isKh ? 'លុបរូបភាព' : 'Reset avatar'}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <p className="text-[11px] text-slate-400">
                  {isKh ? 'គាំទ្ររូបភាព PNG, JPG, WebP ដល់ 3MB' : 'Supports PNG, JPG, WebP up to 3MB'}
                </p>
              </div>
            </div>

            {/* Quick Avatar Presets */}
            <div className="pt-2 border-t border-slate-200/60">
              <span className="text-[11px] font-bold text-slate-500 block mb-1.5">
                {isKh ? 'ឬជ្រើសរើស Avatar គំរូស្អាតៗ៖' : 'Or select preset avatar:'}
              </span>
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {PRESET_AVATARS.map((presetUrl, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setAvatar(presetUrl)}
                    className={`w-9 h-9 rounded-xl overflow-hidden ring-2 transition-all shrink-0 cursor-pointer ${
                      avatar === presetUrl ? 'ring-indigo-600 scale-105 shadow-xs' : 'ring-transparent hover:ring-slate-300'
                    }`}
                  >
                    <img src={presetUrl} alt="preset" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Form Fields */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {isKh ? 'ឈ្មោះពេញ (Full Name) *' : 'Full Name *'}
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Sok Piseth"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 font-medium"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {isKh ? 'លេខទូរស័ព្ទ' : 'Phone Number'}
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="012 345 678"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {isKh ? 'អ៊ីមែល' : 'Email Address'}
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="user@pos.com"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                  />
                </div>
              </div>
            </div>

            {/* Change Password */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {isKh ? 'ប្តូរពាក្យសម្ងាត់ថ្មី (ទុកទទេបើមិនចង់ប្តូរ)' : 'New Password (Leave blank to keep current)'}
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Role & Status (Read Only) */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-indigo-600" />
                <span className="text-slate-500">{isKh ? 'តួនាទីក្នុងប្រព័ន្ធ៖' : 'Account Role:'}</span>
                <span className="font-bold text-slate-800 uppercase">{currentUser.role}</span>
              </div>
              <span className="px-2 py-0.5 rounded font-bold text-[10px] bg-emerald-100 text-emerald-700">
                ACTIVE
              </span>
            </div>
          </div>

          {/* Modal Actions */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              {isKh ? 'បោះបង់' : 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 transition-all cursor-pointer disabled:opacity-50"
            >
              {isSaving ? (isKh ? 'កំពុងរក្សាទុក...' : 'Saving...') : (isKh ? 'រក្សាទុកការកែប្រែ' : 'Save Changes')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
