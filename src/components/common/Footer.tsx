import React, { useState } from 'react';
import { Locale, ThemeMode, UserRole } from '../../types';
import { HUBS_DATA } from '../../lib/constants';
import { 
  Building2, 
  CheckCircle2, 
  ChevronDown, 
  ChevronUp, 
  Globe2, 
  Mail, 
  MapPin, 
  Phone, 
  Scale, 
  ShieldCheck, 
  Terminal 
} from 'lucide-react';

interface FooterProps {
  locale: Locale;
  themeMode?: ThemeMode;
  onOpenLegal?: () => void;
  onSelectRole?: (role: UserRole) => void;
}

export const Footer: React.FC<FooterProps> = ({ locale, themeMode = 'light', onOpenLegal, onSelectRole }) => {
  const isAr = locale === 'ar';
  const [showAllHubs, setShowAllHubs] = useState(false);

  return (
    <footer id="global-footer" className="bg-slate-950 text-slate-400 border-t border-slate-800/80 text-xs mt-auto">
      {/* Official Hubs & Addresses Bar */}
      <div className="border-b border-slate-800/60 bg-slate-900/50 py-5 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2 text-slate-200 font-bold text-xs">
              <MapPin className="w-4 h-4 text-emerald-400" />
              <span>{isAr ? 'عناوين مراكز الاستلام والتسليم المعتمدة (Our Official Hubs & Addresses)' : 'Official Intake & Dispatch Hub Addresses'}</span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px]">
                {isAr ? '5 فروع دولية نشطة' : '5 Active International Hubs'}
              </span>
            </div>

            <button
              onClick={() => setShowAllHubs(!showAllHubs)}
              className="text-[11px] text-brand-300 hover:text-brand-300 font-semibold flex items-center gap-1 cursor-pointer transition-colors"
            >
              <span>{showAllHubs ? (isAr ? 'إخفاء التفاصيل' : 'Hide Details') : (isAr ? 'عرض كافة تفاصيل الفروع' : 'View Full Address Details')}</span>
              {showAllHubs ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 lg:grid-cols-5 gap-3">
            {HUBS_DATA.map((hub) => (
              <div 
                key={hub.id} 
                className="bg-slate-900/90 border border-slate-800 rounded-lg p-3 hover:border-slate-700 transition-colors"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="font-bold text-white text-[11px] flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-brand-300 shrink-0" />
                    <span className="truncate">{isAr ? hub.cityAr : hub.cityEn}</span>
                  </div>
                  <span className="text-[9px] font-mono px-1.5 py-0.5 bg-slate-800 text-slate-300 rounded">
                    {hub.code}
                  </span>
                </div>

                <p className="text-[10px] text-slate-400 line-clamp-2 leading-relaxed mb-2">
                  {hub.address}
                </p>

                {showAllHubs && (
                  <div className="pt-2 mt-2 border-t border-slate-800/80 space-y-1 text-[10px] text-slate-400">
                    <div className="flex items-center gap-1 text-slate-300">
                      <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                      <span dir="ltr">{hub.phone}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-slate-400 font-medium">{isAr ? 'المدير المسؤول:' : 'Manager:'}</span>
                      <span className="text-slate-200">{hub.managerName}</span>
                    </div>
                    <div className="text-[9px] text-emerald-400/90">
                      ● {hub.operatingHours || '08:00 - 22:00'}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Footer Links & Compliance */}
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Col 1: Platform Brand */}
          <div className="space-y-3 md:col-span-2">
            <div className="flex items-center gap-2 text-white font-black text-base">
              <span>{isAr ? 'منصة ثويسا اللوجستية (THOUESA)' : 'THOUESA Logistics Network'}</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50" />
            </div>
            <p className="text-xs text-slate-400 leading-relaxed max-w-lg">
              {isAr
                ? 'أول بنية تحتية لوجستية هجينة تربط الشحن الجوي التشاركي بنظام مراكز الفحص والتغليف الأمني ومحافظ الضمان المالي المشفرة (Escrow) بين الأردن، الجزائر، مصر، السعودية، وسلطنة عمان.'
                : 'P2P Cross-Border Logistics Infrastructure combining verified air travel excess baggage, physical tamper-sealed hub inspections, and automated escrow settlement across Jordan, Algeria, Egypt, Saudi Arabia, and Oman.'}
            </p>
            <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-slate-400">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-slate-300">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                {isAr ? 'معايير أمان IATA للطيران' : 'IATA Aviation Standards'}
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-slate-300">
                <Terminal className="w-3.5 h-3.5 text-brand-300" />
                {isAr ? 'متوافق مع خوادم cPanel & LiteSpeed' : 'cPanel & LiteSpeed Ready'}
              </span>
            </div>
          </div>

          {/* Col 2: Fast Navigation & Portals */}
          <div className="space-y-2">
            <h4 className="font-bold text-white text-xs uppercase tracking-wider">
              {isAr ? 'البوابات والخدمات' : 'Portals & Services'}
            </h4>
            <ul className="space-y-1.5 text-xs">
              <li>
                <button
                  onClick={() => onSelectRole && onSelectRole('SENDER')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  {isAr ? 'بوابة إرسال الطرود والشراء الدولي' : 'Sender & International Orders'}
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectRole && onSelectRole('TRAVELER')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  {isAr ? 'بوابة المسافرين والرحلات الجوية' : 'Travelers & Flights Portal'}
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectRole && onSelectRole('HUB_AGENT')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  {isAr ? 'مراكز الفحص وموظفي الفروع (Hub Ops)' : 'Hub Inspection Operations'}
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectRole && onSelectRole('MASTER_ADMIN')}
                  className="hover:text-white transition-colors cursor-pointer text-slate-400 hover:text-slate-200"
                >
                  {isAr ? 'لوحة القيادة والرقابة المالية (Admin)' : 'Governance & Escrow Control'}
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Legal & Regulatory */}
          <div className="space-y-2">
            <h4 className="font-bold text-white text-xs uppercase tracking-wider">
              {isAr ? 'اللوائح والامتثال' : 'Legal & Compliance'}
            </h4>
            <ul className="space-y-1.5 text-xs">
              <li>
                <button
                  onClick={onOpenLegal}
                  className="text-brand-300 hover:text-brand-300 font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <Scale className="w-3.5 h-3.5" />
                  <span>{isAr ? 'الشروط واللوائح الجمركية' : 'Customs Regulations & Terms'}</span>
                </button>
              </li>
              <li>
                <span className="text-slate-400">{isAr ? 'سياسة حماية الودائع والضمان المالي' : 'Escrow Protection Policy'}</span>
              </li>
              <li>
                <span className="text-slate-400">{isAr ? 'المواد المحظورة دولياً ومحلياً' : 'Prohibited Items (Dangerous Goods)'}</span>
              </li>
              <li>
                <span className="text-slate-400">{isAr ? 'معايير التحقق من الهوية (KYC/AML)' : 'KYC & Identity Standards'}</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-400">
          <div>
            © {new Date().getFullYear()} THOUESA Logistics Platform. {isAr ? 'جميع الحقوق محفوظة' : 'All Rights Reserved.'}
          </div>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>{isAr ? 'نظام ضمان مالي مزدوج مشفر' : '256-Bit Escrow Vault Protected'}</span>
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Globe2 className="w-3.5 h-3.5 text-sky-400" />
              <span>{isAr ? 'الشرق الأوسط وشمال أفريقيا' : 'MENA Region Cross-Border'}</span>
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
