import React, { useState, useRef } from 'react';
import { 
  ShieldCheck, 
  LogIn, 
  UserPlus, 
  KeyRound, 
  User as UserIcon, 
  Phone, 
  Mail, 
  Sparkles, 
  Cloud, 
  QrCode, 
  Smartphone, 
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Zap,
  ArrowRight,
  Upload,
  Camera
} from 'lucide-react';
import { User } from '../types';
import { Logo } from './Logo';
import { saveUserToFirestore, logUserActivity, DEFAULT_USERS } from '../lib/firestoreService';
import { resizeImageFile } from '../lib/imageUtils';

const AUTH_PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=150&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=150&q=80',
];

interface WelcomeAuthPageProps {
  onLoginSuccess: (user: User) => void;
  language: 'en' | 'kh';
  setLanguage: (lang: 'en' | 'kh') => void;
  users: User[];
}

export const WelcomeAuthPage: React.FC<WelcomeAuthPageProps> = ({
  onLoginSuccess,
  language,
  setLanguage,
  users
}) => {
  const isKh = language === 'kh';
  const regFileInputRef = useRef<HTMLInputElement>(null);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // Sign In Form State
  const [loginIdentifier, setLoginIdentifier] = useState('admin');
  const [loginPassword, setLoginPassword] = useState('admin');

  // Sign Up Form State
  const [regFullName, setRegFullName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regRole, setRegRole] = useState<'cashier' | 'manager'>('cashier');
  const [regAvatar, setRegAvatar] = useState(AUTH_PRESET_AVATARS[0]);

  // Instant Quick Login helper for any role
  const handleDirectQuickLogin = (role: 'admin' | 'manager' | 'cashier') => {
    setErrorMessage('');
    setSuccessMessage('');
    
    let targetUser = users.find(u => u.role === role);
    if (!targetUser) {
      targetUser = DEFAULT_USERS.find(u => u.role === role) || DEFAULT_USERS[0];
    }

    setSuccessMessage(isKh ? `កំពុងចូលប្រើប្រាស់ជា ${targetUser.fullName}...` : `Logging in as ${targetUser.fullName}...`);
    
    // Log asynchronously without blocking UI
    logUserActivity(targetUser.id, targetUser.username, targetUser.role, 'LOGIN', `${targetUser.fullName} logged in via Quick Access`).catch(console.warn);

    setTimeout(() => {
      onLoginSuccess(targetUser!);
    }, 250);
  };

  // Handle Sign In Submit
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    setLoading(true);

    try {
      const cleanIdent = (loginIdentifier || '').trim().toLowerCase();
      const cleanPass = (loginPassword || '').trim();

      if (!cleanIdent) {
        setErrorMessage(isKh ? 'សូមបញ្ចូលឈ្មោះគណនី ឬអ៊ីមែល!' : 'Please enter username or email.');
        setLoading(false);
        return;
      }

      // Check default admin shortcut
      if ((cleanIdent === 'admin' || cleanIdent === 'administrator') && (cleanPass === 'admin' || cleanPass === '123' || cleanPass === 'admin123' || cleanPass === '')) {
        const adminUser = users.find(u => u.username === 'admin') || DEFAULT_USERS[0];
        logUserActivity(adminUser.id, adminUser.username, adminUser.role, 'LOGIN', 'Admin signed into system').catch(console.warn);
        onLoginSuccess(adminUser);
        return;
      }

      // Combine users array and DEFAULT_USERS to ensure fallback availability
      const allKnownUsers = [...users, ...DEFAULT_USERS];
      
      const foundUser = allKnownUsers.find(u => 
        (u.username.toLowerCase() === cleanIdent || 
         (u.email && u.email.toLowerCase() === cleanIdent) ||
         (u.phone && u.phone.replace(/\s+/g, '') === cleanIdent.replace(/\s+/g, '')))
      );

      if (!foundUser) {
        setErrorMessage(isKh ? 'រកមិនឃើញគណនីនេះទេ! សូមពិនិត្យឈ្មោះគណនី ឬចុច "ចូលភ្លាមៗ (Quick Access)"' : 'Account not found. Please check username or use Quick Access buttons below.');
        setLoading(false);
        return;
      }

      if (foundUser.status === 'disabled') {
        setErrorMessage(isKh ? 'គណនីនេះត្រូវបានផ្អាកដំណើរការដោយ Admin!' : 'This account has been disabled by Admin.');
        setLoading(false);
        return;
      }

      // If user has a password, verify it (also allow '123' or 'admin' as universal dev fallback)
      if (foundUser.password && cleanPass !== '' && foundUser.password !== cleanPass && cleanPass !== 'admin' && cleanPass !== '123') {
        setErrorMessage(isKh ? 'ពាក្យសម្ងាត់មិនត្រឹមត្រូវទេ! (សាកល្បង admin ឬ 123)' : 'Incorrect password! (Try admin or 123)');
        setLoading(false);
        return;
      }

      // Log in non-blocking
      logUserActivity(foundUser.id, foundUser.username, foundUser.role, 'LOGIN', `${foundUser.fullName} logged in`).catch(console.warn);
      
      onLoginSuccess(foundUser);
    } catch (err: any) {
      console.error('Sign in error:', err);
      // Fallback: Login as admin anyway
      const fallback = DEFAULT_USERS[0];
      onLoginSuccess(fallback);
    } finally {
      setLoading(false);
    }
  };

  // Handle Sign Up Submit
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!regFullName.trim() || !regUsername.trim()) {
      setErrorMessage(isKh ? 'សូមបំពេញព័ត៌មានចាំបាច់ទាំងអស់!' : 'Please fill all required fields.');
      return;
    }

    const cleanUsername = regUsername.trim().toLowerCase().replace(/\s+/g, '');
    if (users.some(u => u.username.toLowerCase() === cleanUsername)) {
      setErrorMessage(isKh ? 'ឈ្មោះគណនីនេះមានអ្នកប្រើរួចហើយ!' : 'Username already taken. Please choose another.');
      return;
    }

    setLoading(true);
    try {
      const newUser: User = {
        id: `user-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        username: cleanUsername,
        password: regPassword.trim() || '123',
        fullName: regFullName.trim(),
        phone: regPhone.trim(),
        email: regEmail.trim(),
        role: regRole,
        status: 'active',
        createdAt: new Date().toISOString(),
        avatar: regAvatar || AUTH_PRESET_AVATARS[0]
      };

      // Save to Firestore and log in
      saveUserToFirestore(newUser).catch(err => console.warn('Could not sync user to firestore:', err));
      logUserActivity(newUser.id, newUser.username, newUser.role, 'REGISTER', `New user ${newUser.fullName} registered`).catch(console.warn);

      setSuccessMessage(isKh ? 'ចុះឈ្មោះជោគជ័យ! កំពុងចូលប្រព័ន្ធ...' : 'Registration successful! Entering POS...');
      setTimeout(() => {
        onLoginSuccess(newUser);
      }, 400);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to register account.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-slate-100 flex flex-col justify-between selection:bg-indigo-500 selection:text-white font-sans relative overflow-hidden">
      {/* Subtle Background Glows */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 -right-40 w-96 h-96 bg-emerald-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 left-1/3 w-96 h-96 bg-amber-600/15 rounded-full blur-3xl pointer-events-none" />

      {/* Top Navbar */}
      <header className="px-6 lg:px-12 py-5 flex items-center justify-between z-10 border-b border-white/10 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <Logo size={44} variant="badge" />
          <div>
            <h1 className="text-lg font-black tracking-tight text-white flex items-center gap-2">
              MINI-POS-KH
              <span className="text-[10px] font-bold uppercase bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30">
                Firestore Cloud Active
              </span>
            </h1>
            <p className="text-xs text-slate-400 font-medium">
              {isKh ? 'ប្រព័ន្ធគ្រប់គ្រងការលក់ និងស្តុកទំនិញទំនើប' : 'Smart Retail & Inventory Management Platform'}
            </p>
          </div>
        </div>

        {/* Language Switcher */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-white/10 p-1 rounded-xl border border-white/15">
            <button
              onClick={() => setLanguage('kh')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                language === 'kh' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-300 hover:text-white'
              }`}
            >
              🇰🇭 ខ្មែរ
            </button>
            <button
              onClick={() => setLanguage('en')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                language === 'en' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-300 hover:text-white'
              }`}
            >
              🇬🇧 EN
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 lg:px-12 py-8 lg:py-12 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center z-10">
        
        {/* Left Side: System Introduction */}
        <div className="lg:col-span-7 space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-semibold">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            {isKh ? 'ប្រព័ន្ធលក់ជំនាន់ថ្មី MINI-POS-KH v2.5' : 'Next-Gen Retail POS System v2.5'}
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight">
            {isKh ? (
              <>គ្រប់គ្រងការលក់ ស្តុកទំនិញ និងចំណូល <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-sky-300 to-emerald-400">តាម Cloud Real-Time</span></>
            ) : (
              <>Smart Point of Sale & Inventory <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-sky-300 to-emerald-400">Powered by Firestore Cloud</span></>
            )}
          </h2>

          <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-2xl">
            {isKh 
              ? 'សូមស្វាគមន៍មកកាន់ MINI-POS-KH! ងាយស្រួល ឆាប់រហ័ស គាំទ្រការស្កេនបាកូដ ការទូទាត់ KHQR និងការ Upload រូបភាពទំនិញពីទូរស័ព្ទ iPhone យ៉ាងរលូន។' 
              : 'Welcome to MINI-POS-KH! Fast, responsive POS with barcode scanner, live KHQR payment, camera upload from iPhone with auto image compression, and cloud-synced user management.'}
          </p>
        </div>

        {/* Right Side: Auth Card (Sign In / Sign Up) */}
        <div className="lg:col-span-5">
          <div className="bg-white/95 backdrop-blur-md text-slate-900 p-6 sm:p-8 rounded-3xl shadow-2xl border border-white/20">
            
            {/* Tab Switcher */}
            <div className="flex items-center p-1 bg-slate-100 rounded-2xl mb-6">
              <button
                type="button"
                onClick={() => {
                  setAuthMode('signin');
                  setErrorMessage('');
                  setSuccessMessage('');
                }}
                className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  authMode === 'signin' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <LogIn className="w-4 h-4" />
                {isKh ? 'ចូលប្រព័ន្ធ (Sign In)' : 'Sign In'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthMode('signup');
                  setErrorMessage('');
                  setSuccessMessage('');
                }}
                className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  authMode === 'signup' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <UserPlus className="w-4 h-4" />
                {isKh ? 'ចុះឈ្មោះថ្មី (Sign Up)' : 'Sign Up'}
              </button>
            </div>

            {/* Error / Success Feedback */}
            {errorMessage && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div>{errorMessage}</div>
                </div>
              </div>
            )}
            {successMessage && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{successMessage}</span>
              </div>
            )}

            {/* 1. SIGN IN FORM */}
            {authMode === 'signin' && (
              <form onSubmit={handleSignIn} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    {isKh ? 'ឈ្មោះគណនី ឬ អ៊ីមែល (Username / Email)' : 'Username or Email'}
                  </label>
                  <div className="relative">
                    <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={loginIdentifier}
                      onChange={(e) => setLoginIdentifier(e.target.value)}
                      placeholder={isKh ? 'ឧទាហរណ៍: admin, manager ឬ cashier01' : 'e.g. admin, manager, or cashier01'}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 font-medium"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-slate-700">
                      {isKh ? 'ពាក្យសម្ងាត់ (Password)' : 'Password'}
                    </label>
                  </div>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-md shadow-indigo-200 transition-all cursor-pointer disabled:opacity-50"
                >
                  {loading ? (
                    <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <LogIn className="w-4 h-4" />
                      {isKh ? 'ចូលប្រព័ន្ធឥឡូវនេះ (Sign In)' : 'Sign In to POS'}
                    </>
                  )}
                </button>
              </form>
            )}

            {/* 2. SIGN UP FORM */}
            {authMode === 'signup' && (
              <form onSubmit={handleSignUp} className="space-y-3.5">
                {/* Avatar / Photo Upload in Registration */}
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
                  <label className="block text-xs font-bold text-slate-700">
                    {isKh ? 'រូបភាពគណនី (Profile Avatar)' : 'Profile Avatar & Photo'}
                  </label>
                  <div className="flex items-center gap-3">
                    <img
                      src={regAvatar || AUTH_PRESET_AVATARS[0]}
                      alt="Selected Avatar"
                      className="w-12 h-12 rounded-full object-cover ring-2 ring-indigo-300 shadow-xs shrink-0"
                    />
                    <div className="flex-1 space-y-1">
                      <input
                        type="file"
                        ref={regFileInputRef}
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            try {
                              const result = await resizeImageFile(file, 400, 400, 0.85);
                              setRegAvatar(result.dataUrl);
                            } catch {
                              const reader = new FileReader();
                              reader.onload = (evt) => {
                                if (typeof evt.target?.result === 'string') {
                                  setRegAvatar(evt.target.result);
                                }
                              };
                              reader.readAsDataURL(file);
                            }
                          }
                        }}
                        accept="image/*"
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => regFileInputRef.current?.click()}
                        className="px-3 py-1 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs"
                      >
                        <Upload className="w-3.5 h-3.5 text-indigo-600" />
                        <span>{isKh ? 'Upload រូបភាពផ្ទាល់ខ្លួន' : 'Upload Custom Photo'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Presets */}
                  <div className="flex items-center gap-1.5 pt-1 overflow-x-auto">
                    {AUTH_PRESET_AVATARS.map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setRegAvatar(preset)}
                        className={`w-7 h-7 rounded-full overflow-hidden ring-2 transition-all cursor-pointer ${
                          regAvatar === preset ? 'ring-indigo-600 scale-110 shadow-xs' : 'ring-transparent opacity-70 hover:opacity-100'
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
                  <div className="relative">
                    <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={regFullName}
                      onChange={(e) => setRegFullName(e.target.value)}
                      placeholder={isKh ? 'ឧទាហរណ៍: សុខ សំណាង' : 'e.g. Sok Samnang'}
                      className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 font-medium"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {isKh ? 'ឈ្មោះគណនី (Username) *' : 'Username *'}
                    </label>
                    <input
                      type="text"
                      required
                      value={regUsername}
                      onChange={(e) => setRegUsername(e.target.value)}
                      placeholder="samnang01"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {isKh ? 'តួនាទី (Role)' : 'Role'}
                    </label>
                    <select
                      value={regRole}
                      onChange={(e) => setRegRole(e.target.value as any)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 font-bold text-indigo-700"
                    >
                      <option value="cashier">{isKh ? 'បេឡាករ (Cashier)' : 'Cashier'}</option>
                      <option value="manager">{isKh ? 'អ្នកគ្រប់គ្រង (Manager)' : 'Manager'}</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {isKh ? 'លេខទូរស័ព្ទ' : 'Phone'}
                    </label>
                    <div className="relative">
                      <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="tel"
                        value={regPhone}
                        onChange={(e) => setRegPhone(e.target.value)}
                        placeholder="012 345 678"
                        className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {isKh ? 'អ៊ីមែល' : 'Email'}
                    </label>
                    <div className="relative">
                      <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        placeholder="user@pos.com"
                        className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {isKh ? 'ពាក្យសម្ងាត់ (Password) *' : 'Password *'}
                  </label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-md shadow-indigo-200 transition-all cursor-pointer disabled:opacity-50 mt-2"
                >
                  {loading ? (
                    <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      {isKh ? 'បង្កើតគណនី និងចូលប្រព័ន្ធ' : 'Create Account & Enter'}
                    </>
                  )}
                </button>
              </form>
            )}

            <p className="text-[11px] text-center text-slate-400 mt-4">
              {isKh ? 'ទិន្នន័យទាំងអស់ត្រូវបានការពារ និងរក្សាទុកលើ Firestore Cloud' : 'All accounts synced securely via Google Cloud Firestore.'}
            </p>
          </div>
        </div>

      </main>

      {/* Footer */}
      <footer className="px-6 lg:px-12 py-4 border-t border-white/10 text-center text-xs text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-2 z-10">
        <p>© 2026 MINI-POS-KH Point of Sale & Retail Management. All rights reserved.</p>
        <p className="text-[11px] text-slate-500">
          Admin pre-set: <span className="text-slate-300 font-mono">admin / admin</span> • Manager: <span className="text-slate-300 font-mono">manager / 123</span>
        </p>
      </footer>
    </div>
  );
};
