import React, { useState } from 'react';
import {
  Plane,
  PlusCircle,
  ShieldCheck,
  QrCode,
  Wallet,
  Lock,
  ArrowDownLeft,
  AlertCircle,
  FileCheck,
  CheckCircle2,
  Calendar,
  Clock,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  AlertTriangle,
} from 'lucide-react';
import { EscrowWallet, Locale, Manifest, Shipment, Trip, User } from '../../types';
import { StatusBadge } from '../common/StatusBadge';
import { QRModal } from '../common/QRModal';
import { TripManager } from './TripManager';
import { InspectionProofModal } from './InspectionProofModal';
import { formatCurrency, generateCryptographicHandoverToken } from '../../lib/crypto';
import { HUBS_DATA } from '../../lib/constants';

interface TravelerPortalProps {
  currentUser: User;
  wallet: EscrowWallet | null;
  trips: Trip[];
  manifests: Manifest[];
  shipments?: Shipment[];
  locale: Locale;
  onRefreshData: () => void;
  onRegisterTrip: (payload: any) => Promise<boolean>;
  onLockEscrow: (tripId: string) => Promise<boolean>;
  onWithdrawEarnings: (amount: number, payoutMethod: string) => Promise<boolean>;
  onEmergencyUnassign: (tripId: string, reason: string) => Promise<boolean>;
}

