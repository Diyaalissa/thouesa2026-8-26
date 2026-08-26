import React, { useState } from 'react';
import { ShieldCheck, Scale, Lock, Camera, X, CheckCircle2, AlertTriangle, Barcode, Printer, Image as ImageIcon, Sparkles } from 'lucide-react';
import { Locale, Shipment } from '../../types';

interface InspectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  shipment: Shipment | null;
  hubCode: string;
  locale: Locale;
  onConfirmInspect: (payload: {
    shipmentId: string;
    actualWeightKg: number;
    securitySealId: string;
    inspectionNotes: string;
    inspectionPhotos: string[];
  }) => Promise<boolean>;
}

export const InspectionModal: React.FC<InspectionModalProps> = ({
  isOpen,
  onClose,
  shipment,
  hubCode,
  locale,
  onConfirmInspect,
}) => {
  const isAr = locale === 'ar';

  if (!isOpen || !shipment) return null;

  const [actualWeightKg, setActualWeightKg] = useState<number>(shipment.actualWeightKg || shipment.estimatedWeightKg);
  const [securitySealId, setSecuritySealId] = useState<string>(
    shipment.securitySealId || `SEAL-${hubCode}-${Math.floor(10000 + Math.random() * 90000)}`
  );
  const [inspectionNotes, setInspectionNotes] = useState(
    shipment.inspectionNotes ||
      (isAr
        ? 'تم فحص محتويات الطرد ومطابقتها للمواصفات المصرح بها وخلوها من السوائل أو البطاريات المنتفخة وتثبيت قفل الأمان الإلكتروني.'
        : 'Physical inspection completed. Contents verified against aviation safety rules with no hazardous materials. Sealed securely.')
  );
  const [photos, setPhotos] = useState<string[]>([
    'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&auto=format&fit=crop&q=80',
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showBillOfLading, setShowBillOfLading] = useState(false);

  const weightDifference = Number((actualWeightKg - shipment.estimatedWeightKg).toFixed(2));
  const isOverweight = weightDifference > 0.2;
  const estimatedDeltaPrice = isOverweight ? Number((weightDifference * 18.0).toFixed(2)) : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const success = await onConfirmInspect({
      shipmentId: shipment.id,
      actualWeightKg,
      securitySealId,
      inspectionNotes,
      inspectionPhotos: photos,
    });
    setIsSubmitting(false);
    if (success) {
      setShowBillOfLading(true);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden text-slate-100 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-500/20 text-brand-300 border border-brand-400/30 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-white">
                {showBillOfLading
                  ? isAr ? 'بوليصة الشحن الجوي المعتمدة (Air Waybill)' : 'Certified Air Waybill & Seal Card'
                  : isAr ? 'نموذج الفحص المادي وتثبيت الختم الأمني' : 'Hub Physical Inspection & Security Sealing'}
              </h3>
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

        {/* Modal Content */}
        {!showBillOfLading ? (
          <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 text-xs text-slate-300">
            {/* Scale Weight Box */}
            <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <label className="font-bold text-white flex items-center gap-1.5">
                  <Scale className="w-4 h-4 text-emerald-400" />
                  <span>{isAr ? 'قراءة الميزان الإلكتروني المعاير (كغم):' : 'Certified Scale Weight (kg):'}</span>
                </label>
                <span className="text-[11px] text-slate-400">
                  {isAr ? 'الوزن المقدر سابقاً:' : 'Estimated weight:'} {shipment.estimatedWeightKg} kg
                </span>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="number"
                  step="0.05"
                  min="0.1"
                  required
                  value={actualWeightKg}
                  onChange={(e) => setActualWeightKg(Number(e.target.value))}
                  className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-lg font-black text-emerald-400 focus:outline-hidden focus:border-emerald-500 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setActualWeightKg(Number((shipment.estimatedWeightKg + 0.1).toFixed(2)))}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-bold rounded-xl border border-slate-700 shrink-0"
                >
                  {isAr ? 'معايرة الصفر' : 'Zero Tare'}
                </button>
              </div>

              {/* Overweight Discrepancy Alert */}
              {isOverweight && (
                <div className="p-3 bg-amber-500/15 border border-amber-500/30 rounded-xl text-[11px] text-amber-300 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block">
                      {isAr ? `تنبيه: فرق وزن زائد (+${weightDifference} كغم)` : `Overweight Discrepancy (+${weightDifference} kg)`}
                    </span>
                    <span className="text-slate-300">
                      {isAr
                        ? `سيتم تحويل حالة الطرد إلى بانتظار موافقة العميل على فارق السعر (+$${estimatedDeltaPrice}).`
                        : `Status will transition to WEIGHT_ADJUSTMENT_PENDING for customer approval (+$${estimatedDeltaPrice}).`}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Tamper Seal Code Box */}
            <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <label className="font-bold text-white flex items-center gap-1.5">
                  <Lock className="w-4 h-4 text-amber-400" />
                  <span>{isAr ? 'رقم القفل الأمني المشفر (Tamper Seal ID):' : 'Tamper-Evident Seal Barcode ID:'}</span>
                </label>
                <button
                  type="button"
                  onClick={() => setSecuritySealId(`SEAL-${hubCode}-${Math.floor(10000 + Math.random() * 90000)}`)}
                  className="text-[10px] text-brand-300 hover:underline flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>{isAr ? 'توليد ختم عشوائي' : 'Regenerate'}</span>
                </button>
              </div>

              <input
                type="text"
                required
                value={securitySealId}
                onChange={(e) => setSecuritySealId(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs font-mono font-bold text-amber-400 focus:outline-hidden focus:border-amber-500"
              />
            </div>

            {/* 360° Inspection Photos */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="font-bold text-white flex items-center gap-1.5">
                  <Camera className="w-4 h-4 text-brand-300" />
                  <span>{isAr ? 'صور التوثيق والفحص (360° Hub Photos):' : '360° Inspection Photos:'}</span>
                </label>
                <button
                  type="button"
                  onClick={() => setPhotos([...photos, 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=600&auto=format&fit=crop&q=80'])}
                  className="text-[10px] text-brand-300 hover:underline"
                >
                  + {isAr ? 'التقاط صورة جديدة' : 'Add Photo'}
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {photos.map((url, idx) => (
                  <div key={idx} className="relative aspect-video rounded-xl overflow-hidden border border-slate-700 bg-slate-950">
                    <img src={url} alt={`Inspection Photo ${idx + 1}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded-md bg-black/70 text-[9px] text-white font-mono">
                      #{idx + 1}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block font-bold text-white mb-1">{isAr ? 'تقرير وملاحظات الفحص:' : 'Inspection Notes:'}</label>
              <textarea
                rows={2}
                value={inspectionNotes}
                onChange={(e) => setInspectionNotes(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-hidden focus:border-brand-400"
              />
            </div>

            {/* Submit Button */}
            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs"
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 bg-brand-500 hover:bg-brand-400 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-brand-500/30 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isSubmitting ? (isAr ? 'جاري الحفظ...' : 'Saving...') : (isAr ? 'اعتماد الفحص وإصدار البوليصة' : 'Approve & Issue Bill of Lading')}</span>
              </button>
            </div>
          </form>
        ) : (
          /* Bill of Lading Printable Preview */
          <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-300">
            <div className="p-6 bg-white text-slate-900 rounded-2xl shadow-md border border-slate-200 space-y-4 font-sans">
              <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                <div>
                  <h2 className="text-xl font-black tracking-tight text-slate-900">THOUESA AIR LOGISTICS</h2>
                  <p className="text-[10px] text-slate-500">Official Hub Intake & Certified Security Manifest</p>
                </div>
                <div className="text-end">
                  <span className="font-mono font-bold text-xs bg-slate-100 px-2 py-1 rounded-md border border-slate-300">
                    {shipment.trackingNumber}
                  </span>
                  <p className="text-[10px] text-teal-600 font-bold mt-1">✓ INSPECTED & SEALED</p>
                </div>
              </div>

              {/* Barcode Visual */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center space-y-1">
                <div className="font-mono tracking-[0.35em] text-2xl font-black text-slate-900 select-all">
                  ||||| | |||| ||| ||||| || |||
                </div>
                <span className="font-mono text-[11px] text-slate-600">*{shipment.trackingNumber}*</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px]">ORIGIN / DESTINATION:</span>
                  <span className="font-bold text-slate-900">HUB-{hubCode} ➔ DESTINATION</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">TAMPER SEAL ID:</span>
                  <span className="font-mono font-bold text-amber-600">{securitySealId}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">VERIFIED SCALE WEIGHT:</span>
                  <span className="font-mono font-bold text-teal-600">{actualWeightKg} kg</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">RECIPIENT:</span>
                  <span className="font-bold text-slate-900">{shipment.recipientName}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200 text-[10px] text-slate-500 leading-tight">
                This document certifies that the above shipment has passed 100% physical inspection and is secured with tamper-evident seal {securitySealId}.
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                onClick={handlePrint}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>{isAr ? 'طباعة البوليصة' : 'Print Air Waybill'}</span>
              </button>
              <button
                onClick={onClose}
                className="px-6 py-2.5 bg-brand-500 hover:bg-brand-400 text-white font-bold rounded-xl text-xs cursor-pointer"
              >
                {isAr ? 'إتمام الفحص والعودة' : 'Done & Return'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
