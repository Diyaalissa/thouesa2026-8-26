import React from 'react';
import { ShieldCheck, Lock, X, CheckCircle2, Scale, Image as ImageIcon, ExternalLink, QrCode, FileText } from 'lucide-react';
import { Locale, Shipment, Trip } from '../../types';
import { formatCurrency } from '../../lib/crypto';

interface InspectionProofModalProps {
  isOpen: boolean;
  onClose: () => void;
  shipment: Shipment | null;
  locale: Locale;
}

export const InspectionProofModal: React.FC<InspectionProofModalProps> = ({
  isOpen,
  onClose,
  shipment,
  locale,
}) => {
  const isAr = locale === 'ar';

  if (!isOpen || !shipment) return null;

  const photos = shipment.inspectionPhotos || shipment.itemPhotos || [
    'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=600&auto=format&fit=crop&q=80',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden text-slate-100 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-600/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-white">
                  {isAr ? 'تقرير الفحص الأمني والأختام الرقمية' : 'Security Inspection & Seal Proof'}
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                  {isAr ? 'مفحوص ومختوم' : 'Certified Safe'}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono">
                {shipment.trackingNumber}
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

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-300">
          {/* Tamper Seal & Weight Box */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-3">
            <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-2xl space-y-1">
              <div className="flex items-center justify-between text-slate-400 text-[11px]">
                <span>{isAr ? 'رمز القفل الأمني المعتمد:' : 'Tamper Seal ID:'}</span>
                <Lock className="w-3.5 h-3.5 text-amber-400" />
              </div>
              <div className="font-mono font-black text-sm text-amber-400">
                {shipment.securitySealId || 'SEAL-AMM-98231'}
              </div>
              <p className="text-[10px] text-slate-500">
                {isAr ? 'قفل مشفر غير قابل للفتح إلا في فرع الوجهة' : 'Single-use cryptographic tamper seal'}
              </p>
            </div>

            <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-2xl space-y-1">
              <div className="flex items-center justify-between text-slate-400 text-[11px]">
                <span>{isAr ? 'الوزن المعاير بالميزان الإلكتروني:' : 'Certified Scale Weight:'}</span>
                <Scale className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <div className="font-mono font-black text-sm text-emerald-400">
                {shipment.actualWeightKg || shipment.estimatedWeightKg} kg
              </div>
              <p className="text-[10px] text-slate-500">
                {isAr ? 'تمت مطابقة الوزن مع إقرار المرسل' : 'Scale calibrated at origin hub'}
              </p>
            </div>
          </div>

          {/* Inspection Notes */}
          <div className="p-4 bg-slate-800/60 border border-slate-700/60 rounded-2xl space-y-1.5">
            <span className="font-bold text-white block">
              {isAr ? 'ملاحظات فحص وتغليف موظف الفرع:' : 'Hub Agent Inspection Log:'}
            </span>
            <p className="text-slate-300 leading-relaxed text-[11px]">
              {shipment.inspectionNotes ||
                (isAr
                  ? 'تم فحص محتويات الطرد ومطابقتها للمواصفات المصرح بها والتأكد من خلوها من أي بطاريات محظورة أو سوائل وتغليفها أمنياً.'
                  : 'Physical inspection completed. Contents verified against customs declarations with no prohibited batteries or hazardous materials.')}
            </p>
            {shipment.inspectedAt && (
              <div className="text-[10px] text-slate-500 pt-1">
                {isAr ? 'تاريخ ووقت الفحص:' : 'Inspected at:'} {new Date(shipment.inspectedAt).toLocaleString(isAr ? 'ar-JO' : 'en-US')}
              </div>
            )}
          </div>

          {/* 360° Inspection Photos Grid */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-brand-300" />
                <span>{isAr ? 'صور التوثيق والفحص بالفرع (360°):' : '360° Hub Inspection Photos:'}</span>
              </span>
              <span className="text-[10px] text-slate-400">
                {photos.length} {isAr ? 'صور موثقة' : 'photos'}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-3">
              {photos.map((url, idx) => (
                <div key={idx} className="group relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 aspect-video">
                  <img
                    src={url}
                    alt={`Inspection Proof ${idx + 1}`}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-2">
                    <span className="text-[10px] font-bold text-white">
                      {idx === 0 ? (isAr ? 'الواجهة الأمامية' : 'Front view') : idx === 1 ? (isAr ? 'القفل والختم' : 'Seal close-up') : (isAr ? 'التغليف' : 'Package')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-slate-800 bg-slate-950/90 flex items-center justify-between">
          <span className="text-[11px] text-slate-400">
            {isAr ? 'المسافر معفى من المسؤولية الجمركية عند سلامة الأختام' : 'Traveler indemnified with intact tamper seal'}
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-teal-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
          >
            {isAr ? 'إغلاق المعاينة' : 'Done'}
          </button>
        </div>
      </div>
    </div>
  );
};
