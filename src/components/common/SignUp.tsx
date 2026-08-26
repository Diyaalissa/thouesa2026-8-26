import React, { useState, useEffect } from 'react';
import {
  User as UserIcon,
  Phone,
  Mail,
  MapPin,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  ArrowLeft,
  RotateCw,
  Sparkles,
  Plane,
  Box,
  FileCheck,
  Building,
  Edit3,
  HelpCircle,
} from 'lucide-react';
import { Locale, User, UserRole, EscrowWallet } from '../../types';

export interface SignUpProps {
  locale: Locale;
  initialRole?: UserRole;
  onSuccess: (user: User, wallet?: EscrowWallet) => void;
  onCancel?: () => void;
  onSwitchToSignIn?: () => void;
  embedded?: boolean;
}

interface RegistrationFormData {
  fullName: string;
  countryCode: string;
  phoneNumber: string;
  email: string;
  country: string;
  city: string;
  streetAddress: string;
  buildingOrNotes: string;
  password: string;
  role: UserRole;
  acceptTerms: boolean;
}

const DRAFT_STORAGE_KEY = 'thouesa_signup_draft_v1';

const COUNTRY_CODES = [
  { code: '+962', flag: '🇯🇴', nameAr: 'الأردن', nameEn: 'Jordan' },
  { code: '+213', flag: '🇩🇿', nameAr: 'الجزائر', nameEn: 'Algeria' },
  { code: '+968', flag: '🇴🇲', nameAr: 'سلطنة عُمان', nameEn: 'Oman' },
  { code: '+20', flag: '🇪🇬', nameAr: 'مصر', nameEn: 'Egypt' },
  { code: '+966', flag: '🇸🇦', nameAr: 'السعودية', nameEn: 'Saudi Arabia' },
  { code: '+971', flag: '🇦🇪', nameAr: 'الإمارات', nameEn: 'UAE' },
  { code: '+974', flag: '🇶🇦', nameAr: 'قطر', nameEn: 'Qatar' },
  { code: '+965', flag: '🇰🇼', nameAr: 'الكويت', nameEn: 'Kuwait' },
  { code: '+90', flag: '🇹🇷', nameAr: 'تركيا', nameEn: 'Turkey' },
  { code: '+44', flag: '🇬🇧', nameAr: 'المملكة المتحدة', nameEn: 'UK' },
];

