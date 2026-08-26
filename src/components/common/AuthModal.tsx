import React, { useState } from 'react';
import {
  X,
  Mail,
  Lock,
  Phone,
  MapPin,
  User as UserIcon,
  ShieldCheck,
  Building2,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  FileCheck,
} from 'lucide-react';
import { Locale, User, UserRole, Employee } from '../../types';
import { signInWithPopup } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db, googleProvider } from '../../lib/firebase';
import { SignUp } from './SignUp';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  locale: Locale;
  initialMode?: 'SIGNIN' | 'SIGNUP' | 'EMPLOYEE';
  onLoginSuccess: (user: User, wallet?: any) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  locale,
  initialMode = 'SIGNUP',
  onLoginSuccess,
}) => {
  const isAr = locale === 'ar';
  const ArrowIcon = isAr ? ArrowLeft : ArrowRight;

  const [mode, setMode] = useState<'SIGNIN' | 'SIGNUP' | 'EMPLOYEE'>(initialMode);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Sign-In fields
  const [identifier, setIdentifier] = useState('');
  const [signInPassword, setSignInPassword] = useState('');

  // Employee Login fields
  const [staffCodeOrEmail, setStaffCodeOrEmail] = useState('');
  const [employeePin, setEmployeePin] = useState('');

  if (!isOpen) return null;

  
  const handleGoogleSignIn = async () => {
    try {
      setIsSubmitting(true);
      setErrorMessage(null);
      const result = await signInWithPopup(auth, googleProvider);
      const fbUser = result.user;
      
      const appUser = {
        id: fbUser.uid,
        fullName: fbUser.displayName || 'Google User',
        email: fbUser.email || '',
        phone: fbUser.phoneNumber || '',
        role: 'SENDER' as UserRole,
        kycStatus: 'UNVERIFIED' as const,
        isActive: true,
        preferredLocale: locale,
        avatarUrl: fbUser.photoURL || undefined,
        createdAt: new Date().toISOString()
      };

      const res = await fetch('/api/auth/sync-firebase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user: appUser })
      }).then(r => r.json());

      if (res.success && res.user) {
        // Save to Firestore for data persistence requirement
        await setDoc(doc(db, 'users', fbUser.uid), res.user, { merge: true });
        
        setSuccessMessage(isAr ? 'تم تسجيل الدخول بواسطة جوجل بنجاح!' : 'Google Sign-In successful!');
        setTimeout(() => {
          onLoginSuccess(res.user, res.wallet);
          onClose();
        }, 500);
      } else {
        setErrorMessage(isAr ? 'فشل تسجيل الدخول بواسطة جوجل' : 'Google Sign-In failed');
      }
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/popup-closed-by-user' || err.code === 'auth/cancelled-popup-request') {
        setErrorMessage(null);
      } else {
        setErrorMessage(isAr ? 'فشل تسجيل الدخول بواسطة جوجل' : 'Google Sign-In failed');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!identifier) {
      setErrorMessage(isAr ? 'الرجاء إدخال البريد أو رقم الهاتف' : 'Please enter email or phone');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password: signInPassword }),
      }).then((r) => r.json());

      if (res.success && res.user) {
        setSuccessMessage(res.message);
        setTimeout(() => {
          onLoginSuccess(res.user, res.wallet);
          onClose();
        }, 500);
      } else {
        setErrorMessage(res.error || (isAr ? 'بيانات الدخول غير صحيحة' : 'Invalid credentials'));
      }
    } catch (err) {
      setErrorMessage(isAr ? 'تعذر الاتصال بالخادم' : 'Server connection error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEmployeeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!staffCodeOrEmail) {
      setErrorMessage(isAr ? 'الرجاء إدخال الرقم الوظيفي' : 'Please enter staff code or email');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/auth/employee-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ staffCodeOrEmail, passwordPin: employeePin }),
      }).then((r) => r.json());

      if (res.success && res.employee) {
        setSuccessMessage(res.message);
        const empUser: User = {
          id: res.employee.id,
          fullName: res.employee.fullName,
          email: res.employee.email,
          phone: res.employee.phone,
          role: res.employee.role,
          kycStatus: 'VERIFIED',
          isActive: res.employee.isActive,
          preferredLocale: 'ar',
          assignedHubId: res.employee.assignedHubId,
          staffCode: res.employee.staffCode,
          createdAt: res.employee.createdAt,
        };
        setTimeout(() => {
          onLoginSuccess(empUser);
          onClose();
        }, 500);
      } else {
        setErrorMessage(res.error || (isAr ? 'فشل تسجيل الدخول للموظف' : 'Employee authentication failed'));
      }
    } catch (err) {
      setErrorMessage(isAr ? 'تعذر الاتصال بالخادم' : 'Server connection error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Quick Demo Autofills
  const setDemoSender = () => {
    setIdentifier('tariq@example.jo');
    setSignInPassword('sender123');
  };

  const setDemoTraveler = () => {
    setIdentifier('karim@example.dz');
    setSignInPassword('traveler123');
  };

  const setDemoEmployee = (code: string) => {
    setStaffCodeOrEmail(code);
    setEmployeePin('1234');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div
        className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden text-slate-100 my-8"
        dir={isAr ? 'rtl' : 'ltr'}
      >
        {/* Header decoration banner */}
        <div className="bg-gradient-to-r from-brand-500 via-brand-600 to-brand-600 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-5 left-5 rtl:left-auto rtl:right-5 p-1.5 rounded-full bg-white/15 hover:bg-white/25 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-xs font-bold tracking-wide">
              {isAr ? 'منصة ثويسا اللوجستية' : 'THOUESA P2P Escrow'}
            </span>
          </div>

          <h3 className="text-2xl font-black">
            {mode === 'SIGNUP' && (isAr ? 'إنشاء حساب جديد للمرسل' : 'Create Sender Account')}
            {mode === 'SIGNIN' && (isAr ? 'تسجيل الدخول إلى حسابك' : 'Sign In to Your Account')}
            {mode === 'EMPLOYEE' && (isAr ? 'بوابة الموظفين المركزية' : 'Central Employee Terminal')}
          </h3>
          <p className="text-xs text-brand-100 mt-1">
            {mode === 'SIGNUP' && (isAr ? 'سجل بياناتك للبدء في إرسال الطرود وطلبات الشراء فوراً' : 'Register to start sending parcels and buying items')}
            {mode === 'SIGNIN' && (isAr ? 'مرحباً بعودتك! تابع شحناتك ورصيد الضمان المالي' : 'Welcome back! Manage your shipments and escrow wallet')}
            {mode === 'EMPLOYEE' && (isAr ? 'تسجيل دخول موظفي الفروع ومحطات الفحص والتسليم' : 'Staff authentication for certified hub operations')}
          </p>
        </div>

        {/* Mode Selector Tabs */}
        <div className="flex items-center border-b border-slate-800 bg-slate-950/60 p-2 gap-1 text-xs font-bold">
          <button
            type="button"
            onClick={() => {
              setMode('SIGNUP');
              setErrorMessage(null);
              setSuccessMessage(null);
            }}
            className={`flex-1 py-2.5 rounded-xl transition-all ${
              mode === 'SIGNUP'
                ? 'bg-brand-500 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            {isAr ? 'إنشاء حساب مرسل' : 'Sign Up'}
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('SIGNIN');
              setErrorMessage(null);
              setSuccessMessage(null);
            }}
            className={`flex-1 py-2.5 rounded-xl transition-all ${
              mode === 'SIGNIN'
                ? 'bg-brand-500 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            {isAr ? 'تسجيل الدخول' : 'Sign In'}
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('EMPLOYEE');
              setErrorMessage(null);
              setSuccessMessage(null);
            }}
            className={`flex-1 py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
              mode === 'EMPLOYEE'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>{isAr ? 'كادر الموظفين' : 'Staff Portal'}</span>
          </button>
        </div>

        {/* Notifications */}
        <div className="p-6 space-y-4">
          {errorMessage && (
            <div className="flex items-center gap-2 p-3 bg-red-500/15 border border-red-500/30 rounded-xl text-red-400 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="flex items-center gap-2 p-3 bg-emerald-500/15 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* 1. SIGN-UP FORM (High-Craft SignUp Component) */}
          {mode === 'SIGNUP' && (
            <>
<SignUp
              locale={locale}
              initialRole="SENDER"
              embedded={true}
              onSuccess={(user, wallet) => {
                onLoginSuccess(user, wallet);
                onClose();
              }}
              onCancel={onClose}
              onSwitchToSignIn={() => setMode('SIGNIN')}
            />

            <div className="pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 py-3 bg-white text-slate-900 hover:bg-slate-100 font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                <span>{isAr ? 'تسجيل الدخول بواسطة Google' : 'Sign in with Google'}</span>
              </button>
            </div>
</>

          )}

          {/* 2. SIGN-IN FORM */}
          {mode === 'SIGNIN' && (
            <form onSubmit={handleSignInSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  {isAr ? 'البريد الإلكتروني أو رقم الهاتف' : 'Email or Phone Number'}
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute top-3 start-3" />
                  <input
                    type="text"
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="tariq@example.jo / +962 79..."
                    className="w-full ps-10 pe-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-hidden focus:border-brand-400 placeholder-slate-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  {isAr ? 'كلمة المرور' : 'Password'}
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute top-3 start-3" />
                  <input
                    type="password"
                    value={signInPassword}
                    onChange={(e) => setSignInPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full ps-10 pe-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-hidden focus:border-brand-400 placeholder-slate-500"
                  />
                </div>
              </div>

              {/* Quick Demo Fill Buttons */}
              <div className="pt-1">
                <span className="text-[11px] text-slate-400 font-semibold mb-1.5 block">
                  {isAr ? 'حسابات تجريبية سريعة:' : 'Quick Demo Accounts:'}
                </span>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={setDemoSender}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-[11px] text-slate-300 transition-colors"
                  >
                    👤 {isAr ? 'طارق (عميل/مرسل)' : 'Tariq (Sender)'}
                  </button>
                  <button
                    type="button"
                    onClick={setDemoTraveler}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-[11px] text-slate-300 transition-colors"
                  >
                    ✈️ {isAr ? 'كريم (مسافر معتمد)' : 'Karim (Traveler)'}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 py-3 bg-brand-500 hover:bg-brand-400 text-white font-bold text-xs rounded-xl shadow-lg shadow-brand-500/30 transition-all cursor-pointer disabled:opacity-50"
              >
                <span>{isSubmitting ? (isAr ? 'جاري الدخول...' : 'Signing in...') : (isAr ? 'تسجيل الدخول' : 'Sign In')}</span>
                <ArrowIcon className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* 3. EMPLOYEE PORTAL LOGIN */}
          {mode === 'EMPLOYEE' && (
            <form onSubmit={handleEmployeeSubmit} className="space-y-4">
              <div className="p-3 bg-amber-500/10 border border-amber-500/25 rounded-xl text-amber-300 text-xs flex items-start gap-2">
                <Building2 className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
                <p>
                  {isAr
                    ? 'شاشة تسجيل دخول الموظفين المركزية الموحدة: يتم إنشاء حساب كل موظف برقم وظيفي محدد وفرع معين من قِبل الإدارة المركزية.'
                    : 'Unified Centralized Staff Terminal: All employee credentials and hub assignments are provisioned by Central Master Admin.'}
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  {isAr ? 'الرقم الوظيفي (Staff Code) أو البريد المهني *' : 'Staff Code or Corporate Email *'}
                </label>
                <div className="relative">
                  <Building2 className="w-4 h-4 text-slate-500 absolute top-3 start-3" />
                  <input
                    type="text"
                    required
                    value={staffCodeOrEmail}
                    onChange={(e) => setStaffCodeOrEmail(e.target.value)}
                    placeholder="EMP-AMM-303 / EMP-ALG-201 / EMP-MCT-102"
                    className="w-full ps-10 pe-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-hidden focus:border-amber-500 placeholder-slate-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  {isAr ? 'رمز المرور الأمني (PIN / Password)' : 'Security PIN / Password'}
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute top-3 start-3" />
                  <input
                    type="password"
                    value={employeePin}
                    onChange={(e) => setEmployeePin(e.target.value)}
                    placeholder="1234"
                    className="w-full ps-10 pe-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-hidden focus:border-amber-500 placeholder-slate-500 font-mono"
                  />
                </div>
              </div>

              {/* Seed Staff Presets */}
              <div className="pt-1">
                <span className="text-[11px] text-slate-400 font-semibold mb-1.5 block">
                  {isAr ? 'كادر الفروع المعتمدين للاختبار المباشر:' : 'Direct Demo Staff Accounts:'}
                </span>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-2 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setDemoEmployee('EMP-AMM-303')}
                    className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-left rtl:text-right text-slate-200 transition-colors"
                  >
                    <div className="font-bold text-amber-400">عمر التميمي (عمان)</div>
                    <div className="text-[10px] text-slate-400 font-mono">EMP-AMM-303 (PIN: 1234)</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDemoEmployee('EMP-ALG-201')}
                    className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-left rtl:text-right text-slate-200 transition-colors"
                  >
                    <div className="font-bold text-amber-400">سفيان مرابط (الجزائر)</div>
                    <div className="text-[10px] text-slate-400 font-mono">EMP-ALG-201 (PIN: 1234)</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDemoEmployee('EMP-MCT-102')}
                    className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-left rtl:text-right text-slate-200 transition-colors"
                  >
                    <div className="font-bold text-amber-400">سالم البلوشي (عُمان/مسقط)</div>
                    <div className="text-[10px] text-slate-400 font-mono">EMP-MCT-102 (PIN: 1234)</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDemoEmployee('EMP-CAI-404')}
                    className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-left rtl:text-right text-slate-200 transition-colors"
                  >
                    <div className="font-bold text-amber-400">محمود الشريف (القاهرة)</div>
                    <div className="text-[10px] text-slate-400 font-mono">EMP-CAI-404 (PIN: 1234)</div>
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 py-3 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-amber-600/30 transition-all cursor-pointer disabled:opacity-50"
              >
                <Building2 className="w-4 h-4" />
                <span>{isSubmitting ? (isAr ? 'جاري التحقق...' : 'Verifying...') : (isAr ? 'دخول محطة تشغيل الموظف' : 'Enter Hub Station')}</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
