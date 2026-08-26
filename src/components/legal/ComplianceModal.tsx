import React, { useState } from 'react';
import { ShieldCheck, Scale, AlertTriangle, FileText, X, CheckCircle2, Lock, Plane, ExternalLink } from 'lucide-react';
import { Locale } from '../../types';

interface ComplianceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept?: () => void;
  initialTab?: 'TERMS' | 'CUSTOMS' | 'PROHIBITED';
  locale: Locale;
  showAcceptButton?: boolean;
}

export const ComplianceModal: React.FC<ComplianceModalProps> = ({
  isOpen,
  onClose,
  onAccept,
  initialTab = 'CUSTOMS',
  locale,
  showAcceptButton = false,
}) => {
  const isAr = locale === 'ar';
  const [activeTab, setActiveTab] = useState<'TERMS' | 'CUSTOMS' | 'PROHIBITED'>(initialTab);
  const [agreed, setAgreed] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden text-slate-100 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-500/20 text-brand-300 border border-brand-400/30 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-white">
                {isAr ? 'الامتثال القانوني والإقرار الجمركي المعتمد' : 'Legal Compliance & Customs Declaration'}
              </h3>
              <p className="text-xs text-slate-400">
                {isAr ? 'منصة ثويسا (THOUESA Core) • متوافقة مع اتفاقيات الطيران المدني IATA والجمارك' : 'THOUESA Legal & Cross-Border Customs Framework (JOR ⇄ ALG)'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 px-5 pt-4 border-b border-slate-800 text-xs">
          <button
            onClick={() => setActiveTab('CUSTOMS')}
            className={`pb-3 font-bold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'CUSTOMS' ? 'border-brand-400 text-brand-300' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            {isAr ? 'الإقرار الجمركي والشحن الجوي' : 'Customs Declaration'}
          </button>
          <button
            onClick={() => setActiveTab('PROHIBITED')}
            className={`pb-3 font-bold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'PROHIBITED' ? 'border-red-500 text-red-400' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            {isAr ? 'قائمة المواد المحظورة دولياً' : 'Prohibited Items (IATA)'}
          </button>
          <button
            onClick={() => setActiveTab('TERMS')}
            className={`pb-3 font-bold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'TERMS' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            {isAr ? 'شروط الخدمة والضمان المالي' : 'Terms & Escrow Rules'}
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs text-slate-300 leading-relaxed">
          {activeTab === 'CUSTOMS' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-brand-950/40 border border-brand-400/30 text-brand-200">
                <h4 className="font-bold text-sm text-brand-300 mb-1 flex items-center gap-2">
                  <Scale className="w-4 h-4" />
                  <span>{isAr ? 'إقرار العميل والمرسل القانوني:' : 'Sender Legal & Customs Warranty:'}</span>
                </h4>
                <p className="text-[11px] leading-normal">
                  {isAr
                    ? 'يقر الراسل ويضمن بأن جميع البيانات المسجلة عن الطرد (المحتوى، الفئة، القيمة المصرح بها) صحيحة تماماً ومطابقة للواقع، وتخضع للفحص المادي الإلزامي والتغليف بالأختام الرقمية في فروع منصة ثويسا.'
                    : 'The sender warrants that all package information (contents, categories, and declared values) is 100% accurate and strictly adheres to destination country customs laws.'}
                </p>
              </div>

              <div className="space-y-2">
                <h5 className="font-bold text-white text-xs">{isAr ? 'البنود والالتزامات الجمركية:' : 'Customs Obligations:'}</h5>
                <ul className="list-disc list-inside space-y-1.5 text-slate-300">
                  <li>{isAr ? 'يمنع منعاً باتاً شحن أو طلب شراء أي مواد تتطلب موافقات أمنية مسبقة دون إبراز التراخيص.' : 'Restricted items require pre-approved official licenses.'}</li>
                  <li>{isAr ? 'تخضع الشحنات الشخصية لإعفاءات الأمتعة المسموحة للمسافرين وفق لوائح جمارك الأردن والجزائر.' : 'Personal parcels utilize passenger baggage allowances within legal caps.'}</li>
                  <li>{isAr ? 'في حال اكتشاف اختلاف جوهري بالوزن أو القيمة، تحتفظ المنصة بالحق في تعديل التكلفة أو إيقاف الشحنة.' : 'Material weight/value discrepancies will trigger formal audit holds.'}</li>
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'PROHIBITED' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-red-950/40 border border-red-500/30 text-red-200">
                <h4 className="font-bold text-sm text-red-300 mb-1 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  <span>{isAr ? 'المواد المحظورة حظراً مطلقاً على متن الطائرات:' : 'Strictly Prohibited Goods (Zero Tolerance):'}</span>
                </h4>
                <p className="text-[11px]">
                  {isAr
                    ? 'يمنع تسليم أو تداول المواد التالية ويتم مصادرتها فوراً وإحالة المخالف للمساءلة القانونية لدى السلطات المختصة.'
                    : 'Any attempt to ship the following items will result in immediate rejection, custody forfeiture, and legal reporting.'}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700">
                  <span className="font-bold text-red-400 block mb-1">❌ {isAr ? 'المتفجرات والغازات والسوائل القابلة للاشتعال' : 'Explosives & Flammables'}</span>
                  <span className="text-slate-400 text-[11px]">{isAr ? 'العطور عالية التركيز بالكميات التجارية، الولاعات، الألعاب النارية.' : 'Commercial perfume batches, lighters, aerosols.'}</span>
                </div>
                <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700">
                  <span className="font-bold text-red-400 block mb-1">❌ {isAr ? 'المخدرات والمؤثرات العقلية والأدوية المجدولة' : 'Narcotics & Restricted Drugs'}</span>
                  <span className="text-slate-400 text-[11px]">{isAr ? 'أي أدوية دون وصفات طبية رسمية مصدقة ومطابقة للهوية.' : 'Medicines without certified prescriptions.'}</span>
                </div>
                <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700">
                  <span className="font-bold text-red-400 block mb-1">❌ {isAr ? 'بطاريات الليثيوم السائبة والباور بانك التالف' : 'Loose/Defective Lithium Cells'}</span>
                  <span className="text-slate-400 text-[11px]">{isAr ? 'البطاريات التي تتجاوز 100 واط/ساعة أو غير الحاصلة على فحص السلامة UN 38.3.' : 'Batteries exceeding 100Wh without UN 38.3 compliance.'}</span>
                </div>
                <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700">
                  <span className="font-bold text-red-400 block mb-1">❌ {isAr ? 'المعادن الثمينة والعملات بكميات تتجاوز النظام' : 'Uncertified Precious Bullion/Cash'}</span>
                  <span className="text-slate-400 text-[11px]">{isAr ? 'المبالغ النقدية التي تتطلب إفصاحاً بنكياً رسمياً.' : 'Cash/Bullion requiring special central bank clearance.'}</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'TERMS' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-200">
                <h4 className="font-bold text-sm text-emerald-300 mb-1 flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  <span>{isAr ? 'آلية الضمان المالي المزدوج (Escrow Ledger):' : 'Dual Escrow & Protection Mechanism:'}</span>
                </h4>
                <p className="text-[11px]">
                  {isAr
                    ? 'تحتفظ منصة ثويسا بجميع مبالغ الضمان المالي في حسابات وسيطة معتمدة، وتثبت أسعار الصرف فور إجراء المعاملة لمنع أي تذبذب مالي.'
                    : 'THOUESA maintains all deposits in audited escrow ledgers with frozen exchange rates to guarantee financial integrity.'}
                </p>
              </div>

              <div className="space-y-2">
                <h5 className="font-bold text-white text-xs">{isAr ? 'حقوق وحماية الأطراف:' : 'Rights & Safeguards:'}</h5>
                <ul className="list-disc list-inside space-y-1.5 text-slate-300">
                  <li>{isAr ? 'المرسل محمي بضمان التعويض الكامل في حال التلف أو الضياع المثبت.' : 'Senders are protected up to full declared value upon verified loss.'}</li>
                  <li>{isAr ? 'المسافر معفى تماماً من المسؤولية الجمركية بعد فحص وتشميع الطرد بالفرع وتطابق الأختام.' : 'Travelers are legally indemnified once hub tamper seals are verified intact.'}</li>
                  <li>{isAr ? 'يتم تحرير أرباح المسافر وفك التأمين فور مسح رمز التسليم بفرع الوجهة.' : 'Traveler escrow is released immediately upon destination handover scan.'}</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Footer with Mandatory Agreement Checkbox */}
        <div className="p-5 border-t border-slate-800 bg-slate-950/90 flex flex-col sm:flex-row items-center justify-between gap-4">
          <label className="flex items-start gap-2.5 text-xs text-slate-300 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded-md border-slate-700 bg-slate-800 text-brand-500 focus:ring-brand-400"
            />
            <span>
              {isAr
                ? 'أقر بصحة البيانات المعطاة وخلو الشحنة من أي مواد محظورة والتزم بشروط الجمارك والضمان.'
                : 'I certify that contents comply with aviation/customs safety laws and accept terms.'}
            </span>
          </label>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition-colors cursor-pointer w-full sm:w-auto"
            >
              {isAr ? 'إغلاق' : 'Close'}
            </button>
            {showAcceptButton && (
              <button
                disabled={!agreed}
                onClick={() => {
                  if (agreed && onAccept) {
                    onAccept();
                  }
                }}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer w-full sm:w-auto flex items-center justify-center gap-2 ${
                  agreed
                    ? 'bg-brand-500 hover:bg-brand-400 text-white shadow-lg shadow-brand-500/30'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isAr ? 'توقيع الإقرار والمتابعة' : 'Sign Waiver & Proceed'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
