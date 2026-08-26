import React, { useState } from 'react';
import { Trip, Manifest, Shipment, Locale } from '../../types';
import { 
  ArrowLeft, ArrowRight, Plane, MapPin, Clock, ShieldCheck, 
  FileText, CheckCircle2, Lock, QrCode, AlertTriangle, Image as ImageIcon,
  UploadCloud, Check, Camera
} from 'lucide-react';
import { formatCurrency } from '../../lib/crypto';

import { HUBS_DATA } from '../../lib/constants';
import { StatusBadge } from '../common/StatusBadge';

interface TripManagerProps {
  trip: Trip;
  manifests: Manifest[];
  shipments: Shipment[];
  locale: Locale;
  onBack: () => void;
  onLockEscrow: (tripId: string) => Promise<boolean>;
  onEmergencyUnassign: (tripId: string, reason: string) => Promise<boolean>;
  onOpenQR: (trip: Trip) => void;
  onViewInspection: (shipment: Shipment) => void;
}

export const TripManager: React.FC<TripManagerProps> = ({
  trip, manifests, shipments, locale, onBack, onLockEscrow, onEmergencyUnassign, onOpenQR, onViewInspection
}) => {
  
const safeFetchJson = async (url: string, options?: RequestInit) => {
  const res = await fetch(url, options);
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
};

  const isAr = locale === 'ar';
  const ArrowBack = isAr ? ArrowRight : ArrowLeft;
  
  const [activeTab, setActiveTab] = useState<'MANIFEST' | 'DOCUMENTS' | 'JOURNEY'>('MANIFEST');
  const [uploadedDocs, setUploadedDocs] = useState<Record<string, boolean>>({});

  const originHub = HUBS_DATA.find((h) => h.id === trip.originHubId);
  const destHub = HUBS_DATA.find((h) => h.id === trip.destinationHubId);
  
  // Assigned shipments
  const tripShipments = shipments.filter(s => s.assignedTravelerId === trip.travelerId && s.originHubId === trip.originHubId);

  const [isUploading, setIsUploading] = useState<Record<string, boolean>>({});

  const handleUpload = async (docType: string) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*,application/pdf';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      setIsUploading(prev => ({ ...prev, [docType]: true }));
      
      try {
        const reader = new FileReader();
        reader.onload = async () => {
          const base64 = reader.result as string;
          try {
            const res = await safeFetchJson(`/api/trips/${trip.id}/documents`, {
              method: 'POST',
              body: JSON.stringify({
                docType,
                fileName: file.name,
                fileData: base64
              })
            });
            
            if (res.success && res.trip) {
              setUploadedDocs(prev => ({ ...prev, [docType]: true }));
              if (trip) {
                if (!trip.documents) trip.documents = {};
                trip.documents[docType] = res.trip.documents[docType];
              }
            }
          } catch (error) {
            console.error('Upload failed', error);
          } finally {
            setIsUploading(prev => ({ ...prev, [docType]: false }));
          }
        };
        reader.readAsDataURL(file);
      } catch (err) {
        console.error(err);
        setIsUploading(prev => ({ ...prev, [docType]: false }));
      }
    };
    input.click();
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors font-semibold text-sm"
        >
          <ArrowBack className="w-4 h-4" />
          {isAr ? 'العودة للرحلات' : 'Back to Flights'}
        </button>
        <StatusBadge status={trip.status} locale={locale} />
      </div>

      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-3 text-2xl font-black text-slate-900 mb-2">
              <span>{originHub?.countryCode}</span>
              <Plane className="w-5 h-5 text-teal-600" />
              <span>{destHub?.countryCode}</span>
            </div>
            <p className="text-sm font-semibold text-slate-500">
              {trip.airline} ({trip.flightNumber}) • PNR: <span className="text-brand-600">{trip.pnrCode}</span>
            </p>
          </div>
          <div className="flex gap-2">
            {!trip.isEscrowPaid ? (
              <button
                onClick={() => onLockEscrow(trip.id)}
                className="flex items-center gap-2 px-5 py-2.5 bg-teal-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md transition-colors"
              >
                <Lock className="w-4 h-4" />
                <span>{isAr ? 'حجز الضمان ($' + trip.requiredEscrowDeposit + ')' : 'Lock Escrow Hold ($' + trip.requiredEscrowDeposit + ')'}</span>
              </button>
            ) : (
              <button
                onClick={() => onOpenQR(trip)}
                className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-md transition-colors"
              >
                <QrCode className="w-4 h-4 text-emerald-400" />
                <span>{isAr ? 'رمز التسليم QR' : 'Handover QR'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {[
            { id: 'MANIFEST', icon: FileText, labelEn: 'Manifest & Shipments', labelAr: 'قائمة الطرود' },
            { id: 'DOCUMENTS', icon: ShieldCheck, labelEn: 'KYC & Documents', labelAr: 'الوثائق والمستندات' },
            { id: 'JOURNEY', icon: MapPin, labelEn: 'Live Journey', labelAr: 'مسار الرحلة المباشر' }
          ].map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  active ? 'bg-teal-50 text-teal-700 border border-teal-200' : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                <Icon className={`w-4 h-4 ${active ? 'text-teal-600' : 'text-slate-400'}`} />
                {isAr ? tab.labelAr : tab.labelEn}
              </button>
            )
          })}
        </div>

        {/* Tab Content */}
        <div className="pt-2">
          {activeTab === 'MANIFEST' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl text-center">
                  <span className="block text-xs text-slate-500 mb-1">{isAr ? 'السعة الكلية المحجوزة' : 'Allocated Capacity'}</span>
                  <span className="text-xl font-black text-slate-900">{trip.allocatedWeightKg} kg</span>
                </div>
                <div className="p-4 bg-teal-50 border border-teal-100 rounded-2xl text-center">
                  <span className="block text-xs text-teal-700/70 mb-1">{isAr ? 'أرباح الرحلة المقدرة' : 'Estimated Earnings'}</span>
                  <span className="text-xl font-black text-teal-700">{formatCurrency(trip.totalEarningsEstimated, 'USD')}</span>
                </div>
                <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl text-center">
                  <span className="block text-xs text-amber-700/70 mb-1">{isAr ? 'الضمان المالي' : 'Escrow Deposit'}</span>
                  <span className="text-xl font-black text-amber-700">{formatCurrency(trip.requiredEscrowDeposit, 'USD')}</span>
                </div>
              </div>

              <h4 className="text-sm font-bold text-slate-900 mb-3">{isAr ? 'الطرود المسندة للرحلة' : 'Assigned Parcels'}</h4>
              {tripShipments.length > 0 ? (
                <div className="space-y-3">
                  {tripShipments.map(s => (
                    <div key={s.id} className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 border border-slate-200 rounded-2xl hover:border-teal-300 transition-colors">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono text-xs font-bold text-brand-600">{s.id.split('-')[0].toUpperCase()}</span>
                          <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-semibold">{s.weightKg} kg</span>
                        </div>
                        <p className="text-sm font-semibold text-slate-900">{s.itemDescription}</p>
                        <p className="text-xs text-slate-500 mt-1">Seal: <span className="font-mono font-bold text-amber-600">{s.securitySealId || 'PENDING'}</span></p>
                      </div>
                      <button 
                        onClick={() => onViewInspection(s)}
                        className="flex items-center justify-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors shrink-0"
                      >
                        <ShieldCheck className="w-4 h-4 text-teal-600" />
                        {isAr ? 'شهادة الفحص' : 'View Inspection'}
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center p-8 bg-slate-50 rounded-2xl border border-slate-100 border-dashed">
                  <p className="text-slate-500 text-sm font-medium">{isAr ? 'لا توجد طرود مسندة بعد.' : 'No parcels assigned yet.'}</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'DOCUMENTS' && (
            <div className="space-y-4">
              <p className="text-sm text-slate-600 mb-6">
                {isAr ? 'يرجى إرفاق المستندات التالية لتوثيق الرحلة وإصدار بوليصة الشحن النهائية.' : 'Please upload the following documents to verify your journey and issue the final waybill.'}
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { id: 'passport', titleEn: 'Passport / ID', titleAr: 'جواز السفر / الهوية', req: true },
                  { id: 'ticket', titleEn: 'Flight Ticket (PDF)', titleAr: 'تذكرة الطيران (PDF)', req: true },
                  { id: 'boarding', titleEn: 'Boarding Pass', titleAr: 'بطاقة صعود الطائرة', req: false },
                  { id: 'baggage', titleEn: 'Baggage Claim Tags', titleAr: 'بطاقات الأمتعة (Tags)', req: false }
                ].map(doc => {
                  const isUploaded = !!trip.documents?.[doc.id] || uploadedDocs[doc.id];
                  const uploading = isUploading[doc.id];
                  return (
                    <div key={doc.id} className={`p-4 rounded-2xl border transition-all ${isUploaded ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-slate-200'}`}>
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h5 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                            {isAr ? doc.titleAr : doc.titleEn}
                            {doc.req && <span className="text-[10px] text-rose-500 bg-rose-50 px-1.5 py-0.5 rounded-md">* {isAr ? 'مطلوب' : 'Required'}</span>}
                          </h5>
                        </div>
                        {isUploaded && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
                      </div>
                      
                      {!isUploaded ? (
                        <button 
                          onClick={() => handleUpload(doc.id)}
                          className="w-full py-6 rounded-xl border-2 border-dashed border-slate-300 hover:border-teal-400 hover:bg-teal-50 flex flex-col items-center justify-center gap-2 transition-colors group cursor-pointer"
                        >
                          <UploadCloud className="w-6 h-6 text-slate-400 group-hover:text-teal-500 transition-colors" />
                          {uploading ? (
                            <span className="text-xs font-bold text-teal-600">{isAr ? 'جاري الرفع...' : 'Uploading...'}</span>
                          ) : (
                            <span className="text-xs font-semibold text-slate-500 group-hover:text-teal-600">{isAr ? 'اختر ملف أو التقط صورة' : 'Select file or take photo'}</span>
                          )}
                        </button>
                      ) : (
                        <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-emerald-100">
                          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700">
                            <ImageIcon className="w-4 h-4" />
                            {trip.documents?.[doc.id]?.fileName || 'document_uploaded.jpg'}
                          </div>
                          <button onClick={() => setUploadedDocs(prev => ({...prev, [doc.id]: false}))} className="text-[10px] text-slate-400 hover:text-rose-500 underline">
                            {isAr ? 'إزالة' : 'Remove'}
                          </button>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {activeTab === 'JOURNEY' && (
            <div className="max-w-xl mx-auto py-4">
               <h4 className="text-sm font-bold text-slate-900 mb-6">{isAr ? 'تحديث حالة الرحلة مباشرة' : 'Live Journey Updates'}</h4>
               <div className="space-y-0 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
                  {[
                    { id: '1', status: 'DONE', labelEn: 'Packages picked up from Origin Hub', labelAr: 'استلام الطرود من فرع المغادرة', time: '10:30 AM' },
                    { id: '2', status: 'DONE', labelEn: 'Arrived at Departure Airport', labelAr: 'الوصول لمطار المغادرة', time: '14:00 PM' },
                    { id: '3', status: 'ACTIVE', labelEn: 'Checked-in & Baggage Dropped', labelAr: 'تسجيل الدخول وتسليم الأمتعة', time: 'Pending' },
                    { id: '4', status: 'WAITING', labelEn: 'Boarded Flight', labelAr: 'صعود الطائرة', time: 'Pending' },
                    { id: '5', status: 'WAITING', labelEn: 'Arrived at Destination Airport', labelAr: 'الوصول لمطار الوجهة', time: 'Pending' },
                    { id: '6', status: 'WAITING', labelEn: 'Delivered to Destination Hub', labelAr: 'التسليم لفرع الوجهة (فك الضمان)', time: 'Pending' }
                  ].map((step, idx) => (
                    <div key={step.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active py-4">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-slate-100 text-slate-400 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 transition-colors"
                           style={{ backgroundColor: step.status === 'DONE' ? '#10b981' : step.status === 'ACTIVE' ? '#0f766e' : '#f1f5f9', color: step.status !== 'WAITING' ? 'white' : '' }}>
                        {step.status === 'DONE' ? <Check className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                      </div>
                      <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-2xl border border-slate-200 bg-white shadow-xs">
                        <div className="flex items-center justify-between mb-1">
                          <h5 className={`font-bold text-sm ${step.status === 'ACTIVE' ? 'text-teal-700' : 'text-slate-800'}`}>
                            {isAr ? step.labelAr : step.labelEn}
                          </h5>
                        </div>
                        <time className="text-xs text-slate-400 font-mono">{step.time}</time>
                        {step.status === 'ACTIVE' && (
                          <button className="mt-3 w-full py-2 bg-teal-600 hover:bg-emerald-600 text-white text-xs font-bold rounded-lg transition-colors shadow-sm">
                            {isAr ? 'تحديث كـ مكتمل' : 'Mark as Completed'}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
               </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
