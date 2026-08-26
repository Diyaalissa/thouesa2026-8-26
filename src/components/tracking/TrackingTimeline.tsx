import React, { useState } from 'react';
import { 
  CheckCircle2, 
  Clock, 
  Package, 
  ShieldCheck, 
  Plane, 
  Building2, 
  QrCode, 
  FileText, 
  AlertCircle,
  ChevronDown,
  ChevronUp,
  MapPin,
  Lock,
  Printer
} from 'lucide-react';
import { Hub, Locale, Shipment, ShipmentStatus } from '../../types';
import { HUBS_DATA } from '../../lib/constants';
import { formatCurrency } from '../../lib/crypto';
import { printAirWaybill } from '../../lib/pdfGenerator';

interface TrackingTimelineProps {
  shipment: Shipment;
  locale: Locale;
  onOpenQR?: (shipment: Shipment) => void;
  onOpenWaybill?: (shipment: Shipment) => void;
}

interface StepItem {
  key: string;
  statusMatch: ShipmentStatus[];
  titleAr: string;
  titleEn: string;
  descAr: string;
  descEn: string;
  icon: React.ElementType;
}

export const TrackingTimeline: React.FC<TrackingTimelineProps> = ({
  shipment,
  locale,
  onOpenQR,
  onOpenWaybill,
}) => {
  const isAr = locale === 'ar';
  const [isExpanded, setIsExpanded] = useState(true);

  const originHub = HUBS_DATA.find((h) => h.id === shipment.originHubId) || HUBS_DATA[0];
  const destHub = HUBS_DATA.find((h) => h.id === shipment.destinationHubId) || HUBS_DATA[1];

  const steps: StepItem[] = [
    {
      key: 'CREATED',
      statusMatch: ['PENDING_HUB_DROPOFF', 'PENDING_DROPOFF', 'DRAFT'],
      titleAr: 'إنشاء الشحنة وتأكيد الدفع',
      titleEn: 'Order Created & Payment Secured',
      descAr: `تم تسجيل الشحنة برقم تتبع ${shipment.trackingNumber} وتأمين الدفع في المحفظة.`,
      descEn: `Shipment registered with tracking ${shipment.trackingNumber} and payment reserved in escrow.`,
      icon: Package,
    },
    {
      key: 'RECEIVED',
      statusMatch: ['RECEIVED_AT_ORIGIN'],
      titleAr: 'الاستلام في فرع الإرسال',
      titleEn: 'Received at Origin Hub',
      descAr: `تم استلام الطرد فعلياً في ${originHub.nameAr} (${originHub.cityAr}).`,
      descEn: `Parcel received at ${originHub.nameEn} (${originHub.cityEn}).`,
      icon: Building2,
    },
    {
      key: 'INSPECTED',
      statusMatch: ['INSPECTED_SEALED', 'INSPECTED_AND_SEALED', 'WEIGHT_ADJUSTMENT_PENDING'],
      titleAr: 'الفحص الأمني والختم ضد العبث',
      titleEn: 'Security Inspection & Tamper Seal',
      descAr: `تم فحص الطرد، وزنه المعاير (${shipment.actualWeightKg || shipment.estimatedWeightKg} كغ)، وتثبيت الختم الإلكتروني ${shipment.securitySealId || 'SEAL-OK'}.`,
      descEn: `Inspected, weight verified (${shipment.actualWeightKg || shipment.estimatedWeightKg} kg), and electronic seal applied.`,
      icon: ShieldCheck,
    },
    {
      key: 'ASSIGNED',
      statusMatch: ['ASSIGNED_TO_TRIP'],
      titleAr: 'التخصيص على رحلة الطيران',
      titleEn: 'Assigned to Scheduled Flight',
      descAr: `تم ربط الطرد برحلة ${shipment.airline || 'الملكية الأردنية'} رقم ${shipment.flightNumber || 'RJ-511'} مع المسافر المعتمد.`,
      descEn: `Allocated to flight ${shipment.flightNumber || 'RJ-511'} with verified traveler.`,
      icon: Plane,
    },
    {
      key: 'TRANSIT',
      statusMatch: ['IN_TRANSIT'],
      titleAr: 'الشحن الجوي العابر للحدود',
      titleEn: 'Cross-Border Air Transit',
      descAr: 'الشحنة على متن الطائرة وفي مسار الشحن الجوي الدولي.',
      descEn: 'Shipment is onboard the flight in international transit.',
      icon: Plane,
    },
    {
      key: 'DEST_HUB',
      statusMatch: ['RECEIVED_AT_DEST', 'READY_FOR_PICKUP'],
      titleAr: 'الوصول لفرع الوجهة والتدقيق',
      titleEn: 'Arrived at Destination Hub',
      descAr: `وصل الطرد إلى ${destHub.nameAr} (${destHub.cityAr}) وتم تدقيق سلامة الختم وهو جاهز للاستلام.`,
      descEn: `Arrived at ${destHub.nameEn} (${destHub.cityEn}), seal verified and ready for pickup.`,
      icon: Building2,
    },
    {
      key: 'DELIVERED',
      statusMatch: ['DELIVERED'],
      titleAr: 'تم التسليم النهائي للمستلم',
      titleEn: 'Delivered & Escrow Released',
      descAr: `تم استلام الطرد من قبل ${shipment.recipientName} بعد مسح رمز الاستلام وإفراج الضمان المالي.`,
      descEn: `Successfully handed over to ${shipment.recipientName}. Escrow deposit released.`,
      icon: CheckCircle2,
    },
  ];

  // Determine active step index
  const getStepIndex = (status: ShipmentStatus): number => {
    switch (status) {
      case 'DRAFT':
      case 'PENDING_HUB_DROPOFF':
      case 'PENDING_DROPOFF':
        return 0;
      case 'RECEIVED_AT_ORIGIN':
        return 1;
      case 'INSPECTED_SEALED':
      case 'INSPECTED_AND_SEALED':
      case 'WEIGHT_ADJUSTMENT_PENDING':
        return 2;
      case 'ASSIGNED_TO_TRIP':
        return 3;
      case 'IN_TRANSIT':
        return 4;
      case 'RECEIVED_AT_DEST':
      case 'READY_FOR_PICKUP':
        return 5;
      case 'DELIVERED':
        return 6;
      default:
        return 0;
    }
  };

  const currentStepIdx = getStepIndex(shipment.currentStatus);

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden transition-colors">
      {/* Header Banner */}
      <div className="p-4 sm:p-5 bg-gradient-to-r from-brand-900/10 via-slate-900/5 to-slate-900/10 dark:from-brand-950/40 dark:via-slate-900 dark:to-slate-900/60 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-500/10 dark:bg-brand-400/20 text-brand-500 dark:text-brand-300 flex items-center justify-center font-bold">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-black text-slate-900 dark:text-white text-base tracking-wider">
                {shipment.trackingNumber}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-brand-100 dark:bg-brand-900/50 text-brand-600 dark:text-brand-300 border border-brand-200 dark:border-brand-600">
                {shipment.currentStatus}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {isAr ? 'مسار الشحن الدولي المباشر:' : 'Direct Cross-Border Corridor:'}{' '}
              <span className="font-semibold text-slate-700 dark:text-slate-200">
                {originHub.cityAr} ({originHub.countryCode}) ➔ {destHub.cityAr} ({destHub.countryCode})
              </span>
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {onOpenWaybill && (
            <button
              onClick={() => onOpenWaybill(shipment)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5 text-brand-400" />
              <span>{isAr ? 'البوليصة' : 'Waybill'}</span>
            </button>
          )}

          <button
            onClick={() => printAirWaybill(shipment, originHub, destHub)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-brand-50 hover:bg-brand-100 dark:bg-brand-950/50 text-brand-500 dark:text-brand-300 text-xs font-semibold border border-brand-200 dark:border-brand-700 transition-colors cursor-pointer"
            title={isAr ? 'طباعة بوليصة الشحن الجوي' : 'Print Air Waybill'}
          >
            <Printer className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{isAr ? 'طباعة' : 'Print'}</span>
          </button>

          {onOpenQR && (
            <button
              onClick={() => onOpenQR(shipment)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/50 text-teal-600 dark:text-emerald-400 text-xs font-semibold border border-emerald-200 dark:border-emerald-800 transition-colors cursor-pointer"
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>{isAr ? 'رمز QR' : 'QR Code'}</span>
            </button>
          )}

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Corridor Summary Card */}
      <div className="px-5 py-3 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800 text-xs grid grid-cols-1 md:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3">
        <div>
          <span className="text-slate-400 block text-[11px]">{isAr ? 'المرسل:' : 'Sender:'}</span>
          <span className="font-semibold text-slate-800 dark:text-slate-200">{shipment.senderName}</span>
        </div>
        <div>
          <span className="text-slate-400 block text-[11px]">{isAr ? 'المستلم:' : 'Recipient:'}</span>
          <span className="font-semibold text-slate-800 dark:text-slate-200">{shipment.recipientName}</span>
        </div>
        <div>
          <span className="text-slate-400 block text-[11px]">{isAr ? 'الوزن والختم:' : 'Weight & Seal:'}</span>
          <span className="font-semibold text-teal-600 dark:text-emerald-400">
            {shipment.actualWeightKg || shipment.estimatedWeightKg} kg • {shipment.securitySealId || 'Inspected'}
          </span>
        </div>
        <div>
          <span className="text-slate-400 block text-[11px]">{isAr ? 'الضمان المحجوز:' : 'Locked Escrow:'}</span>
          <span className="font-bold text-brand-500 dark:text-brand-300">
            {formatCurrency(shipment.declaredValue, 'USD')}
          </span>
        </div>
      </div>

      {/* Visual Timeline Stepper */}
      {isExpanded && (
        <div className="p-5 sm:p-6">
          <div className="relative">
            {/* Connecting Vertical Line for Mobile / Horizontal for Desktop */}
            <div className="space-y-6 sm:space-y-0 sm:grid sm:grid-cols-7 sm:gap-2 relative">
              {/* Desktop Progress Track */}
              <div className="hidden sm:block absolute top-5 start-6 end-6 h-1 bg-slate-200 dark:bg-slate-800 -z-0">
                <div
                  className="h-full bg-gradient-to-r from-brand-500 to-emerald-500 transition-all duration-500 rounded-full"
                  style={{
                    width: `${(currentStepIdx / (steps.length - 1)) * 100}%`,
                  }}
                />
              </div>

              {steps.map((step, idx) => {
                const isPassed = idx <= currentStepIdx;
                const isCurrent = idx === currentStepIdx;
                const Icon = step.icon;

                return (
                  <div key={step.key} className="flex sm:flex-col items-start sm:items-center gap-3 relative z-10">
                    {/* Node Circle */}
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-bold shrink-0 transition-all duration-300 shadow-xs ${
                        isCurrent
                          ? 'bg-brand-500 text-white ring-4 ring-brand-400/20 scale-110'
                          : isPassed
                          ? 'bg-teal-600 text-white ring-2 ring-emerald-500/20'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-400 border border-slate-300 dark:border-slate-700'
                      }`}
                    >
                      {isPassed && !isCurrent ? (
                        <CheckCircle2 className="w-5 h-5" />
                      ) : (
                        <Icon className="w-4 h-4" />
                      )}
                    </div>

                    {/* Content Block */}
                    <div className="sm:text-center flex-1">
                      <div
                        className={`text-xs font-bold ${
                          isCurrent
                            ? 'text-brand-500 dark:text-brand-300'
                            : isPassed
                            ? 'text-slate-900 dark:text-white'
                            : 'text-slate-400 dark:text-slate-500'
                        }`}
                      >
                        {isAr ? step.titleAr : step.titleEn}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                        {isAr ? step.descAr : step.descEn}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Security & Verification Guarantee Box */}
          <div className="mt-6 p-4 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5 text-emerald-800 dark:text-emerald-300">
              <Lock className="w-4 h-4 text-teal-600 shrink-0" />
              <span>
                {isAr
                  ? 'شحنة مؤمنة بنظام الختم ضد العبث وبروتوكول التحقق عبر رمز QR المشفر عند التسليم النهائي.'
                  : 'Shipment secured with tamper-proof seal and encrypted QR protocol upon final handover.'}
              </span>
            </div>
            <span className="font-mono text-[11px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/60 px-2 py-0.5 rounded-md">
              SEAL: {shipment.securitySealId || 'VERIFIED'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