export const SignUp: React.FC<SignUpProps> = ({
  locale,
  initialRole = 'SENDER',
  onSuccess,
  onCancel,
  onSwitchToSignIn,
  embedded = false,
}) => {
  const isAr = locale === 'ar';
  const ArrowIcon = isAr ? ArrowLeft : ArrowRight;

  // View steps: FORM -> PENDING_VERIFICATION -> VERIFIED
  const [step, setStep] = useState<'FORM' | 'PENDING_VERIFICATION' | 'VERIFIED'>('FORM');

  // Form State
  const [formData, setFormData] = useState<RegistrationFormData>(() => {
    try {
      const saved = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // ignore
    }
    return {
      fullName: '',
      countryCode: '+962',
      phoneNumber: '',
      email: '',
      country: isAr ? 'الأردن' : 'Jordan',
      city: isAr ? 'عمان' : 'Amman',
      streetAddress: '',
      buildingOrNotes: '',
      password: '',
      role: initialRole,
      acceptTerms: true,
    };
  });

  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Registered user response from backend
  const [registeredUser, setRegisteredUser] = useState<User | null>(null);
  const [registeredWallet, setRegisteredWallet] = useState<EscrowWallet | null>(null);

  // OTP Verification state
  const [otpCode, setOtpCode] = useState('');
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(45);
  const [resendStatus, setResendStatus] = useState<string | null>(null);
  const [hasDraftNotice, setHasDraftNotice] = useState(false);

  // Auto-save form draft
  useEffect(() => {
    if (step === 'FORM') {
      try {
        localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(formData));
      } catch {
        // ignore
      }
    }
  }, [formData, step]);

  // Resend Timer
  useEffect(() => {
    let timer: any;
    if (step === 'PENDING_VERIFICATION' && resendCountdown > 0) {
      timer = setInterval(() => {
        setResendCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [step, resendCountdown]);

  const handleInputChange = (field: keyof RegistrationFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrorMessage(null);
  };

  const getFullPhone = () => {
    const cleanNumber = formData.phoneNumber.trim().replace(/^0+/, '');
    return `${formData.countryCode} ${cleanNumber}`;
  };

  const getFullAddress = () => {
    const parts = [
      formData.country,
      formData.city,
      formData.streetAddress,
      formData.buildingOrNotes,
    ].filter(Boolean);
    return parts.join(' - ');
  };

  // Password strength calculation
  const getPasswordStrength = () => {
    const p = formData.password;
    if (!p) return { score: 0, textAr: 'فارغة', textEn: 'Empty', color: 'bg-slate-700' };
    if (p.length < 6) return { score: 1, textAr: 'ضعيفة جداً', textEn: 'Very Weak', color: 'bg-red-500' };
    if (p.length < 8) return { score: 2, textAr: 'متوسطة', textEn: 'Fair', color: 'bg-amber-500' };
    return { score: 3, textAr: 'قوية ومحمية', textEn: 'Strong', color: 'bg-emerald-500' };
  };

  // Form Submission
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    // Validation
    if (!formData.fullName.trim()) {
      setErrorMessage(isAr ? 'الرجاء إدخال الاسم الكامل الثلاثي' : 'Please enter your full legal name');
      return;
    }
    if (!formData.phoneNumber.trim()) {
      setErrorMessage(isAr ? 'الرجاء إدخال رقم الهاتف الجوال' : 'Please enter your phone number');
      return;
    }
    if (!formData.email.trim() || !formData.email.includes('@')) {
      setErrorMessage(isAr ? 'الرجاء إدخال بريد إلكتروني صحيح' : 'Please enter a valid email address');
      return;
    }
    if (!formData.streetAddress.trim()) {
      setErrorMessage(isAr ? 'الرجاء إدخال العنوان بالتفصيل (الشارع والحي)' : 'Please enter your street address');
      return;
    }
    if (!formData.acceptTerms) {
      setErrorMessage(
        isAr
          ? 'يجب الموافقة على شروط السلامة الجوية والضمان المالي'
          : 'You must accept the Aviation Safety & Escrow terms'
      );
      return;
    }

    setIsSubmitting(true);
    const fullPhone = getFullPhone();
    const fullAddress = getFullAddress();

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: formData.fullName.trim(),
          phone: fullPhone,
          email: formData.email.trim(),
          address: fullAddress,
          password: formData.password || 'securePass123',
          role: formData.role,
        }),
      });

      const data = await response.json();

      if (data.success && data.user) {
        setRegisteredUser(data.user);
        setRegisteredWallet(data.wallet);
        // Clear saved draft on successful registration capture
        try {
          localStorage.removeItem(DRAFT_STORAGE_KEY);
        } catch {
          // ignore
        }

        // Transition to Pending Verification State
        setStep('PENDING_VERIFICATION');
        setResendCountdown(60);
        setSuccessMessage(
          isAr
            ? 'تم حفظ بيانات التسجيل بنجاح! يرجى إدخال رمز التحقق لتفعيل الحساب.'
            : 'Registration recorded! Please enter the verification code to activate your account.'
        );
      } else {
        setErrorMessage(data.error || (isAr ? 'فشل إنشاء الحساب، يرجى المحاولة ثانية' : 'Registration failed'));
      }
    } catch (err) {
      setErrorMessage(isAr ? 'تعذر الاتصال بالخادم الرئيسي' : 'Server communication error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // OTP Verification Submission
  const handleVerifyOtp = async (codeToVerify?: string) => {
    const code = codeToVerify || otpCode;
    if (!code || code.trim().length < 4) {
      setErrorMessage(isAr ? 'الرجاء إدخال رمز التحقق المكون من 4 أرقام' : 'Please enter the 4-digit code');
      return;
    }

    setIsVerifyingOtp(true);
    setErrorMessage(null);

    try {
      const response = await fetch('/api/auth/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: registeredUser?.id,
          phone: registeredUser?.phone || getFullPhone(),
          email: registeredUser?.email || formData.email,
          code: code.trim(),
        }),
      });

      const data = await response.json();

      if (data.success && data.user) {
        setRegisteredUser(data.user);
        setStep('VERIFIED');
        setSuccessMessage(data.message);

        // Notify parent auth logic
        setTimeout(() => {
          onSuccess(data.user, data.wallet || registeredWallet);
        }, 1000);
      } else {
        setErrorMessage(data.error || (isAr ? 'رمز التحقق غير صحيح' : 'Invalid verification code'));
      }
    } catch (err) {
      setErrorMessage(isAr ? 'تعذر التحقق من الرمز' : 'Could not verify code');
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  // Skip / Continue in Pending State (User can proceed immediately with KYC pending status)
  const handleContinueWithPendingState = () => {
    if (registeredUser) {
      onSuccess(registeredUser, registeredWallet || undefined);
    } else {
      // Fallback
      const fallbackUser: User = {
        id: `usr-reg-${Date.now()}`,
        fullName: formData.fullName,
        email: formData.email,
        phone: getFullPhone(),
        address: getFullAddress(),
        role: formData.role,
        kycStatus: 'PENDING',
        isActive: true,
        preferredLocale: locale,
        totalShipments: 0,
        createdAt: new Date().toISOString(),
      };
      onSuccess(fallbackUser);
    }
  };

  // Resend Verification Code
  const handleResendCode = async () => {
    if (resendCountdown > 0) return;

    try {
      const res = await fetch('/api/auth/resend-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: registeredUser?.phone || getFullPhone(),
          email: registeredUser?.email || formData.email,
        }),
      }).then((r) => r.json());

      if (res.success) {
        setResendCountdown(60);
        setResendStatus(isAr ? 'تم إرسال رمز جديد بنجاح' : 'New code dispatched successfully');
        setTimeout(() => setResendStatus(null), 4000);
      }
    } catch {
      setErrorMessage(isAr ? 'تعذر إرسال الرمز' : 'Failed to resend code');
    }
  };

  const strength = getPasswordStrength();

  return (
    <div
      className={`w-full ${
        embedded ? 'p-0' : 'max-w-2xl mx-auto bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl'
      } text-slate-100 transition-all`}
      dir={isAr ? 'rtl' : 'ltr'}
    >
      {/* 1. STEP INDICATOR BAR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-800 text-xs">
        <div className="flex items-center gap-2">
          <span
            className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs ${
              step === 'FORM'
                ? 'bg-brand-500 text-white ring-2 ring-brand-300/40'
                : 'bg-teal-600 text-white'
            }`}
          >
            {step !== 'FORM' ? <CheckCircle2 className="w-4 h-4" /> : '1'}
          </span>
          <div>
            <span className="font-bold block text-slate-200">
              {isAr ? 'بيانات التسجيل والعنوان' : 'Registration & Address'}
            </span>
            <span className="text-[10px] text-slate-400">
              {isAr ? 'الهاتف، البريد، وموقع التوصيل' : 'Phone, Email, and Delivery Location'}
            </span>
          </div>
        </div>

        <div className="h-0.5 flex-1 mx-4 bg-slate-800 relative">
          <div
            className={`h-full bg-brand-400 transition-all duration-500 ${
              step === 'FORM' ? 'w-0' : step === 'PENDING_VERIFICATION' ? 'w-1/2' : 'w-full'
            }`}
          />
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs ${
              step === 'PENDING_VERIFICATION'
                ? 'bg-brand-500 text-white ring-2 ring-brand-300/40 animate-pulse'
                : step === 'VERIFIED'
                ? 'bg-teal-600 text-white'
                : 'bg-slate-800 text-slate-400'
            }`}
          >
            {step === 'VERIFIED' ? <CheckCircle2 className="w-4 h-4" /> : '2'}
          </span>
          <div>
            <span className="font-bold block text-slate-200">
              {isAr ? 'حالة التوثيق (Pending)' : 'Verification (Pending)'}
            </span>
            <span className="text-[10px] text-slate-400">
              {isAr ? 'تأكيد الرمز وتوثيق الهوية' : 'OTP Code & Identity Status'}
            </span>
          </div>
        </div>
      </div>

      {/* Messages */}
      {errorMessage && (
        <div className="mb-4 flex items-center gap-2.5 p-3.5 bg-red-500/15 border border-red-500/30 rounded-2xl text-red-300 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="mb-4 flex items-center gap-2.5 p-3.5 bg-emerald-500/15 border border-emerald-500/30 rounded-2xl text-emerald-300 text-xs">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* =========================================================
          VIEW 1: REGISTRATION CAPTURE FORM (PHONE, EMAIL, ADDRESS)
          ========================================================= */}
      {step === 'FORM' && (
        <form onSubmit={handleFormSubmit} className="space-y-4">
          {/* Account Role Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              {isAr ? 'نوع الحساب والغرض الأساسي:' : 'Account Purpose & Role:'}
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleInputChange('role', 'SENDER')}
                className={`flex items-center gap-2.5 p-3 rounded-2xl border text-start transition-all cursor-pointer ${
                  formData.role === 'SENDER'
                    ? 'bg-brand-500/20 border-brand-400 text-white ring-1 ring-brand-400'
                    : 'bg-slate-800/60 border-slate-700/80 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                    formData.role === 'SENDER' ? 'bg-brand-500 text-white' : 'bg-slate-700 text-slate-300'
                  }`}
                >
                  <Box className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold text-xs block">{isAr ? 'مرسل / متسوق' : 'Sender / Buyer'}</span>
                  <span className="text-[10px] text-slate-400">
                    {isAr ? 'إرسال طرود وشراء دولي' : 'Send parcels & shop abroad'}
                  </span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleInputChange('role', 'TRAVELER')}
                className={`flex items-center gap-2.5 p-3 rounded-2xl border text-start transition-all cursor-pointer ${
                  formData.role === 'TRAVELER'
                    ? 'bg-teal-600/20 border-emerald-500 text-white ring-1 ring-emerald-500'
                    : 'bg-slate-800/60 border-slate-700/80 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                    formData.role === 'TRAVELER' ? 'bg-teal-600 text-white' : 'bg-slate-700 text-slate-300'
                  }`}
                >
                  <Plane className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold text-xs block">{isAr ? 'مسافر معتمد' : 'Verified Traveler'}</span>
                  <span className="text-[10px] text-slate-400">
                    {isAr ? 'نقل أمتعة وكسب عوائد' : 'Carry parcels on flights'}
                  </span>
                </div>
              </button>
            </div>
          </div>

          {/* Full Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              {isAr ? 'الاسم الكامل الثلاثي (مطابق للهوية الرسمية) *' : 'Full Legal Name (as on ID/Passport) *'}
            </label>
            <div className="relative">
              <UserIcon className="w-4 h-4 text-slate-400 absolute top-3.5 start-3.5" />
              <input
                type="text"
                required
                value={formData.fullName}
                onChange={(e) => handleInputChange('fullName', e.target.value)}
                placeholder={isAr ? 'مثال: محمد عبدالله الشمري' : 'e.g. Tariq Al-Hashemi'}
                className="w-full ps-10 pe-3.5 py-2.5 bg-slate-800/90 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-brand-400 transition-colors"
              />
            </div>
          </div>

          {/* Phone Number & Country Code Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              {isAr ? 'رقم الهاتف الجوال لتلقي رمز التحقق (SMS/WhatsApp) *' : 'Mobile Phone for OTP Verification *'}
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-2">
              {/* Country Dial Code */}
              <div className="relative sm:col-span-1">
                <select
                  value={formData.countryCode}
                  onChange={(e) => handleInputChange('countryCode', e.target.value)}
                  className="w-full py-2.5 px-3 bg-slate-800/90 border border-slate-700 rounded-xl text-xs text-white focus:outline-hidden focus:border-brand-400 cursor-pointer"
                >
                  {COUNTRY_CODES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.flag} {c.code} ({isAr ? c.nameAr : c.nameEn})
                    </option>
                  ))}
                </select>
              </div>

              {/* Number Input */}
              <div className="relative sm:col-span-2">
                <Phone className="w-4 h-4 text-slate-400 absolute top-3.5 start-3.5" />
                <input
                  type="tel"
                  required
                  value={formData.phoneNumber}
                  onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                  placeholder={isAr ? '79 123 4567 أو 550 12 34 56' : '79 123 4567'}
                  className="w-full ps-10 pe-3.5 py-2.5 bg-slate-800/90 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-brand-400 transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Email Address */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              {isAr ? 'البريد الإلكتروني للتوثيق والإشعارات الرسمية *' : 'Email Address for Confirmation & Invoices *'}
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute top-3.5 start-3.5" />
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="user@example.com"
                className="w-full ps-10 pe-3.5 py-2.5 bg-slate-800/90 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-brand-400 transition-colors"
              />
            </div>
          </div>

          {/* Detailed Address Section */}
          <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
              <MapPin className="w-4 h-4 text-emerald-400" />
              <span>{isAr ? 'العنوان الجغرافي وموقع الاستلام / التوصيل *' : 'Physical Residence & Delivery Address *'}</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">
                  {isAr ? 'الدولة' : 'Country'}
                </label>
                <select
                  value={formData.country}
                  onChange={(e) => handleInputChange('country', e.target.value)}
                  className="w-full py-2 px-3 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-hidden focus:border-brand-400"
                >
                  <option value={isAr ? 'الأردن' : 'Jordan'}>🇯🇴 {isAr ? 'الأردن' : 'Jordan'}</option>
                  <option value={isAr ? 'الجزائر' : 'Algeria'}>🇩🇿 {isAr ? 'الجزائر' : 'Algeria'}</option>
                  <option value={isAr ? 'سلطنة عُمان' : 'Oman'}>🇴🇲 {isAr ? 'سلطنة عُمان' : 'Oman'}</option>
                  <option value={isAr ? 'مصر' : 'Egypt'}>🇪🇬 {isAr ? 'مصر' : 'Egypt'}</option>
                  <option value={isAr ? 'السعودية' : 'Saudi Arabia'}>🇸🇦 {isAr ? 'السعودية' : 'Saudi Arabia'}</option>
                  <option value={isAr ? 'الإمارات' : 'UAE'}>🇦🇪 {isAr ? 'الإمارات' : 'UAE'}</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">
                  {isAr ? 'المدينة / المحافظة' : 'City / State'}
                </label>
                <input
                  type="text"
                  required
                  value={formData.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  placeholder={isAr ? 'عمان / الجزائر العاصمة / مسقط' : 'Amman / Algiers / Muscat'}
                  className="w-full py-2 px-3 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-hidden focus:border-brand-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">
                {isAr ? 'اسم الشارع والحي بالتفصيل *' : 'Street & District *'}
              </label>
              <input
                type="text"
                required
                value={formData.streetAddress}
                onChange={(e) => handleInputChange('streetAddress', e.target.value)}
                placeholder={isAr ? 'شارع مكة، حي الروابي، بالقرب من مجمع الأمل' : 'Medina St, Al-Rawabi District'}
                className="w-full py-2 px-3 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-hidden focus:border-brand-400"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">
                {isAr ? 'رقم البناية / الطابق / علامة مميزة (اختياري)' : 'Building No / Apartment / Landmark (Optional)'}
              </label>
              <input
                type="text"
                value={formData.buildingOrNotes}
                onChange={(e) => handleInputChange('buildingOrNotes', e.target.value)}
                placeholder={isAr ? 'عمارة 24، الطابق الثاني، شقة 5' : 'Bldg 24, Apt 5'}
                className="w-full py-2 px-3 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-hidden focus:border-brand-400"
              />
            </div>
          </div>

          {/* Password & Strength Meter */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-300">
                {isAr ? 'كلمة مرور الحساب *' : 'Account Password *'}
              </label>
              {formData.password && (
                <span className="text-[10px] font-bold text-slate-400">
                  {isAr ? 'القوة:' : 'Strength:'}{' '}
                  <span className={strength.score === 3 ? 'text-emerald-400' : 'text-amber-400'}>
                    {isAr ? strength.textAr : strength.textEn}
                  </span>
                </span>
              )}
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute top-3.5 start-3.5" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                placeholder="••••••••••••"
                className="w-full ps-10 pe-10 py-2.5 bg-slate-800/90 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-brand-400 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute top-3 end-3 text-slate-400 hover:text-slate-200 transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {formData.password && (
              <div className="flex gap-1 mt-1.5 h-1">
                <div className={`flex-1 rounded-full ${strength.score >= 1 ? strength.color : 'bg-slate-800'}`} />
                <div className={`flex-1 rounded-full ${strength.score >= 2 ? strength.color : 'bg-slate-800'}`} />
                <div className={`flex-1 rounded-full ${strength.score >= 3 ? strength.color : 'bg-slate-800'}`} />
              </div>
            )}
          </div>

          {/* Aviation & Escrow Terms */}
          <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-brand-400/10 border border-brand-400/20 text-xs">
            <input
              type="checkbox"
              id="signup-terms"
              checked={formData.acceptTerms}
              onChange={(e) => handleInputChange('acceptTerms', e.target.checked)}
              className="mt-0.5 rounded-sm border-slate-700 bg-slate-800 text-brand-500 focus:ring-brand-400 cursor-pointer"
            />
            <label htmlFor="signup-terms" className="text-slate-300 leading-relaxed cursor-pointer select-none">
              {isAr
                ? 'أوافق على سياسة فحص الطرود بالمراكز المعتمدة، وقوانين السلامة الجوية الدولية (IATA)، والضمان المالي المشدد 100% (Escrow).'
                : 'I agree to the physical Hub inspection rules, IATA aviation safety guidelines, and 100% Escrow security guarantee.'}
            </label>
          </div>

          {/* Submit Button */}
          <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex-1 flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-400 hover:to-brand-500 text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-brand-500/30 transition-all hover:scale-[1.01] cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <RotateCw className="w-4 h-4 animate-spin" />
                  <span>{isAr ? 'جاري تسجيل البيانات وحفظ الحساب...' : 'Recording Registration...'}</span>
                </>
              ) : (
                <>
                  <span>{isAr ? 'تسجيل ومتابعة التوثيق (Save & Verify)' : 'Register & Proceed to Verification'}</span>
                  <ArrowIcon className="w-4 h-4" />
                </>
              )}
            </button>

            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="w-full sm:w-auto px-5 py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
            )}
          </div>

          {/* Link to sign in */}
          {onSwitchToSignIn && (
            <div className="text-center pt-2 text-xs text-slate-400">
              <span>{isAr ? 'لديك حساب بالفعل؟' : 'Already have an account?'} </span>
              <button
                type="button"
                onClick={onSwitchToSignIn}
                className="text-brand-300 hover:text-brand-300 font-bold underline cursor-pointer"
              >
                {isAr ? 'سجل دخولك هنا' : 'Sign in here'}
              </button>
            </div>
          )}
        </form>
      )}

      {/* =========================================================
          VIEW 2: PENDING VERIFICATION VIEW (STATE SAVED & PENDING)
          ========================================================= */}
      {step === 'PENDING_VERIFICATION' && (
        <div className="space-y-6">
          {/* Header Status Card */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-brand-900/40 via-slate-900 to-brand-950/40 border border-brand-400/30 text-center relative overflow-hidden">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center mb-3">
              <Clock className="w-7 h-7 animate-pulse" />
            </div>
            <span className="inline-block px-3 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-full text-xs font-bold mb-2">
              {isAr ? 'الحالة: بانتظار التوثيق (Pending Verification)' : 'Status: Pending Verification'}
            </span>
            <h3 className="text-lg sm:text-xl font-black text-white mb-1">
              {isAr ? 'تم حفظ بياناتك بنجاح وبانتظار رمز التوثيق' : 'Registration Captured & Verification Pending'}
            </h3>
            <p className="text-xs text-slate-300 max-w-md mx-auto leading-relaxed">
              {isAr
                ? 'تم تسجيل حسابك وتجهيز المحفظة المالية بنجاح. أرسلنا رمز تحقق إلى هاتفك وبريدك لتأكيد الملكية.'
                : 'Your profile and Escrow wallet have been initialized. A verification code has been dispatched.'}
            </p>
          </div>

          {/* Captured Data Summary Breakdown */}
          <div className="bg-slate-950/70 p-4 sm:p-5 rounded-2xl border border-slate-800 space-y-3.5">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
              <span className="text-xs font-bold text-slate-300">
                {isAr ? 'ملخص البيانات المسجلة بالنظام:' : 'Registered Profile Details:'}
              </span>
              <button
                type="button"
                onClick={() => setStep('FORM')}
                className="flex items-center gap-1 text-[11px] text-brand-300 hover:text-brand-300 font-semibold cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>{isAr ? 'تعديل البيانات' : 'Edit Details'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800">
                <span className="text-slate-400 text-[11px] block">{isAr ? 'الاسم الكامل' : 'Full Name'}</span>
                <span className="font-bold text-white text-sm">
                  {registeredUser?.fullName || formData.fullName}
                </span>
                <span className="inline-block mt-1 px-2 py-0.5 rounded-md bg-brand-400/20 text-brand-300 text-[10px] font-semibold">
                  {formData.role === 'TRAVELER' ? (isAr ? 'مسافر معتمد' : 'Traveler') : (isAr ? 'مرسل / متسوق' : 'Sender')}
                </span>
              </div>

              <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800">
                <span className="text-slate-400 text-[11px] block">{isAr ? 'رقم الهاتف المسجل' : 'Phone Number'}</span>
                <span className="font-bold text-white text-sm" dir="ltr">
                  {registeredUser?.phone || getFullPhone()}
                </span>
                <span className="inline-block mt-1 px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 text-[10px] font-semibold">
                  {isAr ? 'بانتظار رمز SMS' : 'SMS Code Sent'}
                </span>
              </div>

              <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800">
                <span className="text-slate-400 text-[11px] block">{isAr ? 'البريد الإلكتروني' : 'Email Address'}</span>
                <span className="font-bold text-white text-sm">
                  {registeredUser?.email || formData.email}
                </span>
                <span className="inline-block mt-1 px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 text-[10px] font-semibold">
                  {isAr ? 'بانتظار تأكيد البريد' : 'Verification Link Sent'}
                </span>
              </div>

              <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800">
                <span className="text-slate-400 text-[11px] block">{isAr ? 'العنوان المعتمد' : 'Physical Address'}</span>
                <span className="font-medium text-slate-200 text-xs truncate block" title={registeredUser?.address || getFullAddress()}>
                  {registeredUser?.address || getFullAddress()}
                </span>
                <span className="inline-block mt-1 px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 text-[10px] font-semibold">
                  {isAr ? 'موقع التوصيل المعتمد' : 'Primary Delivery Hub Zone'}
                </span>
              </div>
            </div>
          </div>

          {/* Interactive OTP Verification Section */}
          <div className="bg-slate-900 p-5 rounded-2xl border border-brand-400/40 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-brand-300" />
                  <span>{isAr ? 'أدخل رمز التحقق (OTP)' : 'Enter 4-Digit OTP Code'}</span>
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {isAr
                    ? 'أدخل الرمز المرسل لهاتفك أو اضغط على الرمز التجريبي السريع'
                    : 'Enter code sent via SMS or click demo code below'}
                </p>
              </div>

              {/* Demo auto-fill chip */}
              <button
                type="button"
                onClick={() => {
                  setOtpCode('9842');
                  handleVerifyOtp('9842');
                }}
                className="px-2.5 py-1 rounded-lg bg-brand-400/20 hover:bg-brand-400/30 text-brand-300 border border-brand-400/30 text-xs font-bold transition-all cursor-pointer"
                title={isAr ? 'استخدام الرمز التجريبي الافتراضي' : 'Auto-fill Demo Code'}
              >
                {isAr ? 'رمز تجريبي: 9842 ⚡' : 'Demo OTP: 9842 ⚡'}
              </button>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="text"
                maxLength={6}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                placeholder="9842"
                className="flex-1 py-3 px-4 bg-slate-950 border border-slate-700 focus:border-brand-400 rounded-xl text-center text-xl font-mono tracking-widest text-white focus:outline-hidden"
              />

              <button
                type="button"
                onClick={() => handleVerifyOtp()}
                disabled={isVerifyingOtp || !otpCode}
                className="px-6 py-3 bg-brand-500 hover:bg-brand-400 text-white font-bold text-xs rounded-xl transition-all cursor-pointer disabled:opacity-50 shadow-md shadow-brand-500/30"
              >
                {isVerifyingOtp ? (
                  <RotateCw className="w-4 h-4 animate-spin" />
                ) : (
                  <span>{isAr ? 'تأكيد الرمز' : 'Verify'}</span>
                )}
              </button>
            </div>

            {/* Resend Code Strip */}
            <div className="flex items-center justify-between text-xs pt-1 text-slate-400">
              <span>{isAr ? 'لم يصلك الرمز بعد؟' : "Didn't receive the code?"}</span>
              <button
                type="button"
                onClick={handleResendCode}
                disabled={resendCountdown > 0}
                className={`font-semibold cursor-pointer ${
                  resendCountdown > 0 ? 'text-slate-500' : 'text-brand-300 hover:underline'
                }`}
              >
                {resendCountdown > 0
                  ? isAr
                    ? `إعادة الإرسال خلال (${resendCountdown}ث)`
                    : `Resend in (${resendCountdown}s)`
                  : isAr
                  ? 'إعادة إرسال رمز التحقق الآن'
                  : 'Resend Code Now'}
              </button>
            </div>

            {resendStatus && (
              <p className="text-xs text-emerald-400 font-medium text-center">{resendStatus}</p>
            )}
          </div>

          {/* KYC / Identity Verification Notice */}
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-start gap-3 text-xs text-slate-300">
            <FileCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold text-slate-200 block">
                {isAr ? 'معلومات توثيق الهوية الوطنية (KYC Policy):' : 'Identity Verification (KYC Policy):'}
              </span>
              <p className="text-slate-400 leading-relaxed text-[11px]">
                {isAr
                  ? 'تم تسجيل حسابك وتفعيله للتصفح وإنشاء مسودات الشحنات. سيتم طلب التحقق من جواز السفر أو الهوية الوطنية عند تسليم الطرد في المركز المعتمد لضمان الأمان والامتثال.'
                  : 'Your account is active for browsing and preparing shipments. Passport / National ID inspection will take place at certified physical hubs.'}
              </p>
            </div>
          </div>

          {/* Primary Action Transitions */}
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
            <button
              type="button"
              onClick={handleContinueWithPendingState}
              className="w-full flex-1 flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-teal-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-teal-600/30 transition-all hover:scale-[1.01] cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>
                {isAr
                  ? 'الدخول إلى المنصة (متابعة بحالة قيد التوثيق)'
                  : 'Enter Platform (Continue with Pending Status)'}
              </span>
              <ArrowIcon className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => setStep('FORM')}
              className="w-full sm:w-auto px-5 py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
            >
              {isAr ? 'الرجوع لتعديل البيانات' : 'Back to Edit'}
            </button>
          </div>
        </div>
      )}

      {/* =========================================================
          VIEW 3: FULLY VERIFIED SUCCESS VIEW
          ========================================================= */}
      {step === 'VERIFIED' && (
        <div className="p-8 text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center animate-bounce">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h3 className="text-2xl font-black text-white">
            {isAr ? 'تم التحقق وتفعيل الحساب بنجاح!' : 'Account Successfully Verified!'}
          </h3>
          <p className="text-xs text-slate-300 max-w-sm mx-auto">
            {isAr
              ? 'تم ربط رقم الهاتف والبريد الإلكتروني بحسابك. جاري نقلك إلى لوحة التحكم المخصصة...'
              : 'Your phone & email are verified. Redirecting to your personal dashboard...'}
          </p>
          <div className="pt-2">
            <button
              type="button"
              onClick={handleContinueWithPendingState}
              className="px-6 py-2.5 bg-brand-500 hover:bg-brand-400 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer"
            >
              {isAr ? 'الانتقال للوحة التحكم الآن' : 'Go to Dashboard Now'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
