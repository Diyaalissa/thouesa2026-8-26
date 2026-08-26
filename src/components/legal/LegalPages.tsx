import React, { useState } from 'react';
import { ShieldCheck, FileText, Lock, AlertTriangle, ArrowRight, ArrowLeft, Scale, Globe, CheckCircle2, ChevronRight } from 'lucide-react';
import { Locale } from '../../types';

interface LegalPagesProps {
  initialPage?: 'TERMS' | 'CUSTOMS' | 'PROHIBITED' | 'PRIVACY';
  locale: Locale;
  onBack?: () => void;
}

export const LegalPages: React.FC<LegalPagesProps> = ({
  initialPage = 'TERMS',
  locale,
  onBack,
}) => {
  const isAr = locale === 'ar';
  const [currentPage, setCurrentPage] = useState<'TERMS' | 'CUSTOMS' | 'PROHIBITED' | 'PRIVACY'>(initialPage);

  return (
    <div className="min-h-[85vh] bg-slate-950 text-slate-100 p-4 sm:p-8 rounded-3xl border border-slate-800" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="max-w-5xl mx-auto pb-6 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-brand-300 font-bold uppercase tracking-wider mb-1">
            <Scale className="w-4 h-4" />
            <span>{isAr ? 'البوابة القانونية والتنظيمية لمنصة THOUESA' : 'THOUESA Legal & Regulatory Portal'}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">
            {isAr ? 'الأحكام، الرقابة الجمركية وإقرارات الامتثال' : 'Terms of Service, Customs & Legal Compliance'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            {isAr
              ? 'وثيقة قانونية ملزمة متوافقة مع اتفاقية مونتريال للطيران المدني، اللوائح الجمركية الأردنية والجزائرية، ومعايير أمن الشحن الجوي IATA.'
              : 'Binding legal agreement adhering to Montreal Convention, Algerian & Jordanian Customs, and IATA Cargo Safety.'}
          </p>
        </div>

        {onBack && (
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 transition-colors cursor-pointer"
          >
            {isAr ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
            <span>{isAr ? 'العودة للمنصة' : 'Back to Dashboard'}</span>
          </button>
        )}
      </div>

      {/* Main Content Layout */}
      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-6 pt-6">
        {/* Navigation Sidebar */}
        <div className="space-y-2">
          <button
            onClick={() => setCurrentPage('TERMS')}
            className={`w-full flex items-center justify-between p-3.5 rounded-2xl text-xs font-bold text-start transition-all cursor-pointer ${
              currentPage === 'TERMS'
                ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/30 ring-1 ring-brand-300'
                : 'bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              <span>{isAr ? 'شروط الخدمة والضمان المالي' : 'Terms & Escrow Rules'}</span>
            </div>
            <ChevronRight className={`w-3.5 h-3.5 ${isAr ? 'rotate-180' : ''}`} />
          </button>

          <button
            onClick={() => setCurrentPage('CUSTOMS')}
            className={`w-full flex items-center justify-between p-3.5 rounded-2xl text-xs font-bold text-start transition-all cursor-pointer ${
              currentPage === 'CUSTOMS'
                ? 'bg-teal-600 text-white shadow-lg shadow-teal-600/30 ring-1 ring-emerald-400'
                : 'bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" />
              <span>{isAr ? 'اللوائح الجمركية (الأردن والجزائر)' : 'Customs Declaration'}</span>
            </div>
            <ChevronRight className={`w-3.5 h-3.5 ${isAr ? 'rotate-180' : ''}`} />
          </button>

          <button
            onClick={() => setCurrentPage('PROHIBITED')}
            className={`w-full flex items-center justify-between p-3.5 rounded-2xl text-xs font-bold text-start transition-all cursor-pointer ${
              currentPage === 'PROHIBITED'
                ? 'bg-red-600 text-white shadow-lg shadow-red-600/30 ring-1 ring-red-400'
                : 'bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              <span>{isAr ? 'قائمة المواد المحظورة دولياً' : 'Prohibited Items'}</span>
            </div>
            <ChevronRight className={`w-3.5 h-3.5 ${isAr ? 'rotate-180' : ''}`} />
          </button>

          <button
            onClick={() => setCurrentPage('PRIVACY')}
            className={`w-full flex items-center justify-between p-3.5 rounded-2xl text-xs font-bold text-start transition-all cursor-pointer ${
              currentPage === 'PRIVACY'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30 ring-1 ring-purple-400'
                : 'bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4" />
              <span>{isAr ? 'سياسة الخصوصية وحماية البيانات' : 'Privacy & Security'}</span>
            </div>
            <ChevronRight className={`w-3.5 h-3.5 ${isAr ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* Page Content Detail */}
        <div className="md:col-span-3 bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 text-xs leading-relaxed space-y-6">
          {currentPage === 'TERMS' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-800 text-brand-300 font-bold text-sm">
                <FileText className="w-5 h-5" />
                <span>{isAr ? '1. شروط الخدمة والوساطة اللوجستية وعقد الضمان المالي المشفر' : '1. Terms of Service, Logistics Escrow & Smart Contract Rules'}</span>
              </div>

              <div className="space-y-3 text-slate-300">
                <p>
                  {isAr
                    ? 'تعمل منصة THOUESA كوسيط تقني ولوجستي مرخص لتنظيم نقل الطرود والمشتريات بين الأفراد والمسافرين المعتمدين، بالاعتماد على شبكة فروع فيزيائية ومحفظة ضمان مالي آمنة (Escrow Engine).'
                    : 'THOUESA acts as a verified logistics intermediary facilitating traveler-carried parcel transport backed by physical inspection hubs and automated multi-currency escrow.'}
                </p>

                <h4 className="font-bold text-white text-xs pt-2">
                  {isAr ? 'أ. التزامات المرسل (Sender Obligations):' : 'A. Sender Obligations:'}
                </h4>
                <ul className="list-disc ps-5 space-y-1 text-slate-400">
                  <li>{isAr ? 'الإفصاح الدقيق والكامل عن محتويات الطرد وفواتير الشراء المصاحبة.' : 'Accurate and comprehensive declaration of all items and purchase values.'}</li>
                  <li>{isAr ? 'الموافقة على فتح الطرد وفحصه وتوثيق صوره بمحطة الفرع المعتمدة.' : 'Full consent for physical hub inspection and 360° photographic recording.'}</li>
                  <li>{isAr ? 'تحمل أي فروقات وزن تنتج عن فحص الميزان الإلكتروني المعاير بالفرع.' : 'Liability for any weight delta calculated by the certified hub scale.'}</li>
                </ul>

                <h4 className="font-bold text-white text-xs pt-2">
                  {isAr ? 'ب. التزامات المسافر المعتمد (Traveler Obligations):' : 'B. Traveler Obligations:'}
                </h4>
                <ul className="list-disc ps-5 space-y-1 text-slate-400">
                  <li>{isAr ? 'حجز مبلغ الضمان المالي في محفظة Escrow قبل استلام الطرد من الفرع.' : 'Pre-authorization of refundable escrow deposit prior to branch handover.'}</li>
                  <li>{isAr ? 'الامتناع التام عن فتح أو العبث بالختم الأمني المشفر (Tamper-Evident Security Seal).' : 'Strict prohibition against opening or altering the tamper-evident security seal.'}</li>
                  <li>{isAr ? 'تسليم الطرد بفرع الوصول فور الوصول واستكمال عملية المسح التبادلي لرمز QR.' : 'Immediate drop-off at destination hub and completing bilateral QR scan.'}</li>
                </ul>

                <h4 className="font-bold text-white text-xs pt-2">
                  {isAr ? 'ج. آلية تحرير الضمان المالي وفض النزاعات:' : 'C. Escrow Release & Dispute Settlement:'}
                </h4>
                <p className="text-slate-400">
                  {isAr
                    ? 'يتم تحرير أرباح المسافر ورد مبلغ التأمين فور قيام موظف فرع الوصول بفحص سلامة الختم وتطابق رمز التسليم المشفر HMAC.'
                    : 'Traveler earnings and escrow hold are unlocked instantly upon destination hub seal verification and cryptographic HMAC token validation.'}
                </p>
              </div>
            </div>
          )}

          {currentPage === 'CUSTOMS' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-800 text-emerald-400 font-bold text-sm">
                <ShieldCheck className="w-5 h-5" />
                <span>{isAr ? '2. إقرار اللوائح الجمركية (الجمارك الجزائرية والأردنية)' : '2. Customs & Cross-Border Regulatory Declarations'}</span>
              </div>

              <div className="space-y-3 text-slate-300">
                <p>
                  {isAr
                    ? 'تخضع جميع البضائع المنقولة عبر المنصة للوائح الجمارك الأردنية (قانون الجمارك رقم 20 لسنة 1998) والجمارك الجزائرية (قانون الجمارك 79-07 المعدل والمتمم).'
                    : 'All goods transiting through THOUESA are subject to Jordanian and Algerian customs frameworks and civil aviation cross-border declarations.'}
                </p>

                <div className="p-4 bg-emerald-950/30 border border-emerald-500/30 rounded-2xl space-y-2">
                  <span className="font-bold text-emerald-300 block">{isAr ? 'الإقرار القانوني المعتمد من العميل:' : 'Certified Legal Declaration:'}</span>
                  <p className="text-slate-300">
                    {isAr
                      ? '«أقر أنا العميل بأن جميع المواد المشحونة هي للاستخدام الشخصي أو أمانات مصرح بها، وخالية من أي غرض تجاري غير مشروع أو مواد تخضع للرسوم الجمركية غير المسددة، وأتحمل كامل المسؤولية الجزائية والمدنية أمام السلطات الجمركية في حال الإخلال بهذا الإقرار».'
                      : '"I hereby certify under penalty of law that all shipped items are for declared lawful personal use and comply with all applicable customs declarations and tariffs."'}
                  </p>
                </div>

                <h4 className="font-bold text-white text-xs pt-2">
                  {isAr ? 'إجراءات الفحص والتوثيق المعتمدة:' : 'Certified Screening Protocol:'}
                </h4>
                <ul className="list-disc ps-5 space-y-1 text-slate-400">
                  <li>{isAr ? 'فحص بصري دقيق مع تصوير 360 درجة لجميع زوايا الطرد.' : 'Multi-angle 360° photographic inspection.'}</li>
                  <li>{isAr ? 'تسجيل الرقم التسلسلي للختم الأمني البلاستيكي/المعدني المشفر.' : 'Logging of unique tamper-evident seal serial number.'}</li>
                  <li>{isAr ? 'إصدار بوليصة شحن جوي رقمية (Digital Bill of Lading) مرفقة ببيان المحتويات.' : 'Issuance of Digital Bill of Lading with full itemized breakdown.'}</li>
                </ul>
              </div>
            </div>
          )}

          {currentPage === 'PROHIBITED' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-800 text-red-400 font-bold text-sm">
                <AlertTriangle className="w-5 h-5" />
                <span>{isAr ? '3. اللائحة الصارمة للمواد المحظور شحنها دولياً (IATA & DGR)' : '3. Strict Prohibited & Dangerous Goods Cargo List'}</span>
              </div>

              <p className="text-slate-300">
                {isAr
                  ? 'يُحظر شحناً قاطعاً إدراج أي من المواد التالية ضمن الطرود أو المشتريات. محاولة تمرير هذه المواد تؤدي فوراً إلى مصادرة الطرد، حظر الحساب، والإبلاغ الفوري للسلطات الأمنية والجمركية المختصة:'
                  : 'The following items are strictly prohibited under international civil aviation safety rules (ICAO/IATA Dangerous Goods Regulations):'}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-3 pt-2">
                <div className="p-3 bg-red-950/20 border border-red-500/30 rounded-xl space-y-1">
                  <span className="font-bold text-red-300 block">{isAr ? '🚫 الأسلحة والمتفجرات والذخائر' : 'Weapons & Ammunition'}</span>
                  <span className="text-slate-400 text-[11px] block">{isAr ? 'الأسلحة النارية، الأسلحة البيضاء، الصواعق، الألعاب النارية، ومحاكيات السلاح.' : 'Firearms, ammunition, tactical gear, and explosives.'}</span>
                </div>

                <div className="p-3 bg-red-950/20 border border-red-500/30 rounded-xl space-y-1">
                  <span className="font-bold text-red-300 block">{isAr ? '🚫 المواد المخدرة والمؤثرات العقلية' : 'Narcotics & Controlled Drugs'}</span>
                  <span className="text-slate-400 text-[11px] block">{isAr ? 'كافة أنواع المخدرات، الأدوية المهدئة بدون وصفة طبية دولية معتمدة.' : 'Controlled substances, unprescribed pharmaceuticals.'}</span>
                </div>

                <div className="p-3 bg-red-950/20 border border-red-500/30 rounded-xl space-y-1">
                  <span className="font-bold text-red-300 block">{isAr ? '🚫 بطاريات الليثيوم السائبة والمواد القابلة للاشتعال' : 'Loose Lithium Batteries & Flammables'}</span>
                  <span className="text-slate-400 text-[11px] block">{isAr ? 'بنوك الطاقة السائبة غير المركبة، الغازات المضغوطة، السوائل السريعة الاشتعال.' : 'Power banks, aerosols, flammable liquids.'}</span>
                </div>

                <div className="p-3 bg-red-950/20 border border-red-500/30 rounded-xl space-y-1">
                  <span className="font-bold text-red-300 block">{isAr ? '🚫 العملات النقدية والمعادن الثمينة غير المصرح بها' : 'Undeclared Bullion & Currency'}</span>
                  <span className="text-slate-400 text-[11px] block">{isAr ? 'السبائك الذهبية غير المفصح عنها، المبالغ النقدية التي تتجاوز الحدود الجمركية.' : 'Excessive currency or uncertified precious metals.'}</span>
                </div>
              </div>
            </div>
          )}

          {currentPage === 'PRIVACY' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-800 text-purple-400 font-bold text-sm">
                <Lock className="w-5 h-5" />
                <span>{isAr ? '4. سياسة حماية البيانات والخصوصية والتشفير' : '4. Data Protection & Cryptographic Privacy'}</span>
              </div>

              <div className="space-y-3 text-slate-300">
                <p>
                  {isAr
                    ? 'تلتزم منصة THOUESA بحماية بيانات المستخدمين ووثائق الهوية (KYC) عبر تشفير AES-256 وتخزين محمي، ولا يتم الإفصاح عن البيانات إلا للجهات الجمركية والأمنية المختصة عند طلب رسمي بموجب القانون.'
                    : 'THOUESA strictly safeguards user identity documents and transaction logs with enterprise-grade AES-256 encryption and cryptographic integrity verification.'}
                </p>

                <h4 className="font-bold text-white text-xs pt-2">
                  {isAr ? 'بروتوكولات الأمان المعتمدة:' : 'Security Standards:'}
                </h4>
                <ul className="list-disc ps-5 space-y-1 text-slate-400">
                  <li>{isAr ? 'توليد رموز تسليم مشفرة بخوارزمية HMAC-SHA256 صالحة لمرة واحدة.' : 'HMAC-SHA256 one-time cryptographic handover tokens.'}</li>
                  <li>{isAr ? 'سجل تدقيق كامل (Audit Trail) لجميع تحويلات الضمان المالي وتغييرات الحالة.' : 'Immutable audit trail for all escrow operations and state transitions.'}</li>
                  <li>{isAr ? 'عدم تخزين أرقام البطاقات البنكية محلياً والاعتماد على بوابات دفع بنكية معتمدة.' : 'Zero local storage of card PANs with tokenized bank gateway integration.'}</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
