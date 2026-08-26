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
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 p-6 text-white relative">
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
          <p className="text-xs text-blue-100 mt-1">
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
                ? 'bg-blue-600 text-white shadow-xs'
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
                ? 'bg-blue-600 text-white shadow-xs'
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
                    className="w-full ps-10 pe-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-hidden focus:border-blue-500 placeholder-slate-500"
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
                    className="w-full ps-10 pe-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-hidden focus:border-blue-500 placeholder-slate-500"
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
                className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-600/30 transition-all cursor-pointer disabled:opacity-50"
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
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
