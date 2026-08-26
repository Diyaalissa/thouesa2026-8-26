import React, { useState } from 'react';
import {
  Building2,
  Scan,
  Scale,
  ShieldCheck,
  Plane,
  Box,
  CheckCircle2,
  AlertTriangle,
  QrCode,
  Search,
  Filter,
  Camera,
  CheckCheck,
  UserCheck,
  Lock,
  ArrowRight,
  ArrowLeft,
  FileSpreadsheet,
  BadgeCheck,
  User,
  Phone,
  MapPin,
  Tag,
  ExternalLink,
  Layers,
  Sparkles,
  Barcode,
} from 'lucide-react';
import { Hub, Locale, Manifest, OrderItem, Shipment, Trip, User as UserType } from '../../types';
import { StatusBadge } from '../common/StatusBadge';
import { QRScannerModal } from '../common/QRScannerModal';
import { QRModal } from '../common/QRModal';
import { InspectionModal } from './InspectionModal';
import { formatCurrency, generateCryptographicHandoverToken } from '../../lib/crypto';
import { HUBS_DATA } from '../../lib/constants';

interface HubPortalProps {
  currentUser: UserType;
  currentHub: Hub;
  shipments: Shipment[];
  trips: Trip[];
  manifests: Manifest[];
  locale: Locale;
  onSelectHub: (hubId: string) => void;
  onInspectShipment: (payload: any) => Promise<boolean>;
  onCreateManifest: (payload: any) => Promise<boolean>;
  onHandoverDispatch: (payload: any) => Promise<boolean>;
  onDestinationIntake: (payload: any) => Promise<boolean>;
  onDeliverToRecipient: (payload: any) => Promise<boolean>;
  onRefreshData: () => void;
}