export const TravelerPortal: React.FC<TravelerPortalProps> = ({
  currentUser,
  wallet,
  trips,
  manifests,
  shipments = [],
  locale,
  onRefreshData,
  onRegisterTrip,
  onLockEscrow,
  onWithdrawEarnings,
  onEmergencyUnassign,
}) => {
  const isAr = locale === 'ar';
  const ArrowIcon = isAr ? ArrowLeft : ArrowRight;

    const [activeTripId, setActiveTripId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'MY_TRIPS' | 'NEW_TRIP' | 'WALLET'>('MY_TRIPS');
  const [selectedQRManifest, setSelectedQRManifest] = useState<Manifest | null>(null);
  const [activeHandoverToken, setActiveHandoverToken] = useState<string>('');
  const [selectedShipmentForProof, setSelectedShipmentForProof] = useState<Shipment | null>(null);

  // Register trip form state
  const [originHubId, setOriginHubId] = useState('hub-amm');
  const [destHubId, setDestHubId] = useState('hub-alg');
  const [airline, setAirline] = useState('Royal Jordanian (RJ-511)');
  const [flightNumber, setFlightNumber] = useState('RJ511');
  const [pnrCode, setPNRCode] = useState('RJ892B');
  const [availableWeightKg, setAvailableWeightKg] = useState(15.0);
  const [isSubmittingTrip, setIsSubmittingTrip] = useState(false);

  // Withdraw state
  const [withdrawAmount, setWithdrawAmount] = useState(150);
  const [payoutMethod, setPayoutMethod] = useState('IBAN Bank Transfer (Arab Bank)');
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  // Emergency dialog
  const [emergencyTripId, setEmergencyTripId] = useState<string | null>(null);
  const [emergencyReason, setEmergencyReason] = useState('Flight cancelled by airline due to weather');

  const travelerTrips = trips.filter((t) => t.travelerId === currentUser.id);

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingTrip(true);
    const success = await onRegisterTrip({
      travelerId: currentUser.id,
      travelerName: currentUser.fullName,
      travelerPhone: currentUser.phone,
      originHubId,
      destinationHubId: destHubId,
      airline,
      flightNumber,
      pnrCode,
      availableWeightKg,
    });
    setIsSubmittingTrip(false);

    if (success) {
      setActiveTab('MY_TRIPS');
      onRefreshData();
    }
  };

  const handleOpenQR = (trip: Trip) => {
    const manifest = manifests.find((m) => m.tripId === trip.id);
    const token = manifest
      ? manifest.handoverQrSecret
      : generateCryptographicHandoverToken({
          manifestId: `man-trip-${trip.id}`,
          travelerId: trip.travelerId,
          agentId: 'usr-agent-303',
          totalWeightKg: trip.allocatedWeightKg || 2.3,
          packageCount: 1,
          timestamp: new Date().toISOString(),
        });

    setSelectedQRManifest(manifest || null);
    setActiveHandoverToken(token);
  };

  const handleWithdrawSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsWithdrawing(true);
    const success = await onWithdrawEarnings(withdrawAmount, payoutMethod);
    setIsWithdrawing(false);
    if (success) {
      alert(isAr ? 'تم تحويل الأرباح بنجاح إلى حسابك المصرفي!' : 'Payout processed successfully!');
      onRefreshData();
    }
  };

  const handleEmergencyConfirm = async () => {
    if (!emergencyTripId) return;
    await onEmergencyUnassign(emergencyTripId, emergencyReason);
    setEmergencyTripId(null);
    onRefreshData();
  };

  return (
    <div className="space-y-6" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Top Header & Tab Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Plane className="w-5 h-5 text-teal-600" />
              <span>{isAr ? 'بوابة المسافر المعتمد والضمان المالي' : 'Traveler Portal & Escrow Manager'}</span>
            </h2>
            <span className="text-xs bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded-full border border-emerald-200">
              KYC {currentUser.kycStatus}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {isAr
              ? 'استثمر وزن أمتعتك المتاح في رحلاتك الجوية واكسب دخلاً مؤمناً مع منصة ثويسا'
              : 'Monetize your unused flight luggage capacity with 100% refundable escrow safety'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('MY_TRIPS')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${
              activeTab === 'MY_TRIPS'
                ? 'bg-teal-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {isAr ? 'رحلاتي المجدولة' : 'My Flights'} ({travelerTrips.length})
          </button>
          <button
            onClick={() => setActiveTab('NEW_TRIP')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${
              activeTab === 'NEW_TRIP'
                ? 'bg-teal-600 text-white shadow-xs'
                : 'bg-slate-900 text-white hover:bg-slate-800'
            }`}
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>{isAr ? 'تسجيل رحلة طيران' : 'Register Flight'}</span>
          </button>
          <button
            onClick={() => setActiveTab('WALLET')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${
              activeTab === 'WALLET'
                ? 'bg-teal-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Wallet className="w-3.5 h-3.5 text-teal-600" />
            <span>{isAr ? 'محفظة الأرباح والضمان' : 'Earnings & Escrow'}</span>
          </button>
        </div>
      </div>

      {/* Escrow Guarantee Explainer Strip */}
      <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-slate-900 text-white p-5 rounded-2xl border border-emerald-800/40 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-emerald-300">
              {isAr ? 'كيف يعمل الضمان المالي المسترد (Escrow) للمسافر؟' : 'How Traveler Refundable Escrow Works'}
            </h4>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed mt-0.5">
              {isAr
                ? 'لحماية أمان الشحنات، يتم حجز مبلغ تأمين مالي مسترد قبل استلام الطرود من الفرع. بمجرد تسليمك الطرود لمركز فرع الوجهة ومطابقة الأختام، يفك حجز التأمين تلقائياً ويحول ربحك فوراً.'
                : 'A refundable escrow deposit is locked to safeguard cargo. Once you deliver packages to the destination hub, the escrow is instantly unlocked and your earnings credited.'}
            </p>
          </div>
        </div>
      </div>

      {/* TAB 1: MY TRIPS */}
      {activeTab === 'MY_TRIPS' && activeTripId && (() => {
        const trip = travelerTrips.find(t => t.id === activeTripId);
        if (!trip) return null;
        return (
          <TripManager 
            trip={trip}
            manifests={manifests}
            shipments={shipments}
            locale={locale}
            onBack={() => setActiveTripId(null)}
            onLockEscrow={onLockEscrow}
            onEmergencyUnassign={onEmergencyUnassign}
            onOpenQR={handleOpenQR}
            onViewInspection={(s) => setSelectedShipmentForProof(s)}
          />
        );
      })()}
      {activeTab === 'MY_TRIPS' && !activeTripId && (
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            {isAr ? 'قائمة رحلات الطيران وسعات الأمتعة المسجلة' : 'Registered Flights & Allocated Luggage'}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {travelerTrips.map((trip) => {
              const originHub = HUBS_DATA.find((h) => h.id === trip.originHubId);
              const destHub = HUBS_DATA.find((h) => h.id === trip.destinationHubId);

              return (
                <div
                  key={trip.id}
                  className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4 relative"
                >
                  {/* Route & Status */}
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div>
                      <div className="flex items-center gap-1.5 font-bold text-sm text-slate-900">
                        <span>{originHub?.countryCode || 'JOR'}</span>
                        <span>➔</span>
                        <span>{destHub?.countryCode || 'DZA'}</span>
                        <span className="text-xs text-slate-400 font-normal">
                          ({originHub ? (isAr ? originHub.cityAr : originHub.cityEn) : ''} ➔{' '}
                          {destHub ? (isAr ? destHub.cityAr : destHub.cityEn) : ''})
                        </span>
                      </div>
                      <p className="text-xs text-brand-500 font-semibold mt-0.5 flex items-center gap-1">
                        <Plane className="w-3 h-3" />
                        {trip.airline} ({trip.flightNumber}) • PNR: {trip.pnrCode}
                      </p>
                    </div>
                    <StatusBadge status={trip.status} locale={locale} size="sm" />
                  </div>

                  {/* Weight, Earnings & Escrow */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 bg-slate-50 p-3 rounded-xl text-xs text-slate-700">
                    <div>
                      <span className="text-slate-400 block text-[11px]">{isAr ? 'السعة المتاحة' : 'Capacity'}</span>
                      <span className="font-bold text-slate-900">{trip.availableWeightKg} كغم</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">{isAr ? 'الأرباح المقدرة' : 'Earnings'}</span>
                      <span className="font-bold text-teal-600">{formatCurrency(trip.totalEarningsEstimated, 'USD')}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">{isAr ? 'مبلغ التأمين' : 'Escrow Hold'}</span>
                      <span className="font-bold text-amber-600">{formatCurrency(trip.requiredEscrowDeposit, 'USD')}</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100 mt-2">
                    <button
                      onClick={() => setActiveTripId(trip.id)}
                      className="w-full flex items-center justify-center gap-1.5 px-4 py-3 bg-teal-50 hover:bg-teal-100 text-teal-700 text-xs font-bold rounded-xl transition-colors cursor-pointer border border-teal-200"
                    >
                      <Plane className="w-4 h-4" />
                      <span>{isAr ? 'إدارة الرحلة والمستندات' : 'Manage Trip & Documents'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: REGISTER FLIGHT TRIP */}
      {activeTab === 'NEW_TRIP' && (
        <div className="bg-white rounded-2xl p-6 md:p-8 border border-slate-200 shadow-sm max-w-2xl mx-auto space-y-5">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-200">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Plane className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {isAr ? 'تسجيل رحلة طيران جديدة وتخصيص وزن الأمتعة' : 'Register New Flight Trip'}
              </h3>
              <p className="text-xs text-slate-500">
                {isAr ? 'سيتم التحقق من تذكرة الطيران PNR آلياً مع شركات الطيران المعتمدة' : 'Instant PNR airline verification & capacity allocation'}
              </p>
            </div>
          </div>

          <form onSubmit={handleRegisterSubmit} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold mb-1">{isAr ? 'مركز المغادرة (Origin Hub)' : 'Origin Hub'}</label>
                <select
                  value={originHubId}
                  onChange={(e) => setOriginHubId(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                >
                  {HUBS_DATA.map((h) => (
                    <option key={h.id} value={h.id}>
                      {isAr ? h.nameAr : h.nameEn} ({h.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1">{isAr ? 'مركز وجهة الوصول (Destination Hub)' : 'Destination Hub'}</label>
                <select
                  value={destHubId}
                  onChange={(e) => setDestHubId(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                >
                  {HUBS_DATA.map((h) => (
                    <option key={h.id} value={h.id}>
                      {isAr ? h.nameAr : h.nameEn} ({h.code})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold mb-1">{isAr ? 'شركة الطيران' : 'Airline'}</label>
                <input
                  type="text"
                  value={airline}
                  onChange={(e) => setAirline(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">{isAr ? 'رقم الرحلة' : 'Flight Number'}</label>
                <input
                  type="text"
                  value={flightNumber}
                  onChange={(e) => setFlightNumber(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">{isAr ? 'رمز الحجز (PNR)' : 'PNR Booking Code'}</label>
                <input
                  type="text"
                  value={pnrCode}
                  onChange={(e) => setPNRCode(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-brand-600"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="font-semibold">{isAr ? 'سعة الوزن المتاحة للأمتعة (كغم)' : 'Available Luggage Weight (kg)'}</label>
                <span className="font-bold text-teal-600 bg-emerald-50 px-2 py-0.5 rounded-md">{availableWeightKg} كغم</span>
              </div>
              <input
                type="range"
                min="2"
                max="30"
                step="1"
                value={availableWeightKg}
                onChange={(e) => setAvailableWeightKg(Number(e.target.value))}
                className="w-full accent-teal-600"
              />
            </div>

            <div className="p-3 bg-brand-50 border border-brand-200 rounded-xl text-brand-900 flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-brand-600 shrink-0" />
              <span>
                {isAr
                  ? `أرباحك التقديرية لهذه الرحلة: $${(availableWeightKg * 12.0).toFixed(2)} (تحول لمحفظتك فور التسليم).`
                  : `Estimated payout for this flight: $${(availableWeightKg * 12.0).toFixed(2)}`}
              </span>
            </div>

            <button
              type="submit"
              disabled={isSubmittingTrip}
              className="w-full py-3 bg-teal-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs shadow-md transition-colors"
            >
              {isSubmittingTrip ? (isAr ? 'جارِ التحقق من PNR...' : 'Verifying PNR...') : isAr ? 'توثيق التذكرة وحفظ الرحلة' : 'Register Flight'}
            </button>
          </form>
        </div>
      )}

      {/* TAB 3: WALLET & EARNINGS PAYOUT */}
      {activeTab === 'WALLET' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Wallet Overview Card */}
          <div className="bg-slate-900 text-white p-6 rounded-2xl border border-slate-800 space-y-6">
            <div>
              <span className="text-xs text-slate-400 block">{isAr ? 'إجمالي الرصيد المتاح للسحب' : 'Available Wallet Balance'}</span>
              <div className="text-3xl font-black text-emerald-400 mt-1">
                {wallet ? formatCurrency(wallet.balance, wallet.currency) : '$0.00'}
              </div>
            </div>

            <div className="space-y-3 pt-4 border-t border-slate-800 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">{isAr ? 'الضمان المالي المحجوز (Escrow):' : 'Locked Escrow Hold:'}</span>
                <span className="font-bold text-amber-400">
                  {wallet ? formatCurrency(wallet.lockedEscrowDeposit, 'USD') : '$0.00'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">{isAr ? 'أرباح معلقة قيد الرحلة:' : 'Pending Trip Earnings:'}</span>
                <span className="font-bold text-brand-300">
                  {wallet ? formatCurrency(wallet.pendingEarnings, 'USD') : '$0.00'}
                </span>
              </div>
            </div>

            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-[11px] text-emerald-300">
              {isAr
                ? 'يفك حجز الضمان المالي آلياً فور مسح رمز الاستلام في فرع وجهة الوصول.'
                : 'Escrow holds are automatically returned to your available balance upon destination hub scan.'}
            </div>
          </div>

          {/* Instant Payout Form */}
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900">{isAr ? 'طلب سحب فوري للأرباح' : 'Request Instant Payout'}</h3>

            <form onSubmit={handleWithdrawSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold mb-1">{isAr ? 'المبلغ المطلوب سحبه ($)' : 'Amount to Withdraw ($)'}</label>
                <input
                  type="number"
                  min="10"
                  max={wallet?.balance || 500}
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(Number(e.target.value))}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">{isAr ? 'طريقة التحويل البنكي / المحفظة' : 'Payout Destination'}</label>
                <select
                  value={payoutMethod}
                  onChange={(e) => setPayoutMethod(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                >
                  <option value="IBAN Bank Transfer (Arab Bank Jordan)">{isAr ? 'تحويل بنكي IBAN (البنك العربي - الأردن)' : 'IBAN (Arab Bank Jordan)'}</option>
                  <option value="CCP Algerian Post (Algérie Poste)">{isAr ? 'حساب بريد الجزائر (CCP Algérie Poste)' : 'CCP (Algérie Poste)'}</option>
                  <option value="InstaPay Egypt">{isAr ? 'شبكة إنستاباي مصر (InstaPay Egypt)' : 'InstaPay Egypt'}</option>
                  <option value="STC Pay Saudi Arabia">{isAr ? 'محفظة STC Pay السعودية' : 'STC Pay Saudi Arabia'}</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={isWithdrawing || (wallet && wallet.balance < withdrawAmount)}
                className="w-full py-3 bg-teal-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs transition-colors shadow-xs"
              >
                {isWithdrawing ? (isAr ? 'جارِ التحويل...' : 'Processing...') : isAr ? 'تأكيد تحويل الأرباح الآن' : 'Execute Instant Payout'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Handover QR Modal */}
      <QRModal
        isOpen={!!activeHandoverToken}
        onClose={() => setActiveHandoverToken('')}
        title={isAr ? 'رمز تسليم/استلام الطرود المشفر (HMAC QR)' : 'Mutual Chain-of-Custody QR Pass'}
        handoverToken={activeHandoverToken}
        manifestCode={selectedQRManifest?.manifestCode}
        flightNumber="RJ-511"
        totalWeightKg={selectedQRManifest?.totalWeightKg || 2.3}
        packageCount={selectedQRManifest?.totalPackages || 1}
        locale={locale}
      />

      {/* Emergency Unassign Modal */}
      {emergencyTripId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 text-xs space-y-4">
            <div className="flex items-center gap-2 text-rose-600 font-bold text-sm">
              <AlertTriangle className="w-5 h-5" />
              <span>{isAr ? 'إلغاء طارئ للرحلة وإعادة جدولة الطرود' : 'Flight Emergency & Auto-Reroute'}</span>
            </div>
            <p className="text-slate-600 leading-relaxed">
              {isAr
                ? 'في حال إلغاء الرحلة من شركة الطيران أو طارئ قاهر، سيقوم النظام تلقائياً بفك حجز ضمانك المالي وإعادة الطرود لطابور الفرع دون أي غرامة.'
                : 'In case of airline cancellation, the system will release your escrow hold with zero penalty and re-queue packages.'}
            </p>

            <div>
              <label className="block font-semibold mb-1">{isAr ? 'سبب الإلغاء الطارئ:' : 'Emergency Reason:'}</label>
              <input
                type="text"
                value={emergencyReason}
                onChange={(e) => setEmergencyReason(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setEmergencyTripId(null)}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-medium"
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                onClick={handleEmergencyConfirm}
                className="px-4 py-2 bg-rose-600 text-white rounded-xl font-bold hover:bg-rose-700"
              >
                {isAr ? 'تأكيد الإلغاء الطارئ' : 'Confirm Emergency'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Inspection Proof & Seals Modal */}
      <InspectionProofModal
        isOpen={!!selectedShipmentForProof}
        onClose={() => setSelectedShipmentForProof(null)}
        shipment={selectedShipmentForProof}
        locale={locale}
      />
    </div>
  );
};
