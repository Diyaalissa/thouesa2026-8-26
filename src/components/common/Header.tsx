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
  Sun,
  Moon,
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
  const isLight = themeMode === 'light';
  const [showThemeMenu, setShowThemeMenu] = useState(false);

  const toggleLightDarkMode = () => {
    onThemeChange(isLight ? 'slate' : 'light');
  };

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
    <header
      id="main-app-header"
      className={`sticky top-0 z-40 select-none transition-colors duration-200 ${
        isLight
          ? 'bg-white/95 border-b border-slate-200 text-slate-900 shadow-xs backdrop-blur-md'
          : 'bg-slate-900/95 border-b border-slate-800 text-white shadow-md backdrop-blur-md'
      }`}
    >
      {/* Top Demo Profile Quick Switcher Bar */}
      <div
        className={`px-4 py-1.5 text-xs transition-colors duration-200 ${
          isLight
            ? 'bg-slate-100/90 border-b border-slate-200 text-slate-600'
            : 'bg-slate-950/95 border-b border-slate-800/80 text-slate-400'
        }`}
      >
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span className={`font-medium ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
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
                  id={`role-btn-${opt.key.toLowerCase()}`}
                  onClick={() => onRoleChange(opt.key)}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold transition-all whitespace-nowrap cursor-pointer ${
                    isSelected
                      ? `${opt.color} shadow-xs ring-2 ring-blue-400/40 scale-102`
                      : isLight
                      ? 'bg-white text-slate-700 hover:bg-slate-200 hover:text-slate-900 border border-slate-200 shadow-xs'
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
        <div
          id="brand-logo-button"
          className="flex items-center gap-3 cursor-pointer"
          onClick={() => onRoleChange('PUBLIC')}
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-blue-800 text-white flex items-center justify-center font-black text-lg shadow-md shadow-blue-500/25 ring-2 ring-blue-400/30">
            TH
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className={`text-xl font-black tracking-tight flex items-center gap-1.5 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                <span>{isAr ? 'ثويسا' : 'THOUESA'}</span>
                <span className="text-xs font-semibold px-2 py-0.5 bg-blue-500/15 text-blue-600 border border-blue-500/25 rounded-full">
                  Escrow P2P
                </span>
              </h1>
            </div>
            <p className={`text-[11px] hidden sm:block ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              {isAr ? 'الشحن التشاركي المعتمد والضمان المالي المشدد' : 'Cross-Border P2P Logistics & Escrow'}
            </p>
          </div>
        </div>

        {/* Right Tools: Theme Toggle, Theme Menu, Auth Buttons, Wallet & Locale */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Quick Direct Light/Dark Mode Toggle Button */}
          <button
            id="theme-toggle-quick-btn"
            onClick={toggleLightDarkMode}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-xs ${
              isLight
                ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
            }`}
            title={
              isAr
                ? isLight
                  ? 'التبديل إلى الوضع الداكن (Dark Mode)'
                  : 'التبديل إلى الوضع الفاتح (Light Mode)'
                : isLight
                ? 'Switch to Dark Mode'
                : 'Switch to Light Mode'
            }
          >
            {isLight ? (
              <>
                <Moon className="w-3.5 h-3.5 text-blue-600" />
                <span className="hidden sm:inline font-medium">{isAr ? 'داكن' : 'Dark'}</span>
              </>
            ) : (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline font-medium">{isAr ? 'فاتح' : 'Light'}</span>
              </>
            )}
          </button>

          {/* Theme Palette Dropdown Selector */}
          <div className="relative">
            <button
              id="theme-menu-btn"
              onClick={() => setShowThemeMenu(!showThemeMenu)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer shadow-xs ${
                isLight
                  ? 'bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700'
                  : 'bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200'
              }`}
              title={isAr ? 'اختيار سمات متقدمة' : 'Theme Palettes'}
            >
              <Palette className="w-3.5 h-3.5 text-blue-500" />
              <ChevronDown className={`w-3 h-3 ${isLight ? 'text-slate-500' : 'text-slate-400'}`} />
            </button>

            {showThemeMenu && (
              <div
                id="theme-dropdown-menu"
                className={`absolute end-0 mt-2 w-56 rounded-2xl shadow-xl p-2 z-50 space-y-1 border ${
                  isLight
                    ? 'bg-white border-slate-200 text-slate-800'
                    : 'bg-slate-900 border-slate-700 text-white'
                }`}
                dir={isAr ? 'rtl' : 'ltr'}
              >
                <div className={`px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  {isAr ? 'سمات الواجهة والألوان:' : 'Surface Color Themes:'}
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
                          ? 'bg-blue-600 text-white font-bold shadow-xs'
                          : isLight
                          ? 'text-slate-700 hover:bg-slate-100'
                          : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="w-3.5 h-3.5 rounded-full border border-black/10 dark:border-white/20 shrink-0 shadow-xs"
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
                id="header-signin-btn"
                onClick={() => onOpenAuth('SIGNIN')}
                className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl transition-colors cursor-pointer shadow-xs ${
                  isLight
                    ? 'bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-800'
                    : 'bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200'
                }`}
              >
                <LogIn className="w-3.5 h-3.5 text-blue-500" />
                <span>{isAr ? 'دخول' : 'Sign In'}</span>
              </button>

              <button
                id="header-signup-btn"
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
            <div
              id="header-wallet-pill"
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs shadow-xs ${
                isLight
                  ? 'bg-slate-50 border border-slate-200 text-slate-900'
                  : 'bg-slate-800/90 border border-slate-700/80 text-slate-100'
              }`}
            >
              <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-500 flex items-center justify-center">
                <Wallet className="w-4 h-4" />
              </div>
              <div className="text-right rtl:text-right ltr:text-left">
                <div className={`flex items-center gap-1 text-[10px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  <span>{isAr ? 'الرصيد المتاح' : 'Available'}</span>
                  {wallet.lockedEscrowDeposit > 0 && (
                    <span className="text-amber-500 font-semibold">
                      ({isAr ? 'محجوز' : 'Locked'}: {formatCurrency(wallet.lockedEscrowDeposit, 'USD')})
                    </span>
                  )}
                </div>
                <span className={`font-bold ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>
                  {formatCurrency(wallet.balance, wallet.currency)}
                </span>
              </div>
            </div>
          )}

          {/* User Profile Badge */}
          {currentUser && currentRole !== 'PUBLIC' && (
            <div
              id="header-user-badge"
              className={`hidden md:flex items-center gap-2 px-2.5 py-1.5 rounded-xl border shadow-xs ${
                isLight
                  ? 'bg-slate-50 border-slate-200'
                  : 'bg-slate-800/80 border-slate-700/60'
              }`}
            >
              <div className="w-7 h-7 rounded-full bg-blue-600/30 text-blue-600 font-bold text-xs flex items-center justify-center border border-blue-400/30 overflow-hidden">
                {currentUser.avatarUrl ? (
                  <img src={currentUser.avatarUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  currentUser.fullName.charAt(0)
                )}
              </div>
              <div className="text-right rtl:text-right ltr:text-left">
                <div className={`text-[11px] font-bold truncate max-w-[120px] ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                  {currentUser.fullName.split(' ')[0]}
                </div>
                <div className="text-[10px] text-emerald-500 flex items-center gap-0.5 font-medium">
                  <ShieldCheck className="w-2.5 h-2.5" />
                  <span>{currentUser.role}</span>
                </div>
              </div>
            </div>
          )}

          {/* Language Switcher */}
          <button
            id="header-locale-toggle-btn"
            onClick={() => onLocaleChange(locale === 'ar' ? 'en' : 'ar')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl transition-colors cursor-pointer shadow-xs ${
              isLight
                ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
            }`}
            title="Switch Language (العربية / English)"
          >
            <Globe className="w-3.5 h-3.5 text-blue-500" />
            <span>{locale === 'ar' ? 'English' : 'عربي'}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
