import React, { useState } from 'react';
import {
  ShieldCheck,
  Globe,
  Wallet,
  User,
  Plane,
  Box,
  Building2,
  Lock,
  ChevronDown,
  Sparkles,
  ArrowRightLeft,
  CheckCircle2,
  Palette,
  LogIn,
  UserPlus,
} from 'lucide-react';
import { EscrowWallet, Locale, ThemeMode, UserRole, User as UserType } from '../../types';
import { formatCurrency } from '../../lib/crypto';
import { DEMO_PROFILES, THEMES } from '../../lib/constants';

interface HeaderProps {
  currentUser: UserType | null;
  wallet: EscrowWallet | null;
  currentRole: UserRole | 'PUBLIC';
  onRoleChange: (role: UserRole | 'PUBLIC') => void;
  locale: Locale;
  onLocaleChange: (loc: Locale) => void;
  themeMode: ThemeMode;
  onThemeChange: (theme: ThemeMode) => void;
  onOpenAuth: (mode?: 'SIGNIN' | 'SIGNUP' | 'EMPLOYEE') => void;
  onOpenTopup?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  wallet,
  currentRole,
  onRoleChange,
  locale,
  onLocaleChange,
  themeMode,
  onThemeChange,
  onOpenAuth,
  onOpenTopup,
}) => {
  const isAr = locale === 'ar';
  const [showThemeMenu, setShowThemeMenu] = useState(false);

  const roleOptions: { key: UserRole | 'PUBLIC'; labelAr: string; labelEn: string; icon: any; color: string }[] = [
    {
      key: 'PUBLIC',
      labelAr: 'الرئيسية العامة',
      labelEn: 'Public Landing',
      icon: Globe,
      color: 'bg-slate-700 text-white',
    },
    {
      key: 'SENDER',
      labelAr: 'المرسل (العميل)',
      labelEn: 'Sender (Client)',
      icon: Box,
      color: 'bg-blue-600 text-white',
    },
    {
      key: 'TRAVELER',
      labelAr: 'المسافر المعتمد',
      labelEn: 'Verified Traveler',
      icon: Plane,
      color: 'bg-emerald-600 text-white',
    },
    {
      key: 'HUB_AGENT',
      labelAr: 'بوابة الموظفين المركزية',
      labelEn: 'Central Staff Terminal',
      icon: Building2,
      color: 'bg-amber-600 text-white',
    },
    {
      key: 'MASTER_ADMIN',
      labelAr: 'الإدارة المركزية',
      labelEn: 'Master Admin',
      icon: Lock,
      color: 'bg-purple-600 text-white',
    },
  ];

  return (
    <header className="sticky top-0 z-40 bg-slate-900 border-b border-slate-800 text-white select-none shadow-md">
      {/* Top Demo Profile Quick Switcher Bar */}
      <div className="bg-slate-950/95 border-b border-slate-800/80 px-4 py-1.5 text-xs">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-slate-400">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="font-medium text-slate-300">
              {isAr ? 'البيئة التشغيلية المباشرة — اختر الواجهة المخصصة:' : 'Live Production Terminal — Select Portal & Role:'}
            </span>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 scrollbar-none">
            {roleOptions.map((opt) => {
              const Icon = opt.icon;
              const isSelected = currentRole === opt.key;
              return (
                <button
                  key={opt.key}
                  onClick={() => onRoleChange(opt.key)}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold transition-all whitespace-nowrap cursor-pointer ${
                    isSelected
                      ? `${opt.color} shadow-xs ring-2 ring-white/30 scale-102`
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                  }`}
                >
                  <Icon className="w-3 h-3" />
                  <span>{isAr ? opt.labelAr : opt.labelEn}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        {/* Brand & Identity */}
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => onRoleChange('PUBLIC')}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 text-white flex items-center justify-center font-black text-lg shadow-lg shadow-blue-500/25 ring-2 ring-blue-400/30">
            TH
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black tracking-tight text-white flex items-center gap-1.5">
                <span>{isAr ? 'ثويسا' : 'THOUESA'}</span>
                <span className="text-xs font-semibold px-2 py-0.5 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-full">
                  Escrow P2P
                </span>
              </h1>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              {isAr ? 'الشحن التشاركي المعتمد والضمان المالي المشدد' : 'Cross-Border P2P Logistics & Escrow'}
            </p>
          </div>
        </div>

        {/* Right Tools: Theme Switcher, Auth Buttons, Wallet & Locale */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Theme Switcher Menu */}
          <div className="relative">
            <button
              onClick={() => setShowThemeMenu(!showThemeMenu)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs font-semibold text-slate-200 transition-colors cursor-pointer"
              title={isAr ? 'تغيير سمة المظهر (Theme)' : 'Change Visual Theme'}
            >
              <Palette className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden md:inline">
                {THEMES.find((t) => t.id === themeMode)?.labelAr || 'السمة'}
              </span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {showThemeMenu && (
              <div
                className="absolute end-0 mt-2 w-52 bg-slate-900 border border-slate-700 rounded-2xl shadow-xl p-2 z-50 space-y-1"
                dir={isAr ? 'rtl' : 'ltr'}
              >
                <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  {isAr ? 'اختر سمة المظهر:' : 'Select Theme:'}
                </div>
                {THEMES.map((th) => {
                  const active = themeMode === th.id;
                  return (
                    <button
                      key={th.id}
                      onClick={() => {
                        onThemeChange(th.id);
                        setShowThemeMenu(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all text-start cursor-pointer ${
                        active
                          ? 'bg-blue-600 text-white font-bold'
                          : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="w-3.5 h-3.5 rounded-full border border-white/20 shrink-0"
                          style={{ backgroundColor: th.accentColor }}
                        />
                        <span>{isAr ? th.labelAr : th.labelEn}</span>
                      </div>
                      {active && <CheckCircle2 className="w-3.5 h-3.5" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Auth Button for Guests / Quick Login */}
          {currentRole === 'PUBLIC' && (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => onOpenAuth('SIGNIN')}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5 text-blue-400" />
                <span>{isAr ? 'دخول' : 'Sign In'}</span>
              </button>

              <button
                onClick={() => onOpenAuth('SIGNUP')}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>{isAr ? 'تسجيل جديد' : 'Sign Up'}</span>
              </button>
            </div>
          )}

          {/* Escrow Wallet Pill (for Logged In Users) */}
          {wallet && currentRole !== 'PUBLIC' && (
            <div className="flex items-center gap-2 bg-slate-800/90 border border-slate-700/80 px-3 py-1.5 rounded-xl text-xs">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <Wallet className="w-4 h-4" />
              </div>
              <div className="text-right rtl:text-right ltr:text-left">
                <div className="flex items-center gap-1 text-[10px] text-slate-400">
                  <span>{isAr ? 'الرصيد المتاح' : 'Available'}</span>
                  {wallet.lockedEscrowDeposit > 0 && (
                    <span className="text-amber-400 font-medium">
                      ({isAr ? 'محجوز' : 'Locked'}: {formatCurrency(wallet.lockedEscrowDeposit, 'USD')})
                    </span>
                  )}
                </div>
                <span className="font-bold text-slate-100">{formatCurrency(wallet.balance, wallet.currency)}</span>
              </div>
            </div>
          )}

          {/* User Profile Badge */}
          {currentUser && currentRole !== 'PUBLIC' && (
            <div className="hidden md:flex items-center gap-2 bg-slate-800/80 px-2.5 py-1.5 rounded-xl border border-slate-700/60">
              <div className="w-7 h-7 rounded-full bg-blue-600/40 text-blue-300 font-bold text-xs flex items-center justify-center border border-blue-400/30 overflow-hidden">
                {currentUser.avatarUrl ? (
                  <img src={currentUser.avatarUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  currentUser.fullName.charAt(0)
                )}
              </div>
              <div className="text-right rtl:text-right ltr:text-left">
                <div className="text-[11px] font-bold text-slate-200 truncate max-w-[120px]">
                  {currentUser.fullName.split(' ')[0]}
                </div>
                <div className="text-[10px] text-emerald-400 flex items-center gap-0.5">
                  <ShieldCheck className="w-2.5 h-2.5" />
                  <span>{currentUser.role}</span>
                </div>
              </div>
            </div>
          )}

          {/* Language Switcher */}
          <button
            onClick={() => onLocaleChange(locale === 'ar' ? 'en' : 'ar')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
            title="Switch Language (العربية / English)"
          >
            <Globe className="w-3.5 h-3.5 text-blue-400" />
            <span>{locale === 'ar' ? 'English' : 'عربي'}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