export const HubPortal: React.FC<HubPortalProps> = ({
  currentUser,
  currentHub,
  shipments,
  trips,
  manifests,
  locale,
  onSelectHub,
  onInspectShipment,
  onCreateManifest,
  onHandoverDispatch,
  onDestinationIntake,
  onDeliverToRecipient,
  onRefreshData,
}) => {
  const isAr = locale === 'ar';
  const [activeTab, setActiveTab] = useState<
    'PREPARING_INTAKE' | 'DISPATCH_MANIFEST' | 'AIRPORT_TRANSIT' | 'HANDOVER_DELIVERY'
  >('PREPARING_INTAKE');

  // Scanner modal state
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scannerPurpose, setScannerPurpose] = useState<'QUICK_LOOKUP' | 'DISPATCH' | 'DEST_INTAKE' | 'RECIPIENT'>('QUICK_LOOKUP');

  // QR display modal
  const [qrModalToken, setQrModalToken] = useState<string>('');

  // Selected shipment for order & customer inspection modal
  const [inspectedShipment, setInspectedShipment] = useState<Shipment | null>(null);
  const [inspectionModalShipment, setInspectionModalShipment] = useState<Shipment | null>(null);

  // 1. Intake & Inspection Form State
  const [selectedShipmentForIntake, setSelectedShipmentForIntake] = useState<Shipment | null>(null);
  const [scaleActualWeightKg, setScaleActualWeightKg] = useState<number>(2.3);
  const [sealId, setSealId] = useState<string>(`SEAL-${currentHub.code}-${Math.floor(10000 + Math.random() * 90000)}`);
  const [inspectionNotes, setInspectionNotes] = useState('تم فحص المحتويات ومطابقتها للشروط الجوية وخلوها من المواد الممنوعة.');
  const [isSubmittingIntake, setIsSubmittingIntake] = useState(false);

  // 2. Manifest Builder Form State
  const [manifestTripId, setManifestTripId] = useState<string>(trips[0]?.id || '');
  const [selectedShipmentIdsForManifest, setSelectedShipmentIdsForManifest] = useState<string[]>([]);
  const [isSubmittingManifest, setIsSubmittingManifest] = useState(false);

  // 3. Final Recipient Delivery Form State
  const [deliveryShipmentId, setDeliveryShipmentId] = useState<string>('');
  const [recipientNationalIdCheck, setRecipientNationalIdCheck] = useState<string>('');
  const [recipientOtp, setRecipientOtp] = useState<string>('9842');
  const [isDelivering, setIsDelivering] = useState(false);

  // Filtered lists for the 4 explicit stages
  const preparingShipments = shipments.filter(
    (s) =>
      s.originHubId === currentHub.id &&
      (s.currentStatus === 'CREATED' || s.currentStatus === 'RECEIVED_AT_ORIGIN')
  );

  const readyForManifestShipments = shipments.filter(
    (s) => s.originHubId === currentHub.id && s.currentStatus === 'INSPECTED_AND_SEALED'
  );

  const airportTransitShipments = shipments.filter(
    (s) =>
      (s.originHubId === currentHub.id || s.destinationHubId === currentHub.id) &&
      (s.currentStatus === 'MANIFEST_ASSIGNED' || s.currentStatus === 'IN_TRANSIT')
  );

  const deliveredAndReceivedShipments = shipments.filter(
    (s) =>
      s.destinationHubId === currentHub.id &&
      (s.currentStatus === 'RECEIVED_AT_DEST' ||
        s.currentStatus === 'READY_FOR_PICKUP' ||
        s.currentStatus === 'DELIVERED')
  );

  // Handle Inspection Submit
  const handleIntakeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedShipmentForIntake) return;

    setIsSubmittingIntake(true);
    const success = await onInspectShipment({
      shipmentId: selectedShipmentForIntake.id,
      agentId: currentUser.id,
      actualWeightKg: scaleActualWeightKg,
      securitySealId: sealId,
      inspectionNotes,
      photoUrls: ['https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=400'],
    });
    setIsSubmittingIntake(false);

    if (success) {
      setSelectedShipmentForIntake(null);
      setSealId(`SEAL-${currentHub.code}-${Math.floor(10000 + Math.random() * 90000)}`);
      onRefreshData();
    }
  };

  // Handle Manifest Builder Submit
  const handleManifestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedShipmentIdsForManifest.length === 0 || !manifestTripId) {
      alert(isAr ? 'يرجى اختيار رحلة الطيران وطرد واحد على الأقل للمانيفست' : 'Please select a trip and at least one package');
      return;
    }

    setIsSubmittingManifest(true);
    const success = await onCreateManifest({
      tripId: manifestTripId,
      agentId: currentUser.id,
      shipmentIds: selectedShipmentIdsForManifest,
    });
    setIsSubmittingManifest(false);

    if (success) {
      setSelectedShipmentIdsForManifest([]);
      setActiveTab('AIRPORT_TRANSIT');
      onRefreshData();
    }
  };

  // Handle Scanner Success
  const handleScanSuccess = async (scannedToken: string) => {
    // Quick search for shipment in local database
    const matched = shipments.find(
      (s) => s.trackingNumber.toLowerCase() === scannedToken.toLowerCase() || scannedToken.includes(s.trackingNumber)
    );

    if (matched) {
      setInspectedShipment(matched);
      alert(isAr ? `تم العثور على الشحنة: ${matched.trackingNumber}!` : `Found shipment: ${matched.trackingNumber}!`);
      return;
    }

    if (scannerPurpose === 'DISPATCH') {
      const activeManifest = manifests[0];
      await onHandoverDispatch({
        manifestId: activeManifest?.id || 'man-8801',
        agentId: currentUser.id,
        travelerId: 'usr-traveler-202',
        scannedToken,
      });
      alert(isAr ? 'تم توثيق تسليم العهدة للمسافر برمز QR بنجاح!' : 'Custody successfully transferred to traveler!');
    } else if (scannerPurpose === 'DEST_INTAKE') {
      const activeManifest = manifests[0];
      await onDestinationIntake({
        manifestId: activeManifest?.id || 'man-8801',
        agentId: currentUser.id,
        receivedCondition: 'SEALS_INTACT',
        scannedToken,
      });
      alert(isAr ? 'تم استلام الطرود بفرع الوجهة ومطابقة الأختام وفك تأمين المسافر المالي فوراً!' : 'Destination intake verified, seals matched, traveler escrow released!');
    }
    onRefreshData();
  };

  // Handle Delivery to Final Recipient
  const handleFinalDeliverySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deliveryShipmentId) return;

    setIsDelivering(true);
    const success = await onDeliverToRecipient({
      shipmentId: deliveryShipmentId,
      agentId: currentUser.id,
      recipientNationalId: recipientNationalIdCheck,
      deliveryNotes: 'تم تسليم الطرد للمستلم باليد بعد التحقق من الهوية ورقم OTP.',
    });
    setIsDelivering(false);

    if (success) {
      alert(isAr ? 'تم تسليم الطرد للمستلم بنجاح وإغلاق دورة الشحنة!' : 'Shipment delivered to recipient successfully!');
      setDeliveryShipmentId('');
      onRefreshData();
    }
  };

  return (
    <div className="space-y-6" dir={isAr ? 'rtl' : 'ltr'}>
      {/* 1. UNIFIED STAFF PROFILE HEADER */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900 text-white p-5 rounded-3xl border border-slate-800 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-bold">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black">
                {isAr ? 'بوابة الموظفين المركزية الموحدة' : 'Unified Staff Logistics Terminal'}
              </h2>
              <span className="text-xs bg-amber-500/20 text-amber-300 font-bold px-2 py-0.5 rounded-md border border-amber-500/30 font-mono">
                {currentHub.code}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {isAr
                ? `الموظف: ${currentUser.fullName} (${currentUser.phone}) • الفرع: ${currentHub.nameAr}`
                : `Employee: ${currentUser.fullName} • Branch: ${currentHub.nameEn}`}
            </p>
          </div>
        </div>

        {/* Quick QR Scanner & Hub Switcher */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setScannerPurpose('QUICK_LOOKUP');
              setScannerOpen(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-md transition-colors cursor-pointer"
          >
            <Scan className="w-4 h-4" />
            <span>{isAr ? 'ماسح الباركود / QR السريع' : 'Scan Customer QR / Barcode'}</span>
          </button>

          <div className="flex items-center gap-1.5 bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-xl text-xs">
            <span className="text-slate-400 font-semibold">{isAr ? 'الفرع:' : 'Hub:'}</span>
            <select
              value={currentHub.id}
              onChange={(e) => onSelectHub(e.target.value)}
              className="bg-transparent text-white font-bold focus:outline-hidden cursor-pointer"
            >
              {HUBS_DATA.map((h) => (
                <option key={h.id} value={h.id} className="bg-slate-900 text-white">
                  {isAr ? h.nameAr : h.nameEn} ({h.code})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 2. THE 4 EXPLICIT STAGES WORKFLOW TABS */}
      <div className="flex items-center gap-1.5 overflow-x-auto bg-slate-100 p-1.5 rounded-2xl border border-slate-200 text-xs font-semibold scrollbar-none">
        {/* Stage 1: Preparing & Intake */}
        <button
          onClick={() => setActiveTab('PREPARING_INTAKE')}
          className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'PREPARING_INTAKE'
              ? 'bg-white text-slate-900 shadow-sm font-bold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Scale className="w-4 h-4 text-amber-600" />
          <span>{isAr ? '1. الطرود قيد التجهيز والفحص' : '1. Packages in Preparation'}</span>
          <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center text-[10px]">
            {preparingShipments.length}
          </span>
        </button>

        {/* Stage 2: Dispatched & Manifests */}
        <button
          onClick={() => setActiveTab('DISPATCH_MANIFEST')}
          className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'DISPATCH_MANIFEST'
              ? 'bg-white text-slate-900 shadow-sm font-bold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4 text-blue-600" />
          <span>{isAr ? '2. الطرود قيد الترحيل والمانيفست' : '2. Dispatched Manifests'}</span>
          <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center text-[10px]">
            {readyForManifestShipments.length}
          </span>
        </button>

        {/* Stage 3: Flight Transit / Reached Airport */}
        <button
          onClick={() => setActiveTab('AIRPORT_TRANSIT')}
          className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'AIRPORT_TRANSIT'
              ? 'bg-white text-slate-900 shadow-sm font-bold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Plane className="w-4 h-4 text-indigo-600" />
          <span>{isAr ? '3. الطرود في الرحلة الجوية / المطار' : '3. Flight & Airport Transit'}</span>
          <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-800 flex items-center justify-center text-[10px]">
            {airportTransitShipments.length}
          </span>
        </button>

        {/* Stage 4: Delivered & Handed Over */}
        <button
          onClick={() => setActiveTab('HANDOVER_DELIVERY')}
          className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'HANDOVER_DELIVERY'
              ? 'bg-white text-slate-900 shadow-sm font-bold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <UserCheck className="w-4 h-4 text-purple-600" />
          <span>{isAr ? '4. الطرود المستلمة والمسلمة للعملاء' : '4. Handed Over & Delivered'}</span>
          <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-800 flex items-center justify-center text-[10px]">
            {deliveredAndReceivedShipments.length}
          </span>
        </button>
      </div>

      {/* STAGE 1: PACKAGES BEING PREPARED & CERTIFIED INTAKE */}
      {activeTab === 'PREPARING_INTAKE' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Packages List */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {isAr ? 'الطرود قيد الاستلام والتجهيز' : 'Parcels in Preparation'} ({preparingShipments.length})
            </h3>

            {preparingShipments.length === 0 ? (
              <div className="p-6 bg-white border border-slate-200 rounded-2xl text-center text-slate-400 text-xs">
                {isAr ? 'لا توجد طرود بانتظار الفحص حالياً' : 'No parcels awaiting intake'}
              </div>
            ) : (
              preparingShipments.map((s) => {
                const isSelected = selectedShipmentForIntake?.id === s.id;
                return (
                  <div
                    key={s.id}
                    onClick={() => {
                      setSelectedShipmentForIntake(s);
                      setScaleActualWeightKg(s.estimatedWeightKg);
                    }}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-amber-50/80 border-amber-500 ring-2 ring-amber-500/20 shadow-xs'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-mono font-bold text-xs text-slate-900">{s.trackingNumber}</span>
                      <StatusBadge status={s.currentStatus} locale={locale} size="sm" />
                    </div>
                    <p className="text-xs font-medium text-slate-800 truncate mb-1">{s.itemDescription}</p>
                    <div className="flex justify-between text-[11px] text-slate-500">
                      <span>{isAr ? 'المقدر:' : 'Est:'} {s.estimatedWeightKg} kg</span>
                      <span className="font-semibold text-emerald-700">${s.declaredValue}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Inspection Terminal Form */}
          <div className="lg:col-span-2">
            {selectedShipmentForIntake ? (
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      {isAr ? 'محطة الفحص والتغليف الأمني والميزان المعتمد' : 'Certified Inspection & Tamper Seal Station'}
                    </h3>
                    <p className="text-xs text-slate-500">
                      {isAr ? 'رقم الطرد:' : 'Tracking #:'} {selectedShipmentForIntake.trackingNumber} • {selectedShipmentForIntake.recipientName}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setInspectionModalShipment(selectedShipmentForIntake)}
                      className="px-3 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 border border-emerald-200"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>{isAr ? 'فحص متقدم وتصوير 360°' : '360° Visual Inspection & Bill of Lading'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setInspectedShipment(selectedShipmentForIntake)}
                      className="px-3 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                    >
                      {isAr ? 'عرض تفاصيل الأصناف' : 'View Order Items'}
                    </button>
                  </div>
                </div>

                <form onSubmit={handleIntakeSubmit} className="space-y-4 text-xs">
                  {/* Scale Certified Weight */}
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="flex justify-between items-center mb-2">
                      <label className="font-bold text-slate-800 flex items-center gap-1.5">
                        <Scale className="w-4 h-4 text-blue-600" />
                        <span>{isAr ? 'قراءة الميزان الرقمي المعتمد في الفرع (كغم):' : 'Certified Digital Scale Weight (kg):'}</span>
                      </label>
                      <span className="text-[11px] text-slate-500">
                        {isAr ? 'المقدر من العميل:' : 'Customer Estimate:'} {selectedShipmentForIntake.estimatedWeightKg} كغم
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <input
                        type="number"
                        step="0.05"
                        value={scaleActualWeightKg}
                        onChange={(e) => setScaleActualWeightKg(Number(e.target.value))}
                        className="w-36 p-2.5 bg-white border border-slate-300 rounded-xl font-black text-lg text-blue-700 text-center"
                      />
                      <span className="font-bold text-slate-700">كغم (kg)</span>

                      {Math.abs(scaleActualWeightKg - selectedShipmentForIntake.estimatedWeightKg) > 0.3 && (
                        <div className="flex items-center gap-1 text-[11px] font-bold text-orange-700 bg-orange-100 px-2.5 py-1 rounded-lg">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>{isAr ? 'يوجد فارق وزن سيتم إشعار العميل به آلياً' : 'Weight discrepancy will trigger approval'}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Serialized Tamper-Evident Seal ID */}
                  <div>
                    <label className="block font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <span>{isAr ? 'رقم شريط الختم الأمني المشفر (Seal ID):' : 'Tamper-Evident Seal ID:'}</span>
                    </label>
                    <input
                      type="text"
                      value={sealId}
                      onChange={(e) => setSealId(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-emerald-800"
                    />
                  </div>

                  {/* Inspection Notes */}
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">{isAr ? 'تقرير وملاحظات الفحص:' : 'Inspection Notes:'}</label>
                    <textarea
                      rows={2}
                      value={inspectionNotes}
                      onChange={(e) => setInspectionNotes(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmittingIntake}
                    className="w-full py-3 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs shadow-md transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <CheckCheck className="w-4 h-4" />
                    <span>{isSubmittingIntake ? (isAr ? 'جارِ الحفظ والختم...' : 'Processing...') : (isAr ? 'اعتماد الفحص وتطبيق الختم الأمني' : 'Approve Inspection & Apply Seal')}</span>
                  </button>
                </form>
              </div>
            ) : (
              <div className="bg-white rounded-2xl p-12 border border-slate-200 text-center text-slate-400">
                <Scale className="w-12 h-12 mx-auto mb-2 opacity-40 text-amber-600" />
                <p className="text-xs">{isAr ? 'اختر طرداً من القائمة لإجراء الفحص والوزن المعتمد' : 'Select a parcel to begin certified intake'}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* STAGE 2: PACKAGES BEING DISPATCHED ON MANIFESTS */}
      {activeTab === 'DISPATCH_MANIFEST' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                {isAr ? 'تجميع طرود الرحلة الجوية وبناء المانيفست (Manifest Builder)' : 'Flight Manifest Builder'}
              </h3>
              <p className="text-xs text-slate-500">
                {isAr ? 'ربط الطرود المفحوصة بالمسافر المعتمد وتأكيد حجز التأمين المالي' : 'Group inspected parcels onto scheduled flight & lock escrow'}
              </p>
            </div>
          </div>

          <form onSubmit={handleManifestSubmit} className="space-y-5 text-xs">
            <div>
              <label className="block font-bold text-slate-800 mb-1.5">{isAr ? 'اختر رحلة المسافر المعتمد:' : 'Select Verified Traveler Flight:'}</label>
              <select
                value={manifestTripId}
                onChange={(e) => setManifestTripId(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
              >
                {trips.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.travelerName} • {t.airline} ({t.flightNumber}) • السعة: {t.availableWeightKg} كغم • PNR: {t.pnrCode}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-800 mb-2">
                {isAr ? 'اختر الطرود المفحوصة لضمها للمانيفست:' : 'Select Inspected Packages for this Manifest:'}
              </label>

              {readyForManifestShipments.length === 0 ? (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-center text-slate-500 text-xs">
                  {isAr ? 'لا توجد طرود مفحوصة جاهزة للمانيفست حالياً' : 'No inspected parcels ready for manifest'}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {readyForManifestShipments.map((shipment) => {
                    const isChecked = selectedShipmentIdsForManifest.includes(shipment.id);
                    return (
                      <div
                        key={shipment.id}
                        onClick={() => {
                          setSelectedShipmentIdsForManifest((prev) =>
                            isChecked ? prev.filter((id) => id !== shipment.id) : [...prev, shipment.id]
                          );
                        }}
                        className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                          isChecked ? 'bg-blue-50/80 border-blue-500 ring-1 ring-blue-500' : 'bg-slate-50 border-slate-200'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          readOnly
                          className="mt-0.5 w-4 h-4 text-blue-600 rounded-sm"
                        />
                        <div className="flex-1 text-xs">
                          <div className="flex justify-between font-bold text-slate-900 mb-1">
                            <span>{shipment.trackingNumber}</span>
                            <span className="text-emerald-700">{shipment.actualWeightKg || shipment.estimatedWeightKg} كغم</span>
                          </div>
                          <p className="text-slate-600 truncate mb-1">{shipment.itemDescription}</p>
                          <div className="text-[11px] text-slate-400 font-mono">
                            {shipment.securitySealId}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmittingManifest || selectedShipmentIdsForManifest.length === 0}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs shadow-md transition-colors cursor-pointer"
            >
              {isSubmittingManifest ? (isAr ? 'جارِ إنشاء المانيفست...' : 'Building Manifest...') : (isAr ? 'إصدار المانيفست المشفر وتوليد رمز التسليم' : 'Generate Secure Manifest')}
            </button>
          </form>
        </div>
      )}

      {/* STAGE 3: PACKAGES IN FLIGHT TRANSIT OR REACHED AIRPORT */}
      {activeTab === 'AIRPORT_TRANSIT' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6 text-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                {isAr ? 'متابعة الطرود في مسار الرحلات الجوية والمطارات' : 'Active In-Flight & Airport Transit Tracking'}
              </h3>
              <p className="text-slate-500">
                {isAr ? 'تتبع مسار الطرود المحمولة مع المسافرين المعتمدين وتأكيد وصولها لمطار الوجهة' : 'Real-time traveler flight tracking and destination airport intake'}
              </p>
            </div>
          </div>

          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-start">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3 text-start">{isAr ? 'رقم التتبع' : 'Tracking #'}</th>
                  <th className="p-3 text-start">{isAr ? 'المحتوى' : 'Item'}</th>
                  <th className="p-3 text-start">{isAr ? 'المسافر والرحلة' : 'Traveler & Flight'}</th>
                  <th className="p-3 text-start">{isAr ? 'الختم الأمني' : 'Seal ID'}</th>
                  <th className="p-3 text-start">{isAr ? 'الحالة' : 'Status'}</th>
                  <th className="p-3 text-center">{isAr ? 'الإجراء' : 'Action'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {airportTransitShipments.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50">
                    <td className="p-3 font-mono font-bold text-blue-600">{s.trackingNumber}</td>
                    <td className="p-3 font-medium">{s.itemDescription}</td>
                    <td className="p-3">
                      <div className="font-bold text-slate-900">{s.assignedTravelerName || 'يوسف القاضي'}</div>
                      <div className="text-[11px] text-slate-500">{s.airline || 'Royal Jordanian'} ({s.flightNumber || 'RJ-511'})</div>
                    </td>
                    <td className="p-3 font-mono text-emerald-700 font-bold">{s.securitySealId}</td>
                    <td className="p-3">
                      <StatusBadge status={s.currentStatus} locale={locale} size="sm" />
                    </td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => setInspectedShipment(s)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold cursor-pointer"
                      >
                        {isAr ? 'التفاصيل' : 'Details'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* STAGE 4: PACKAGES DELIVERED & HANDED OVER TO CUSTOMERS */}
      {activeTab === 'HANDOVER_DELIVERY' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6 text-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                {isAr ? 'محطة استلام الطرود بالفرع وتسليمها للمستلم النهائي' : 'Destination Cargo Intake & Final Handover'}
              </h3>
              <p className="text-slate-500">
                {isAr ? 'التحقق من الأختام، فك تأمين المسافر المالي، وتسليم الطرود للمستلمين' : 'Inspect seals, release escrow, and hand over to verified recipients'}
              </p>
            </div>
          </div>

          <form onSubmit={handleFinalDeliverySubmit} className="space-y-4 max-w-xl mx-auto p-5 bg-slate-50 border border-slate-200 rounded-2xl">
            <h4 className="font-bold text-slate-900 text-sm">{isAr ? 'تسليم طرد للمستلم في المركز' : 'Counter Parcel Handover'}</h4>

            <div>
              <label className="block font-semibold mb-1">{isAr ? 'اختر الطرد الجاهز للتسليم:' : 'Select Parcel:'}</label>
              <select
                value={deliveryShipmentId}
                onChange={(e) => setDeliveryShipmentId(e.target.value)}
                className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-medium"
              >
                <option value="">{isAr ? '-- اختر الطرد --' : '-- Select Parcel --'}</option>
                {shipments.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.trackingNumber} - {s.recipientName} ({s.recipientPhone})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold mb-1">{isAr ? 'رقم بطاقة الهوية / الإثبات الوطني للمستلم:' : 'Recipient National ID:'}</label>
              <input
                type="text"
                value={recipientNationalIdCheck}
                onChange={(e) => setRecipientNationalIdCheck(e.target.value)}
                placeholder="DZ-09812441 / OM-2049182"
                className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1">{isAr ? 'رمز التحقق OTP المسلم للمستلم:' : 'SMS OTP Security Code:'}</label>
              <input
                type="text"
                value={recipientOtp}
                onChange={(e) => setRecipientOtp(e.target.value)}
                className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-mono font-bold text-center text-base tracking-widest text-purple-700"
              />
            </div>

            <button
              type="submit"
              disabled={isDelivering || !deliveryShipmentId}
              className="w-full py-3 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs shadow-md transition-colors cursor-pointer"
            >
              {isDelivering ? (isAr ? 'جارِ التسليم...' : 'Delivering...') : (isAr ? 'إتمام التسليم للعميل وإغلاق الشحنة' : 'Confirm Recipient Delivery')}
            </button>
          </form>
        </div>
      )}

      {/* DETAILED CUSTOMER & ORDER INFORMATION MODAL */}
      {inspectedShipment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-slate-900 text-white border border-slate-800 rounded-3xl p-6 max-w-2xl w-full shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <Box className="w-5 h-5 text-blue-400" />
                  <span>{isAr ? 'بيانات العميل وتفاصيل الأصناف والأسعار' : 'Customer & Order Breakdown'}</span>
                </h3>
                <span className="font-mono text-xs text-blue-400">{inspectedShipment.trackingNumber}</span>
              </div>
              <button
                onClick={() => setInspectedShipment(null)}
                className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Customer & Recipient Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-slate-400 block mb-1">{isAr ? 'بيانات المرسل / صاحب الطلب:' : 'Sender Info:'}</span>
                <p className="font-bold text-white">{inspectedShipment.senderName}</p>
                <p className="font-mono text-slate-300">{inspectedShipment.senderPhone}</p>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-slate-400 block mb-1">{isAr ? 'بيانات المستلم وعنوان التوصيل:' : 'Recipient Info:'}</span>
                <p className="font-bold text-white">{inspectedShipment.recipientName}</p>
                <p className="font-mono text-slate-300">{inspectedShipment.recipientPhone}</p>
                <p className="text-[11px] text-slate-400 mt-1">{inspectedShipment.recipientAddress}</p>
              </div>
            </div>

            {/* Items Breakdown */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wide">
                {isAr ? 'جدول الأصناف والكميات والأسعار:' : 'Items, Quantities & Prices:'}
              </h4>
              {inspectedShipment.orderItems && inspectedShipment.orderItems.length > 0 ? (
                <div className="overflow-x-auto rounded-xl border border-slate-800">
                  <table className="w-full text-xs text-start">
                    <thead className="bg-slate-800 text-slate-400 text-[11px]">
                      <tr>
                        <th className="p-2.5 text-start">{isAr ? 'الصنف' : 'Item'}</th>
                        <th className="p-2.5 text-center">{isAr ? 'الكمية' : 'Qty'}</th>
                        <th className="p-2.5 text-end">{isAr ? 'السعر' : 'Unit Price'}</th>
                        <th className="p-2.5 text-end">{isAr ? 'الإجمالي' : 'Total'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 text-slate-200">
                      {inspectedShipment.orderItems.map((item, idx) => (
                        <tr key={item.id || idx}>
                          <td className="p-2.5 font-semibold text-white">{item.name}</td>
                          <td className="p-2.5 text-center font-bold">{item.quantity}</td>
                          <td className="p-2.5 text-end font-mono">${item.unitPrice}</td>
                          <td className="p-2.5 text-end font-bold text-emerald-400 font-mono">${item.totalCost}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs">
                  <p className="text-white font-semibold">{inspectedShipment.itemDescription}</p>
                  <p className="text-emerald-400 font-bold mt-1">${inspectedShipment.declaredValue} USD</p>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setInspectedShipment(null)}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs cursor-pointer"
              >
                {isAr ? 'إغلاق' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Camera QR Scanner Modal */}
      <QRScannerModal
        isOpen={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onScanSuccess={handleScanSuccess}
        title={
          isAr
            ? 'مسح رمز QR أو الباركود لخدمة العملاء والطرود'
            : 'Scan Customer QR or Barcode'
        }
        locale={locale}
      />

      {/* Manifest QR Pass Modal */}
      <QRModal
        isOpen={!!qrModalToken}
        onClose={() => setQrModalToken('')}
        handoverToken={qrModalToken}
        manifestCode="MAN-8801"
        flightNumber="RJ-511"
        totalWeightKg={2.3}
        packageCount={1}
        locale={locale}
      />

      {/* Advanced Inspection & 360 Photo Modal */}
      <InspectionModal
        isOpen={!!inspectionModalShipment}
        onClose={() => {
          setInspectionModalShipment(null);
          onRefreshData();
        }}
        shipment={inspectionModalShipment}
        hubCode={currentHub.code}
        locale={locale}
        onConfirmInspect={async (payload) => {
          const success = await onInspectShipment({
            ...payload,
            agentId: currentUser.id,
            photoUrls: payload.inspectionPhotos,
          });
          if (success) {
            onRefreshData();
          }
          return success;
        }}
      />
    </div>
  );
};
