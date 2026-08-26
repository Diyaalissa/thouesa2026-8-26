import React from 'react';
import { ShipmentStatus, TripStatus, UserRole, KYCStatus } from '../../types';
import { ShieldCheck, Clock, CheckCircle2, AlertTriangle, XCircle, Plane, Box, Lock } from 'lucide-react';

interface StatusBadgeProps {
  status: ShipmentStatus | TripStatus | KYCStatus | UserRole | string;
  locale?: 'ar' | 'en';
  size?: 'sm' | 'md' | 'lg';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, locale = 'ar', size = 'md' }) => {
  let colorClasses = 'bg-slate-100 text-slate-700 border-slate-200';
  let label = status;
  let Icon = Clock;

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5 font-medium',
    lg: 'text-sm px-3 py-1.5 gap-2 font-medium',
  }[size];

  switch (status) {
    case 'DRAFT':
      label = locale === 'ar' ? 'مسودة' : 'Draft';
      colorClasses = 'bg-slate-100 text-slate-700 border-slate-300';
      Icon = Clock;
      break;

    case 'PENDING_DROPOFF':
      label = locale === 'ar' ? 'بانتظار التسليم للفرع' : 'Pending Hub Drop-off';
      colorClasses = 'bg-amber-50 text-amber-800 border-amber-300';
      Icon = Clock;
      break;

    case 'RECEIVED_AT_ORIGIN':
      label = locale === 'ar' ? 'مستلم بمركز الانطلاق' : 'Received at Origin Hub';
      colorClasses = 'bg-brand-50 text-brand-700 border-brand-300';
      Icon = Box;
      break;

    case 'INSPECTED_AND_SEALED':
      label = locale === 'ar' ? 'مفحوص ومختوم أمنياً' : 'Inspected & Tamper-Sealed';
      colorClasses = 'bg-emerald-50 text-emerald-800 border-emerald-300';
      Icon = ShieldCheck;
      break;

    case 'WEIGHT_DISCREPANCY_PENDING':
      label = locale === 'ar' ? 'مراجعة فرق الوزن' : 'Weight Discrepancy';
      colorClasses = 'bg-brand-50 text-brand-800 border-brand-300';
      Icon = AlertTriangle;
      break;

    case 'ASSIGNED_TO_TRIP':
      label = locale === 'ar' ? 'مجدول مع مسافر' : 'Assigned to Traveler';
      colorClasses = 'bg-brand-50 text-brand-800 border-brand-300';
      Icon = Plane;
      break;

    case 'IN_TRANSIT':
    case 'IN_FLIGHT':
      label = locale === 'ar' ? 'في مسار الرحلة الجوية' : 'In Flight Transit';
      colorClasses = 'bg-brand-500 text-white border-brand-600 shadow-xs';
      Icon = Plane;
      break;

    case 'RECEIVED_AT_DEST':
      label = locale === 'ar' ? 'وصل مركز الوجهة' : 'Arrived at Dest Hub';
      colorClasses = 'bg-teal-50 text-teal-800 border-teal-300';
      Icon = Box;
      break;

    case 'READY_FOR_PICKUP':
      label = locale === 'ar' ? 'جاهز للاستلام' : 'Ready for Pickup';
      colorClasses = 'bg-emerald-100 text-emerald-900 border-emerald-400';
      Icon = CheckCircle2;
      break;

    case 'DELIVERED':
    case 'COMPLETED':
      label = locale === 'ar' ? 'تم التسليم بنجاح' : 'Delivered & Completed';
      colorClasses = 'bg-teal-600 text-white border-emerald-700';
      Icon = CheckCircle2;
      break;

    case 'ESCROW_PAID':
    case 'ESCROW_DEPOSIT_LOCKED':
      label = locale === 'ar' ? 'الضمان المالي محجوز ومؤمن' : 'Escrow Deposit Locked';
      colorClasses = 'bg-emerald-50 text-emerald-800 border-emerald-300';
      Icon = Lock;
      break;

    case 'VERIFIED':
      label = locale === 'ar' ? 'موثق ومعتمد' : 'Verified';
      colorClasses = 'bg-emerald-50 text-emerald-800 border-emerald-300';
      Icon = ShieldCheck;
      break;

    case 'PENDING':
      label = locale === 'ar' ? 'قيد المراجعة' : 'Pending Review';
      colorClasses = 'bg-amber-50 text-amber-800 border-amber-300';
      Icon = Clock;
      break;

    case 'UNVERIFIED':
      label = locale === 'ar' ? 'غير موثق' : 'Unverified';
      colorClasses = 'bg-slate-100 text-slate-600 border-slate-300';
      Icon = AlertTriangle;
      break;

    case 'DISPUTED':
      label = locale === 'ar' ? 'محل نزاع وتدقيق' : 'Disputed';
      colorClasses = 'bg-red-50 text-red-800 border-red-300';
      Icon = AlertTriangle;
      break;

    case 'CANCELLED':
    case 'REJECTED':
      label = locale === 'ar' ? 'ملغي / مرفوض' : 'Cancelled';
      colorClasses = 'bg-rose-50 text-rose-800 border-rose-300';
      Icon = XCircle;
      break;

    case 'EMERGENCY_UNASSIGNED':
      label = locale === 'ar' ? 'إلغاء طارئ (معاد للفرع)' : 'Emergency Unassigned';
      colorClasses = 'bg-purple-50 text-purple-800 border-purple-300';
      Icon = AlertTriangle;
      break;

    default:
      label = String(status);
  }

  return (
    <span
      className={`inline-flex items-center rounded-full border ${sizeClasses} ${colorClasses} tracking-tight whitespace-nowrap transition-colors`}
    >
      <Icon className="w-3.5 h-3.5 shrink-0" />
      <span>{label}</span>
    </span>
  );
};
