import React from 'react';
import { X, Printer, Download, ShieldCheck, Box, User, MapPin, Calendar } from 'lucide-react';
import { Shipment, Locale } from '../../types';
import { formatCurrency } from '../../lib/crypto';
import { HUBS_DATA } from '../../lib/constants';

interface WaybillModalProps {
  isOpen: boolean;
  onClose: () => void;
  shipment: Shipment | null;
  locale?: Locale;
}

export const WaybillModal: React.FC<WaybillModalProps> = ({
  isOpen,
  onClose,
  shipment,
  locale = 'ar',
}) => {
  if (!isOpen || !shipment) return null;
  const isAr = locale === 'ar';

  const originHub = HUBS_DATA.find((h) => h.id === shipment.originHubId);
  const destHub = HUBS_DATA.find((h) => h.id === shipment.destinationHubId);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto relative"
        dir={isAr ? 'rtl' : 'ltr'}
      >
        <button
          onClick={onClose}
          className="absolute top-4 left-4 p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Printable Waybill Paper */}
        <div className="p-6 bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-300 pb-4 mb-4">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-brand-500 text-white flex items-center justify-center font-black text-sm">
                  TH
                </div>
                <h2 className="text-xl font-extrabold text-slate-900">THOUESA LOGISTICS</h2>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {isAr
                  ? 'بوليصة الشحن الجوي التشاركي والضمان المالي (Air Waybill)'
                  : 'P2P Cross-Border Air Waybill & Escrow Guarantee'}
              </p>
            </div>
            <div className="text-left">
              <span className="text-xs text-slate-500 block">{isAr ? 'رقم التتبع' : 'Tracking Number'}</span>
              <span className="font-mono text-sm font-bold text-slate-900">{shipment.trackingNumber}</span>
              {shipment.securitySealId && (
                <div className="inline-block mt-1 text-[11px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-sm">
                  {shipment.securitySealId}
                </div>
              )}
            </div>
          </div>

          {/* Hubs & Route */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white p-4 rounded-lg border border-slate-200 mb-4">
            <div>
              <span className="text-[11px] text-slate-400 font-semibold uppercase block">
                {isAr ? 'مركز الانطلاق (Origin Hub)' : 'Origin Hub'}
              </span>
              <p className="text-xs font-bold text-slate-800">{originHub ? (isAr ? originHub.nameAr : originHub.nameEn) : shipment.originHubId}</p>
              <p className="text-[11px] text-slate-500">{originHub?.address}</p>
            </div>
            <div>
              <span className="text-[11px] text-slate-400 font-semibold uppercase block">
                {isAr ? 'مركز الاستلام (Destination Hub)' : 'Destination Hub'}
              </span>
              <p className="text-xs font-bold text-slate-800">{destHub ? (isAr ? destHub.nameAr : destHub.nameEn) : shipment.destinationHubId}</p>
              <p className="text-[11px] text-slate-500">{destHub?.address}</p>
            </div>
          </div>

          {/* Sender & Recipient */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs mb-4">
            <div className="bg-white p-3 rounded-lg border border-slate-200">
              <span className="font-bold text-slate-800 block mb-1">{isAr ? 'بيانات المرسل' : 'Sender'}</span>
              <p className="text-slate-700">{shipment.senderName}</p>
              <p className="text-slate-500 font-mono text-[11px]">{shipment.senderPhone}</p>
            </div>
            <div className="bg-white p-3 rounded-lg border border-slate-200">
              <span className="font-bold text-slate-800 block mb-1">{isAr ? 'بيانات المستلم' : 'Recipient'}</span>
              <p className="text-slate-700">{shipment.recipientName}</p>
              <p className="text-slate-500 font-mono text-[11px]">{shipment.recipientPhone}</p>
              <p className="text-slate-500 text-[11px] mt-0.5">{shipment.recipientAddress}</p>
            </div>
          </div>

          {/* Cargo Specs */}
          <div className="bg-white p-4 rounded-lg border border-slate-200 mb-4 text-xs">
            <h4 className="font-bold text-slate-800 mb-2">{isAr ? 'مواصفات الطرد والتأمين' : 'Cargo & Escrow Specifications'}</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 text-slate-600">
              <div>
                <span className="text-slate-400 block">{isAr ? 'الوزن المعتمد' : 'Scale Weight'}</span>
                <span className="font-bold text-slate-900">{shipment.actualWeightKg || shipment.estimatedWeightKg} كغم</span>
              </div>
              <div>
                <span className="text-slate-400 block">{isAr ? 'الأبعاد (سم)' : 'Dimensions (cm)'}</span>
                <span className="font-bold text-slate-900">
                  {shipment.dimensionsCm?.length}x{shipment.dimensionsCm?.width}x{shipment.dimensionsCm?.height}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">{isAr ? 'القيمة المصرح بها' : 'Declared Value'}</span>
                <span className="font-bold text-emerald-700">{formatCurrency(shipment.declaredValue, 'USD')}</span>
              </div>
              <div>
                <span className="text-slate-400 block">{isAr ? 'أجرة الشحن' : 'Shipping Fee'}</span>
                <span className="font-bold text-slate-900">{formatCurrency(shipment.shippingCost, 'USD')}</span>
              </div>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-100 text-slate-700">
              <span className="text-slate-400 block text-[11px]">{isAr ? 'وصف المحتويات' : 'Item Description'}</span>
              <p className="text-xs font-medium">{shipment.itemDescription}</p>
            </div>
          </div>

          {/* Security & Inspection Seal Confirmation */}
          <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs">
            <ShieldCheck className="w-5 h-5 shrink-0" />
            <div>
              <p className="font-bold">{isAr ? 'معتمد ومفحوص أمنياً برقم ختم مشفر' : 'Certified Inspection & Tamper-Sealed'}</p>
              <p className="text-[11px] text-emerald-700">
                {isAr
                  ? 'تم فحص محتويات الطرد ومطابقتها للوائح السلامة الجوية. لا يجوز فتح هذا الطرد إلا في فرع الوصول.'
                  : 'Cargo has been physical-inspected and sealed. Opening before destination hub invalidates custody.'}
              </p>
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-2 mt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            {isAr ? 'إغلاق' : 'Close'}
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white text-xs font-semibold rounded-lg transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>{isAr ? 'طباعة البوليصة' : 'Print Waybill'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
