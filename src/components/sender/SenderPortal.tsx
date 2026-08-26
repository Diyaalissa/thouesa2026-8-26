import React, { useState } from 'react';
import {
  Box,
  PlusCircle,
  Clock,
  ShieldCheck,
  Plane,
  AlertTriangle,
  FileText,
  MessageSquare,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ExternalLink,
  Upload,
  ArrowRight,
  ArrowLeft,
  Lock,
  Globe2,
  ShoppingBag,
  PackagePlus,
  DollarSign,
  Tag,
  ListOrdered,
  Store,
  Layers,
  MapPin,
  FileCheck,
} from 'lucide-react';
import { ItemCategory, Locale, OrderItem, ServiceType, Shipment, User } from '../../types';
import { StatusBadge } from '../common/StatusBadge';
import { WaybillModal } from '../common/WaybillModal';
import { AgentChatModal } from '../common/AgentChatModal';
import { ComplianceModal } from '../legal/ComplianceModal';
import { formatCurrency } from '../../lib/crypto';
import { HUBS_DATA } from '../../lib/constants';

interface SenderPortalProps {
  currentUser: User;
  shipments: Shipment[];
  locale: Locale;
  onRefreshShipments: () => void;
  onCreateShipment: (payload: any) => Promise<boolean>;
  onApproveWeightDiscrepancy: (shipmentId: string, action: 'APPROVE' | 'REJECT') => Promise<void>;
}

export const SenderPortal: React.FC<SenderPortalProps> = ({
  currentUser,
  shipments,
  locale,
  onRefreshShipments,
  onCreateShipment,
  onApproveWeightDiscrepancy,
}) => {
  const isAr = locale === 'ar';
  const ArrowIcon = isAr ? ArrowLeft : ArrowRight;

  const [activeTab, setActiveTab] = useState<
    'MY_SHIPMENTS' | 'SEND_PARCEL' | 'INTERNATIONAL_BUY' | 'SPECIFIC_COUNTRY_BUY'
  >('MY_SHIPMENTS');

  const [selectedServiceFilter, setSelectedServiceFilter] = useState<ServiceType | 'ALL'>('ALL');
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(shipments[0] || null);
  const [waybillModalShipment, setWaybillModalShipment] = useState<Shipment | null>(null);
  const [chatModalOpen, setChatModalOpen] = useState(false);
  const [complianceModalOpen, setComplianceModalOpen] = useState(false);
  const [complianceInitialTab, setComplianceInitialTab] = useState<'TERMS' | 'CUSTOMS' | 'PROHIBITED'>('CUSTOMS');

  // Payment Gateway selection state
  const [selectedPaymentGateway, setSelectedPaymentGateway] = useState<'CLIQ_JOR' | 'EDAHABIA_DZA' | 'CIB_DZA' | 'ESCROW_WALLET' | 'STRIPE_CARD'>('CLIQ_JOR');

  // Common Recipient State
  const [originHubId, setOriginHubId] = useState('hub-amm');
  const [destHubId, setDestHubId] = useState('hub-alg');
  const [recipientName, setRecipientName] = useState(currentUser.fullName || 'أمين بلحاج');
  const [recipientPhone, setRecipientPhone] = useState(currentUser.phone || '+213 77 441 9922');
  const [recipientAddress, setRecipientAddress] = useState('حي حيدرة، نهج الإخوة بوعدو، الجزائر العاصمة');
  const [recipientNationalId, setRecipientNationalId] = useState('DZ-09812441');

  // Option 1: Send Personal Parcel State
  const [parcelCategory, setParcelCategory] = useState<ItemCategory>('ELECTRONICS');
  const [parcelPurpose, setParcelPurpose] = useState('استخدام شخصي / هدية عائلية');
  const [parcelDescription, setParcelDescription] = useState('جهاز لوحي وحافظة إلكترونية وملحقاتها');
  const [parcelDeclaredValue, setParcelDeclaredValue] = useState(400);
  const [parcelEstimatedWeightKg, setParcelEstimatedWeightKg] = useState(2.0);
  const [parcelLengthCm, setParcelLengthCm] = useState(25);
  const [parcelWidthCm, setParcelWidthCm] = useState(20);
  const [parcelHeightCm, setParcelHeightCm] = useState(8);
  const [prohibitedAgreed, setProhibitedAgreed] = useState(false);

  // Option 2: Buy from International Stores State
  const [storeName, setStoreName] = useState('Amazon USA');
  const [storeProductUrl, setStoreProductUrl] = useState('https://www.amazon.com/dp/B09V3HN1KC');
  const [storeItems, setStoreItems] = useState<OrderItem[]>([
    {
      id: 'item-1',
      name: 'Sony WH-1000XM5 Wireless Headphones',
      quantity: 1,
      unitPrice: 348.0,
      totalCost: 348.0,
      storeUrl: 'https://www.amazon.com/dp/B09V3HN1KC',
      specsOrVariants: 'Color: Silver, Noise Canceling',
    },
  ]);

  // Option 3: Buy from Specific Country State
  const [targetCountry, setTargetCountry] = useState('JOR');
  const [localMarketName, setLocalMarketName] = useState('سوق وسط البلد التراثي (عمان)');
  const [countryBuyItems, setCountryBuyItems] = useState<OrderItem[]>([
    {
      id: 'c-item-1',
      name: 'زعتر أردني بلدي فاخر + زيت زيتون بكر عجلوني',
      quantity: 2,
      unitPrice: 35.0,
      totalCost: 70.0,
      sourceCountry: 'JOR',
      specsOrVariants: 'عبوة زجاجية 1 لتر محكمة الإغلاق',
    },
  ]);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter sender's shipments
  const senderShipments = shipments
    .filter((s) => s.senderId === currentUser.id || s.recipientPhone === currentUser.phone)
    .filter((s) => selectedServiceFilter === 'ALL' || (s.serviceType || 'SEND_PARCEL') === selectedServiceFilter);

  // Submit Handler for Option 1: Send Personal Parcel
  const handleSendParcelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prohibitedAgreed) {
      alert(isAr ? 'يرجى الموافقة على إقرار المواد المصرح بها للمتابعة' : 'Please agree to the Safety Declaration');
      return;
    }

    setIsSubmitting(true);
    const success = await onCreateShipment({
      serviceType: 'SEND_PARCEL',
      senderId: currentUser.id,
      senderName: currentUser.fullName,
      senderPhone: currentUser.phone,
      originHubId,
      destinationHubId: destHubId,
      recipientName,
      recipientPhone,
      recipientAddress,
      recipientNationalId,
      itemCategory: parcelCategory,
      itemDescription: parcelDescription,
      purpose: parcelPurpose,
      declaredValue: parcelDeclaredValue,
      estimatedWeightKg: parcelEstimatedWeightKg,
      dimensionsCm: { length: parcelLengthCm, width: parcelWidthCm, height: parcelHeightCm },
      prohibitedItemsAgreed: prohibitedAgreed,
      senderLegalWaiverSigned: true,
      paymentGateway: selectedPaymentGateway,
      lockedExchangeRate: originHubId === 'hub-amm' ? 0.709 : 220.0,
      orderItems: [
        {
          id: 'item-parcel-1',
          name: parcelDescription,
          quantity: 1,
          unitPrice: parcelDeclaredValue,
          totalCost: parcelDeclaredValue,
          itemCategory: parcelCategory,
        },
      ],
    });
    setIsSubmitting(false);

    if (success) {
      setActiveTab('MY_SHIPMENTS');
      onRefreshShipments();
    }
  };

  // Submit Handler for Option 2: International Stores
  const handleStoreBuySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const totalItemsCost = storeItems.reduce((sum, item) => sum + item.totalCost, 0);

    setIsSubmitting(true);
    const success = await onCreateShipment({
      serviceType: 'INTERNATIONAL_BUY',
      senderId: currentUser.id,
      senderName: currentUser.fullName,
      senderPhone: currentUser.phone,
      originHubId,
      destinationHubId: destHubId,
      recipientName,
      recipientPhone,
      recipientAddress,
      recipientNationalId,
      itemCategory: 'ELECTRONICS',
      itemDescription: `${storeName}: ${storeItems.map((i) => `${i.quantity}x ${i.name}`).join(', ')}`,
      declaredValue: totalItemsCost,
      estimatedWeightKg: 1.8,
      dimensionsCm: { length: 25, width: 20, height: 10 },
      prohibitedItemsAgreed: true,
      orderItems: storeItems,
    });
    setIsSubmitting(false);

    if (success) {
      setActiveTab('MY_SHIPMENTS');
      onRefreshShipments();
    }
  };

  // Submit Handler for Option 3: Specific Country Buy
  const handleCountryBuySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const totalItemsCost = countryBuyItems.reduce((sum, item) => sum + item.totalCost, 0);

    setIsSubmitting(true);
    const success = await onCreateShipment({
      serviceType: 'SPECIFIC_COUNTRY_BUY',
      senderId: currentUser.id,
      senderName: currentUser.fullName,
      senderPhone: currentUser.phone,
      originHubId,
      destinationHubId: destHubId,
      recipientName,
      recipientPhone,
      recipientAddress,
      recipientNationalId,
      itemCategory: 'GIFTS_COSMETICS',
      itemDescription: `شراء من ${localMarketName}: ${countryBuyItems.map((i) => `${i.quantity}x ${i.name}`).join(', ')}`,
      declaredValue: totalItemsCost,
      estimatedWeightKg: 2.5,
      dimensionsCm: { length: 30, width: 20, height: 15 },
      prohibitedItemsAgreed: true,
      orderItems: countryBuyItems,
    });
    setIsSubmitting(false);

    if (success) {
      setActiveTab('MY_SHIPMENTS');
      onRefreshShipments();
    }
  };

  // Item list helper for Option 2
  const addStoreItem = () => {
    setStoreItems([
      ...storeItems,
      {
        id: `item-${Date.now()}`,
        name: '',
        quantity: 1,
        unitPrice: 50,
        totalCost: 50,
        storeUrl: '',
        specsOrVariants: '',
      },
    ]);
  };

  const updateStoreItem = (index: number, field: keyof OrderItem, val: any) => {
    const updated = [...storeItems];
    const target = { ...updated[index], [field]: val };
    if (field === 'quantity' || field === 'unitPrice') {
      target.totalCost = Number(target.quantity || 1) * Number(target.unitPrice || 0);
    }
    updated[index] = target;
    setStoreItems(updated);
  };

  const removeStoreItem = (index: number) => {
    if (storeItems.length > 1) {
      setStoreItems(storeItems.filter((_, i) => i !== index));
    }
  };

  // Item list helper for Option 3
  const addCountryItem = () => {
    setCountryBuyItems([
      ...countryBuyItems,
      {
        id: `c-item-${Date.now()}`,
        name: '',
        quantity: 1,
        unitPrice: 20,
        totalCost: 20,
        sourceCountry: targetCountry,
        specsOrVariants: '',
      },
    ]);
  };

  const updateCountryItem = (index: number, field: keyof OrderItem, val: any) => {
    const updated = [...countryBuyItems];
    const target = { ...updated[index], [field]: val };
    if (field === 'quantity' || field === 'unitPrice') {
      target.totalCost = Number(target.quantity || 1) * Number(target.unitPrice || 0);
    }
    updated[index] = target;
    setCountryBuyItems(updated);
  };

  const removeCountryItem = (index: number) => {
    if (countryBuyItems.length > 1) {
      setCountryBuyItems(countryBuyItems.filter((_, i) => i !== index));
    }
  };

  return (
    <div className="space-y-6 pb-12" dir={isAr ? 'rtl' : 'ltr'}>
      {/* 1. TOP HEADER & THE THREE CORE OPTIONS CARDS */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl text-white shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 text-xs font-bold">
                {isAr ? 'لوحة تحكم العميل' : 'Client Terminal'}
              </span>
            </div>
            <h2 className="text-2xl font-black mt-1">
              {isAr ? 'مرحباً، ' + currentUser.fullName : 'Welcome, ' + currentUser.fullName}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {isAr
                ? 'اختر إحدى الخدمات الثلاث أدناه لإنشاء طلب جديد، أو تابع تفاصيل وأسعار الطلبات المستلمة والمرسلة.'
                : 'Select one of the 3 services below to place an order, or manage your active received orders.'}
            </p>
          </div>

          <button
            onClick={() => setActiveTab('MY_SHIPMENTS')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'MY_SHIPMENTS'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700'
            }`}
          >
            <ListOrdered className="w-4 h-4" />
            <span>{isAr ? 'قائمة الطلبات والشحنات المستلمة' : 'My Orders & Shipments'}</span>
            <span className="px-2 py-0.5 rounded-full bg-black/30 text-[10px]">{senderShipments.length}</span>
          </button>
        </div>

        {/* 3 Core Selection Options Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          {/* Option 1: Send Package */}
          <button
            type="button"
            onClick={() => setActiveTab('SEND_PARCEL')}
            className={`p-5 rounded-2xl border text-start transition-all cursor-pointer flex flex-col justify-between ${
              activeTab === 'SEND_PARCEL'
                ? 'bg-blue-600/20 border-blue-500 ring-2 ring-blue-500/30'
                : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center">
                  <Box className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">
                  {isAr ? 'الخيار الأول' : 'Option #1'}
                </span>
              </div>
              <h3 className="text-sm font-black text-white mb-1">
                {isAr ? 'إرسال طرد شخصي (أمانات وهدايا)' : 'Send Personal Package'}
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                {isAr
                  ? 'تسليم طردك لأقرب فرع محلي ليتم وزنه وتغليفه بختم أمني مشفر ونقله مع مسافر معتمد.'
                  : 'Drop off personal items at your local hub for physical inspection and traveler dispatch.'}
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-bold text-blue-400">
              <span>{isAr ? 'بدء إرسال طرد' : 'Send Package'}</span>
              <ArrowIcon className="w-3.5 h-3.5" />
            </div>
          </button>

          {/* Option 2: Buy from International Stores */}
          <button
            type="button"
            onClick={() => setActiveTab('INTERNATIONAL_BUY')}
            className={`p-5 rounded-2xl border text-start transition-all cursor-pointer flex flex-col justify-between ${
              activeTab === 'INTERNATIONAL_BUY'
                ? 'bg-indigo-600/20 border-indigo-500 ring-2 ring-indigo-500/30'
                : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
                  <Globe2 className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">
                  {isAr ? 'الخيار الثاني' : 'Option #2'}
                </span>
              </div>
              <h3 className="text-sm font-black text-white mb-1">
                {isAr ? 'الشراء من المتاجر العالمية' : 'Buy from International Stores'}
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                {isAr
                  ? 'شراء المنتجات من Amazon, Apple, AliExpress, eBay وغيرها وشحنها لعنوانك بأمان.'
                  : 'Source products from Amazon, Apple, AliExpress, eBay, etc. with full escrow protection.'}
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-bold text-indigo-400">
              <span>{isAr ? 'طلب شراء من متجر' : 'Order Global Items'}</span>
              <ArrowIcon className="w-3.5 h-3.5" />
            </div>
          </button>

          {/* Option 3: Buy from Specific Country & Ship */}
          <button
            type="button"
            onClick={() => setActiveTab('SPECIFIC_COUNTRY_BUY')}
            className={`p-5 rounded-2xl border text-start transition-all cursor-pointer flex flex-col justify-between ${
              activeTab === 'SPECIFIC_COUNTRY_BUY'
                ? 'bg-emerald-600/20 border-emerald-500 ring-2 ring-emerald-500/30'
                : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                  {isAr ? 'الخيار الثالث' : 'Option #3'}
                </span>
              </div>
              <h3 className="text-sm font-black text-white mb-1">
                {isAr ? 'الشراء من دولة محددة والشحن' : 'Buy from Specific Country & Ship'}
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                {isAr
                  ? 'طلب منتجات محلية متخصصة من أسواق الأردن، الجزائر، مصر، سلطنة عُمان، أو السعودية.'
                  : 'Source specialty regional products from Jordan, Algeria, Egypt, Oman, or Saudi Arabia.'}
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-bold text-emerald-400">
              <span>{isAr ? 'طلب شراء محلي' : 'Source from Country'}</span>
              <ArrowIcon className="w-3.5 h-3.5" />
            </div>
          </button>
        </div>
      </div>

      {/* 2. OPTION 1 WIZARD: SEND PERSONAL PARCEL */}
      {activeTab === 'SEND_PARCEL' && (
        <form onSubmit={handleSendParcelSubmit} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 text-white shadow-xl max-w-4xl mx-auto space-y-6">
          <div className="border-b border-slate-800 pb-4">
            <h3 className="text-lg font-black text-white flex items-center gap-2">
              <Box className="w-5 h-5 text-blue-400" />
              <span>{isAr ? 'الخيار الأول: نموذج إرسال طرد شخصي وأمانات' : 'Option 1: Send Personal Parcel'}</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              {isAr ? 'حدد مسار الشحن ومواصفات الطرد ومعلومات المستلم' : 'Specify route, dimensions, declared value, and recipient'}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">{isAr ? 'مركز الانطلاق (لتسليم الطرد)' : 'Origin Hub'}</label>
              <select
                value={originHubId}
                onChange={(e) => setOriginHubId(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-hidden focus:border-blue-500"
              >
                {HUBS_DATA.map((h) => (
                  <option key={h.id} value={h.id}>
                    {isAr ? h.nameAr : h.nameEn} ({h.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">{isAr ? 'مركز الاستلام في دولة الوجهة' : 'Destination Hub'}</label>
              <select
                value={destHubId}
                onChange={(e) => setDestHubId(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-hidden focus:border-blue-500"
              >
                {HUBS_DATA.map((h) => (
                  <option key={h.id} value={h.id}>
                    {isAr ? h.nameAr : h.nameEn} ({h.code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">{isAr ? 'اسم المستلم الثلاثي' : 'Recipient Name'}</label>
              <input
                type="text"
                required
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">{isAr ? 'هاتف المستلم' : 'Recipient Phone'}</label>
              <input
                type="text"
                required
                value={recipientPhone}
                onChange={(e) => setRecipientPhone(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">{isAr ? 'عنوان المستلم بالتفصيل للتسليم النهائي' : 'Detailed Recipient Address'}</label>
            <input
              type="text"
              required
              value={recipientAddress}
              onChange={(e) => setRecipientAddress(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">{isAr ? 'تصنيف المحتوى' : 'Item Category'}</label>
              <select
                value={parcelCategory}
                onChange={(e) => setParcelCategory(e.target.value as ItemCategory)}
                className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white"
              >
                <option value="ELECTRONICS">{isAr ? 'إلكترونيات وهواتف' : 'Electronics'}</option>
                <option value="DOCUMENTS">{isAr ? 'وثائق ومستندات رسمية' : 'Documents'}</option>
                <option value="CLOTHING_TEXTILES">{isAr ? 'ملابس وأقمشة' : 'Clothing'}</option>
                <option value="MEDICATIONS_PERMITTED">{isAr ? 'أدوية مصرح بها' : 'Medications'}</option>
                <option value="GIFTS_COSMETICS">{isAr ? 'هدايا ومستحضرات' : 'Gifts & Cosmetics'}</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                {isAr ? 'غرض الشحنة / طبيعة الاستخدام' : 'Shipment Purpose'}
              </label>
              <select
                value={parcelPurpose}
                onChange={(e) => setParcelPurpose(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white"
              >
                <option value="استخدام شخصي / هدية عائلية">{isAr ? 'استخدام شخصي / هدية عائلية' : 'Personal Use / Family Gift'}</option>
                <option value="شراء متجر دولي (تجارة شخصية)">{isAr ? 'شراء متجر دولي (تجارة شخصية)' : 'International Purchase'}</option>
                <option value="مستندات وأوراق دراسية أو قانونية">{isAr ? 'مستندات وأوراق دراسية أو قانونية' : 'Academic / Legal Documents'}</option>
                <option value="مستلزمات عمل ومعدات تقنية">{isAr ? 'مستلزمات عمل ومعدات تقنية' : 'Work / Tech Equipment'}</option>
                <option value="علاج ومستلزمات رعاية صحية">{isAr ? 'علاج ومستلزمات رعاية صحية' : 'Healthcare / Medical'}</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">{isAr ? 'القيمة المصرح بها ($ لتحديد الضمان المسترد)' : 'Declared Value ($)'}</label>
              <input
                type="number"
                min="10"
                value={parcelDeclaredValue}
                onChange={(e) => setParcelDeclaredValue(Number(e.target.value))}
                className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs font-bold text-emerald-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">{isAr ? 'الوزن التقديري (كغ)' : 'Estimated Weight (kg)'}</label>
              <input
                type="number"
                step="0.1"
                min="0.2"
                max="25"
                value={parcelEstimatedWeightKg}
                onChange={(e) => setParcelEstimatedWeightKg(Number(e.target.value))}
                className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">{isAr ? 'وصف تفصيلي لمحتويات الطرد' : 'Detailed Item Description'}</label>
            <textarea
              rows={2}
              value={parcelDescription}
              onChange={(e) => setParcelDescription(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white"
            />
          </div>

          {/* Local Payment Gateway & Currency Exchange Freeze */}
          <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <label className="font-bold text-xs text-slate-200 flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-emerald-400" />
                <span>{isAr ? 'بوابة الدفع المحلية وتثبيت سعر الصرف:' : 'Local Payment Gateway & Locked FX:'}</span>
              </label>
              <span className="text-[11px] text-emerald-400 font-mono font-bold">
                {originHubId === 'hub-amm' ? '1 USD = 0.709 JOD' : '1 USD = 220.00 DZD'}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <button
                type="button"
                onClick={() => setSelectedPaymentGateway('CLIQ_JOR')}
                className={`p-2.5 rounded-xl border text-center font-bold transition-all cursor-pointer ${
                  selectedPaymentGateway === 'CLIQ_JOR'
                    ? 'bg-blue-600/30 border-blue-500 text-white ring-1 ring-blue-500'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800'
                }`}
              >
                <span>🇯🇴 CliQ Jordan</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedPaymentGateway('EDAHABIA_DZA')}
                className={`p-2.5 rounded-xl border text-center font-bold transition-all cursor-pointer ${
                  selectedPaymentGateway === 'EDAHABIA_DZA'
                    ? 'bg-amber-600/30 border-amber-500 text-white ring-1 ring-amber-500'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800'
                }`}
              >
                <span>🇩🇿 بريدي موب / الذهبية</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedPaymentGateway('CIB_DZA')}
                className={`p-2.5 rounded-xl border text-center font-bold transition-all cursor-pointer ${
                  selectedPaymentGateway === 'CIB_DZA'
                    ? 'bg-emerald-600/30 border-emerald-500 text-white ring-1 ring-emerald-500'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800'
                }`}
              >
                <span>🇩🇿 بطاقة CIB البنكية</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedPaymentGateway('ESCROW_WALLET')}
                className={`p-2.5 rounded-xl border text-center font-bold transition-all cursor-pointer ${
                  selectedPaymentGateway === 'ESCROW_WALLET'
                    ? 'bg-purple-600/30 border-purple-500 text-white ring-1 ring-purple-500'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800'
                }`}
              >
                <span>🛡️ محفظة الضمان</span>
              </button>
            </div>
          </div>

          {/* Safety & Legal Customs Declaration */}
          <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-2">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={prohibitedAgreed}
                onChange={(e) => setProhibitedAgreed(e.target.checked)}
                className="mt-0.5 w-4 h-4 text-blue-600 rounded-sm"
              />
              <span className="text-xs text-slate-300 leading-relaxed">
                {isAr
                  ? 'أقر وأتعهد بأن هذا الطرد خاضع للمعاينة والفحص المباشر في مركز الفرع قبل التغليف بالختم الأمني، وخالٍ تماماً من أي مواد ممنوعة أو خطرة.'
                  : 'I certify that this package is subject to certified physical hub screening and contains no hazardous or prohibited materials.'}
              </span>
            </label>
            <div className="flex items-center gap-3 pt-1 text-[11px] text-blue-400">
              <button
                type="button"
                onClick={() => {
                  setComplianceInitialTab('CUSTOMS');
                  setComplianceModalOpen(true);
                }}
                className="hover:underline flex items-center gap-1 cursor-pointer"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>{isAr ? 'الإقرار الجمركي المعتمد' : 'Customs Declaration'}</span>
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={() => {
                  setComplianceInitialTab('PROHIBITED');
                  setComplianceModalOpen(true);
                }}
                className="hover:underline flex items-center gap-1 text-red-400 cursor-pointer"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>{isAr ? 'المواد المحظورة دولياً' : 'Prohibited Items'}</span>
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={() => {
                  setComplianceInitialTab('TERMS');
                  setComplianceModalOpen(true);
                }}
                className="hover:underline flex items-center gap-1 text-emerald-400 cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>{isAr ? 'شروط الضمان المالي' : 'Escrow Terms'}</span>
              </button>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setActiveTab('MY_SHIPMENTS')}
              className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold"
            >
              {isAr ? 'إلغاء' : 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-blue-600/30 cursor-pointer disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isSubmitting ? (isAr ? 'جاري الإنشاء...' : 'Creating...') : (isAr ? 'إنشاء وإصدار بوليصة الطرد' : 'Create & Issue Waybill')}</span>
            </button>
          </div>
        </form>
      )}

      {/* 3. OPTION 2 WIZARD: BUY FROM INTERNATIONAL STORES */}
      {activeTab === 'INTERNATIONAL_BUY' && (
        <form onSubmit={handleStoreBuySubmit} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 text-white shadow-xl max-w-4xl mx-auto space-y-6">
          <div className="border-b border-slate-800 pb-4">
            <h3 className="text-lg font-black text-white flex items-center gap-2">
              <Globe2 className="w-5 h-5 text-indigo-400" />
              <span>{isAr ? 'الخيار الثاني: الشراء من المتاجر العالمية (Amazon, Apple, eBay...)' : 'Option 2: Buy from Global Stores'}</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              {isAr
                ? 'أدخل روابط المنتجات والمتاجر، وسيتولى فريقنا أو مسافر معتمد استلامها وشحنها لعنوانك'
                : 'Enter global store links, quantities, and item specifications'}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">{isAr ? 'المتجر العالمي المصدر' : 'Global Store'}</label>
              <select
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white"
              >
                <option value="Amazon USA">Amazon (USA / Europe)</option>
                <option value="Apple Store">Apple Official Store</option>
                <option value="AliExpress">AliExpress Official</option>
                <option value="eBay Global">eBay Global</option>
                <option value="ASOS Fashion">ASOS / Zara / Shein</option>
                <option value="Other International Store">متجر عالمي آخر</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">{isAr ? 'مركز الاستلام والتوصيل' : 'Delivery Destination Hub'}</label>
              <select
                value={destHubId}
                onChange={(e) => setDestHubId(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white"
              >
                {HUBS_DATA.map((h) => (
                  <option key={h.id} value={h.id}>
                    {isAr ? h.nameAr : h.nameEn} ({h.code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Items Table / Form */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-indigo-400 uppercase tracking-wide">
                {isAr ? 'المنتجات والكميات والأسعار المطلوبة:' : 'Requested Items, Quantities & Prices:'}
              </label>
              <button
                type="button"
                onClick={addStoreItem}
                className="flex items-center gap-1 text-xs font-bold text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 px-3 py-1 rounded-lg border border-indigo-500/30 cursor-pointer"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>{isAr ? 'إضافة منتج آخر' : 'Add Item'}</span>
              </button>
            </div>

            {storeItems.map((item, idx) => (
              <div key={item.id} className="p-4 bg-slate-950/70 border border-slate-800 rounded-2xl space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                  <span>{isAr ? `المنتج رقم ${idx + 1}` : `Item #${idx + 1}`}</span>
                  {storeItems.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeStoreItem(idx)}
                      className="text-red-400 hover:text-red-300 text-[11px]"
                    >
                      {isAr ? 'حذف' : 'Remove'}
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <input
                      type="text"
                      required
                      value={item.name}
                      onChange={(e) => updateStoreItem(idx, 'name', e.target.value)}
                      placeholder={isAr ? 'اسم المنتج بالتفصيل (مثل: سماعات Sony XM5)' : 'Item name / model'}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white"
                    />
                  </div>
                  <div>
                    <input
                      type="url"
                      value={item.storeUrl || ''}
                      onChange={(e) => updateStoreItem(idx, 'storeUrl', e.target.value)}
                      placeholder={isAr ? 'رابط صفحة المنتج (URL)' : 'Product URL'}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">{isAr ? 'الكمية' : 'Qty'}</label>
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => updateStoreItem(idx, 'quantity', Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-center font-bold text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">{isAr ? 'سعر الوحدة ($)' : 'Unit Price ($)'}</label>
                    <input
                      type="number"
                      min="1"
                      step="0.5"
                      value={item.unitPrice}
                      onChange={(e) => updateStoreItem(idx, 'unitPrice', Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-center font-bold text-emerald-400"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">{isAr ? 'الإجمالي ($)' : 'Total ($)'}</label>
                    <div className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-center font-black text-emerald-400">
                      ${item.totalCost.toFixed(2)}
                    </div>
                  </div>
                </div>

                <div>
                  <input
                    type="text"
                    value={item.specsOrVariants || ''}
                    onChange={(e) => updateStoreItem(idx, 'specsOrVariants', e.target.value)}
                    placeholder={isAr ? 'المقاس / اللون / الملاحظات الخاصة (مثال: لون أسود، مقاس 42)' : 'Size, Color, Specs'}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white"
                  />
                </div>
              </div>
            ))}

            {/* Total Cost Banner */}
            <div className="p-4 bg-indigo-950/40 border border-indigo-500/30 rounded-2xl flex items-center justify-between text-xs">
              <span className="font-bold text-indigo-200">
                {isAr ? 'إجمالي قيمة المشتريات المصرح بها:' : 'Total Items Declared Cost:'}
              </span>
              <span className="text-base font-black text-emerald-400">
                ${storeItems.reduce((sum, item) => sum + item.totalCost, 0).toFixed(2)} USD
              </span>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setActiveTab('MY_SHIPMENTS')}
              className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold"
            >
              {isAr ? 'إلغاء' : 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-indigo-600/30 cursor-pointer disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isSubmitting ? (isAr ? 'جاري الإرسال...' : 'Submitting...') : (isAr ? 'تأكيد طلب الشراء الدولي' : 'Confirm Global Purchase')}</span>
            </button>
          </div>
        </form>
      )}

      {/* 4. OPTION 3 WIZARD: BUY FROM SPECIFIC COUNTRY & SHIP */}
      {activeTab === 'SPECIFIC_COUNTRY_BUY' && (
        <form onSubmit={handleCountryBuySubmit} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 text-white shadow-xl max-w-4xl mx-auto space-y-6">
          <div className="border-b border-slate-800 pb-4">
            <h3 className="text-lg font-black text-white flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-emerald-400" />
              <span>{isAr ? 'الخيار الثالث: الشراء من دولة محددة والشحن' : 'Option 3: Buy from Specific Country & Ship'}</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              {isAr
                ? 'اطلب منتجات مميزة من أسواق الأردن، الجزائر، مصر، سلطنة عُمان، أو السعودية ويقوم كادرنا أو المسافرون بشرائها وتوصيلها'
                : 'Request regional products from verified local markets & travelers'}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">{isAr ? 'الدولة المستهدفة للشراء' : 'Source Country'}</label>
              <select
                value={targetCountry}
                onChange={(e) => setTargetCountry(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white"
              >
                <option value="JOR">{isAr ? 'الأردن (عمان / أسواق البلد والمنتجات المحلية)' : 'Jordan (Amman)'}</option>
                <option value="DZA">{isAr ? 'الجزائر (الجزائر العاصمة / التمور والمنتجات التراثية)' : 'Algeria (Algiers)'}</option>
                <option value="OMN">{isAr ? 'سلطنة عُمان (مسقط / اللبان والحلوى العمانية والخناجر)' : 'Oman (Muscat)'}</option>
                <option value="EGY">{isAr ? 'مصر (القاهرة / خان الخليلي والمنتجات المصرية)' : 'Egypt (Cairo)'}</option>
                <option value="SAU">{isAr ? 'المملكة العربية السعودية (الرياض)' : 'Saudi Arabia (Riyadh)'}</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">{isAr ? 'السوق أو المتجر المحلي' : 'Market / Merchant Name'}</label>
              <input
                type="text"
                required
                value={localMarketName}
                onChange={(e) => setLocalMarketName(e.target.value)}
                placeholder={isAr ? 'مثال: سوق مطرح (مسقط) / سوق البخارية (عمان)' : 'e.g. Mutrah Souq (Muscat)'}
                className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white"
              />
            </div>
          </div>

          {/* Items Table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-emerald-400 uppercase tracking-wide">
                {isAr ? 'قائمة المنتجات والكميات المطلوبة:' : 'Requested Regional Items & Quantities:'}
              </label>
              <button
                type="button"
                onClick={addCountryItem}
                className="flex items-center gap-1 text-xs font-bold text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 px-3 py-1 rounded-lg border border-emerald-500/30 cursor-pointer"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>{isAr ? 'إضافة منتج آخر' : 'Add Item'}</span>
              </button>
            </div>

            {countryBuyItems.map((item, idx) => (
              <div key={item.id} className="p-4 bg-slate-950/70 border border-slate-800 rounded-2xl space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                  <span>{isAr ? `الطلب رقم ${idx + 1}` : `Item #${idx + 1}`}</span>
                  {countryBuyItems.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeCountryItem(idx)}
                      className="text-red-400 hover:text-red-300 text-[11px]"
                    >
                      {isAr ? 'حذف' : 'Remove'}
                    </button>
                  )}
                </div>

                <div>
                  <input
                    type="text"
                    required
                    value={item.name}
                    onChange={(e) => updateCountryItem(idx, 'name', e.target.value)}
                    placeholder={isAr ? 'اسم المنتج أو الصنف بالتفصيل' : 'Item description'}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">{isAr ? 'الكمية المطلوبة' : 'Quantity'}</label>
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => updateCountryItem(idx, 'quantity', Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-center font-bold text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">{isAr ? 'السعر التقديري للوحدة ($)' : 'Unit Price ($)'}</label>
                    <input
                      type="number"
                      min="1"
                      step="0.5"
                      value={item.unitPrice}
                      onChange={(e) => updateCountryItem(idx, 'unitPrice', Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-center font-bold text-emerald-400"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">{isAr ? 'الإجمالي ($)' : 'Total ($)'}</label>
                    <div className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-center font-black text-emerald-400">
                      ${item.totalCost.toFixed(2)}
                    </div>
                  </div>
                </div>

                <div>
                  <input
                    type="text"
                    value={item.specsOrVariants || ''}
                    onChange={(e) => updateCountryItem(idx, 'specsOrVariants', e.target.value)}
                    placeholder={isAr ? 'ملاحظات التغليف والنوعية' : 'Packaging & Quality notes'}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white"
                  />
                </div>
              </div>
            ))}

            {/* Total Cost Banner */}
            <div className="p-4 bg-emerald-950/40 border border-emerald-500/30 rounded-2xl flex items-center justify-between text-xs">
              <span className="font-bold text-emerald-200">
                {isAr ? 'إجمالي قيمة المشتريات المحلية المقدرة:' : 'Total Estimated Local Sourcing Cost:'}
              </span>
              <span className="text-base font-black text-emerald-400">
                ${countryBuyItems.reduce((sum, item) => sum + item.totalCost, 0).toFixed(2)} USD
              </span>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setActiveTab('MY_SHIPMENTS')}
              className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold"
            >
              {isAr ? 'إلغاء' : 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-emerald-600/30 cursor-pointer disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isSubmitting ? (isAr ? 'جاري الإرسال...' : 'Submitting...') : (isAr ? 'تأكيد طلب الشراء والشحن' : 'Confirm Country Sourcing')}</span>
            </button>
          </div>
        </form>
      )}

      {/* 5. TAB: RECEIVED ORDERS & ACTIVE SHIPMENTS WITH ITEM DETAILS, QUANTITIES & PRICES */}
      {activeTab === 'MY_SHIPMENTS' && (
        <div className="space-y-6">
          {/* Service Filters Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-3.5 rounded-2xl">
            <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
              <span className="text-slate-400 font-semibold me-2 hidden sm:inline">
                {isAr ? 'تصفية حسب نوع الخدمة:' : 'Filter by Service:'}
              </span>
              <button
                onClick={() => setSelectedServiceFilter('ALL')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-colors cursor-pointer ${
                  selectedServiceFilter === 'ALL'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {isAr ? 'جميع الطلبات' : 'All Orders'} ({shipments.length})
              </button>
              <button
                onClick={() => setSelectedServiceFilter('SEND_PARCEL')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-colors cursor-pointer ${
                  selectedServiceFilter === 'SEND_PARCEL'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {isAr ? 'الطرود الشخصية' : 'Personal Parcels'}
              </button>
              <button
                onClick={() => setSelectedServiceFilter('INTERNATIONAL_BUY')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-colors cursor-pointer ${
                  selectedServiceFilter === 'INTERNATIONAL_BUY'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {isAr ? 'المتاجر العالمية' : 'Global Stores'}
              </button>
              <button
                onClick={() => setSelectedServiceFilter('SPECIFIC_COUNTRY_BUY')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-colors cursor-pointer ${
                  selectedServiceFilter === 'SPECIFIC_COUNTRY_BUY'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {isAr ? 'شراء من دولة محددة' : 'Country Sourced'}
              </button>
            </div>
          </div>

          {/* Orders Master-Detail View */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Orders List */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-slate-400">
                <span>{isAr ? 'الطلبات المسجلة' : 'Recorded Orders'}</span>
                <span>{senderShipments.length} {isAr ? 'طلب' : 'orders'}</span>
              </div>

              {senderShipments.length === 0 ? (
                <div className="p-8 bg-slate-900 border border-slate-800 rounded-2xl text-center text-slate-400 text-xs">
                  <Box className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  <p>{isAr ? 'لا توجد طلبات في هذا التصنيف حالياً' : 'No orders found in this category'}</p>
                </div>
              ) : (
                senderShipments.map((s) => {
                  const isSelected = selectedShipment?.id === s.id;
                  return (
                    <div
                      key={s.id}
                      onClick={() => setSelectedShipment(s)}
                      className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-blue-950/60 border-blue-500 ring-2 ring-blue-500/20 shadow-lg'
                          : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-mono font-bold text-xs text-blue-400">{s.trackingNumber}</span>
                        <StatusBadge status={s.currentStatus} locale={locale} size="sm" />
                      </div>

                      <div className="flex items-center gap-1.5 mb-1.5">
                        {s.serviceType === 'INTERNATIONAL_BUY' && (
                          <span className="px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 text-[10px] font-bold">
                            {isAr ? 'متجر عالمي' : 'Global Store'}
                          </span>
                        )}
                        {s.serviceType === 'SPECIFIC_COUNTRY_BUY' && (
                          <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                            {isAr ? 'شراء محلي' : 'Country Buy'}
                          </span>
                        )}
                        {(!s.serviceType || s.serviceType === 'SEND_PARCEL') && (
                          <span className="px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-400 border border-blue-500/30 text-[10px] font-bold">
                            {isAr ? 'طرد شخصي' : 'Parcel'}
                          </span>
                        )}
                      </div>

                      <p className="text-xs font-semibold text-white truncate mb-2">{s.itemDescription}</p>

                      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800">
                        <span>
                          {s.orderItems && s.orderItems.length > 0
                            ? `${s.orderItems.length} ${isAr ? 'أصناف' : 'items'}`
                            : `${s.actualWeightKg || s.estimatedWeightKg} kg`}
                        </span>
                        <span className="font-black text-emerald-400">
                          {formatCurrency(s.declaredValue || s.shippingCost, s.currency)}
                        </span>
                      </div>

                      {s.currentStatus === 'WEIGHT_DISCREPANCY_PENDING' && (
                        <div className="mt-2 p-2 bg-amber-500/15 border border-amber-500/30 text-amber-300 rounded-xl text-[10px] font-bold flex items-center gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          <span>{isAr ? 'مطلوب الموافقة على فرق الوزن' : 'Weight difference approval needed'}</span>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Right: Selected Order Detailed Information, Quantities & Prices */}
            <div className="lg:col-span-2 space-y-4">
              {selectedShipment ? (
                <div className="bg-slate-900 rounded-3xl p-6 border border-slate-800 text-white shadow-xl space-y-6">
                  {/* Order Top Banner */}
                  <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-black font-mono text-white">{selectedShipment.trackingNumber}</h3>
                        <StatusBadge status={selectedShipment.currentStatus} locale={locale} size="sm" />
                      </div>
                      <p className="text-xs text-slate-400 mt-1">
                        {isAr ? 'المستلم:' : 'Recipient:'} <strong className="text-slate-200">{selectedShipment.recipientName}</strong> ({selectedShipment.recipientPhone})
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setWaybillModalShipment(selectedShipment)}
                        className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 transition-colors cursor-pointer"
                      >
                        <FileText className="w-3.5 h-3.5 text-blue-400" />
                        <span>{isAr ? 'عرض البوليصة' : 'Waybill'}</span>
                      </button>
                      <button
                        onClick={() => setChatModalOpen(true)}
                        className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>{isAr ? 'محادثة الفرع' : 'Chat Hub'}</span>
                      </button>
                    </div>
                  </div>

                  {/* ITEM DETAILS, QUANTITIES, AND PRICES TABLE */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                        <Tag className="w-3.5 h-3.5 text-blue-400" />
                        <span>{isAr ? 'تفاصيل المنتجات والكميات والأسعار المسجلة:' : 'Order Items, Quantities & Prices Breakdown:'}</span>
                      </h4>
                    </div>

                    {selectedShipment.orderItems && selectedShipment.orderItems.length > 0 ? (
                      <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950/60">
                        <table className="w-full text-xs text-start">
                          <thead className="bg-slate-800/80 text-slate-400 text-[11px] font-bold border-b border-slate-800">
                            <tr>
                              <th className="p-3 text-start">{isAr ? 'المنتج / الصنف' : 'Item Name'}</th>
                              <th className="p-3 text-center">{isAr ? 'الكمية' : 'Quantity'}</th>
                              <th className="p-3 text-end">{isAr ? 'سعر الوحدة' : 'Unit Price'}</th>
                              <th className="p-3 text-end">{isAr ? 'الإجمالي' : 'Total Price'}</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800/60 text-slate-200">
                            {selectedShipment.orderItems.map((item, idx) => (
                              <tr key={item.id || idx} className="hover:bg-slate-800/30">
                                <td className="p-3">
                                  <div className="font-bold text-white">{item.name}</div>
                                  {item.specsOrVariants && (
                                    <div className="text-[11px] text-slate-400">{item.specsOrVariants}</div>
                                  )}
                                  {item.storeUrl && (
                                    <a
                                      href={item.storeUrl}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="text-[10px] text-blue-400 hover:underline flex items-center gap-1 mt-0.5"
                                    >
                                      <span>{isAr ? 'رابط المتجر' : 'Store Link'}</span>
                                      <ExternalLink className="w-2.5 h-2.5" />
                                    </a>
                                  )}
                                </td>
                                <td className="p-3 text-center font-bold text-white">{item.quantity}</td>
                                <td className="p-3 text-end font-semibold text-slate-300">
                                  {formatCurrency(item.unitPrice, selectedShipment.currency || 'USD')}
                                </td>
                                <td className="p-3 text-end font-black text-emerald-400">
                                  {formatCurrency(item.totalCost, selectedShipment.currency || 'USD')}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot className="bg-slate-900 border-t border-slate-800 font-bold text-xs">
                            <tr>
                              <td colSpan={3} className="p-3 text-end text-slate-300">
                                {isAr ? 'إجمالي قيمة المشتريات المصرح بها (Escrow):' : 'Total Items Declared Value:'}
                              </td>
                              <td className="p-3 text-end text-emerald-400 font-black text-sm">
                                {formatCurrency(selectedShipment.declaredValue, selectedShipment.currency || 'USD')}
                              </td>
                            </tr>
                            <tr>
                              <td colSpan={3} className="p-3 text-end text-slate-300">
                                {isAr ? 'أجرة الشحن والمناولة والفحص بالفرع:' : 'Shipping, Handling & Inspection Fee:'}
                              </td>
                              <td className="p-3 text-end text-blue-400 font-black text-sm">
                                {formatCurrency(selectedShipment.shippingCost, selectedShipment.currency || 'USD')}
                              </td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    ) : (
                      <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-2xl flex items-center justify-between text-xs">
                        <div>
                          <span className="text-slate-400 block">{isAr ? 'محتوى الطرد الشخصي:' : 'Parcel Description:'}</span>
                          <span className="font-bold text-white">{selectedShipment.itemDescription}</span>
                        </div>
                        <div className="text-end">
                          <span className="text-slate-400 block">{isAr ? 'القيمة المصرح بها:' : 'Declared Value:'}</span>
                          <span className="font-bold text-emerald-400">${selectedShipment.declaredValue} USD</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Weight Discrepancy Action Banner */}
                  {(selectedShipment.currentStatus === 'WEIGHT_DISCREPANCY_PENDING' ||
                    selectedShipment.currentStatus === 'WEIGHT_ADJUSTMENT_PENDING') &&
                    selectedShipment.weightDiscrepancy && (
                    <div className="p-4 bg-amber-500/15 border border-amber-500/30 rounded-2xl text-xs space-y-3 text-amber-200 animate-pulse">
                      <div className="flex items-center gap-2 font-bold text-amber-300">
                        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                        <span>{isAr ? 'تنبيه: فرق وزن بالميزان المعتمد في الفرع (بانتظار موافقتك)' : 'Scale Discrepancy Alert (Approval Pending)'}</span>
                      </div>
                      <p className="leading-relaxed text-slate-300">
                        {isAr
                          ? `تم وزن الطرد عند الاستلام في الفرع وتبين أن الوزن الفعلي (${selectedShipment.weightDiscrepancy.actualKg} كغم) يتجاوز الوزن المصرح به مبدئياً (${selectedShipment.weightDiscrepancy.originalKg} كغم). فرق تكلفة الشحن الإضافي هو: $${selectedShipment.weightDiscrepancy.priceDelta} USD.`
                          : `Actual certified weight is ${selectedShipment.weightDiscrepancy.actualKg} kg vs declared ${selectedShipment.weightDiscrepancy.originalKg} kg. Additional shipping charge: $${selectedShipment.weightDiscrepancy.priceDelta} USD.`}
                      </p>
                      <div className="flex gap-2 pt-1">
                        <button
                          onClick={() => onApproveWeightDiscrepancy(selectedShipment.id, 'APPROVE')}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer flex items-center gap-1.5 shadow-md shadow-emerald-600/20"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{isAr ? `موافقة وسداد الفرق ($${selectedShipment.weightDiscrepancy.priceDelta})` : 'Approve & Pay Difference'}</span>
                        </button>
                        <button
                          onClick={() => onApproveWeightDiscrepancy(selectedShipment.id, 'REJECT')}
                          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-xs transition-colors cursor-pointer"
                        >
                          {isAr ? 'رفض واسترجاع الطرد للفرع' : 'Reject & Return Package'}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* 4-Stage Visual Custody & Security Tracking */}
                  <div className="space-y-3 pt-2">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      {isAr ? 'سلسلة العهدة والأمان المباشرة:' : 'Custody & Security Tracking:'}
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
                        <span className="text-slate-500 block text-[11px] mb-1">{isAr ? 'الختم الأمني المشفر' : 'Tamper-Evident Seal ID'}</span>
                        <span className="font-mono font-bold text-amber-400">
                          {selectedShipment.securitySealId || (isAr ? 'بانتظار الفحص والتغليف بالفرع' : 'Pending Hub Intake')}
                        </span>
                      </div>

                      <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
                        <span className="text-slate-500 block text-[11px] mb-1">{isAr ? 'المسافر المعتمد المعين' : 'Assigned Traveler'}</span>
                        <span className="font-bold text-blue-400">
                          {selectedShipment.assignedTravelerName ? (
                            `${selectedShipment.assignedTravelerName} (${selectedShipment.airline || 'رحلة جوية'})`
                          ) : (
                            <span className="text-slate-500">{isAr ? 'بانتظار ربط المانيفست' : 'Pending Manifest'}</span>
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-900 rounded-3xl p-12 border border-slate-800 text-center text-slate-500">
                  <Box className="w-12 h-12 mx-auto mb-3 opacity-30 text-blue-400" />
                  <p className="text-xs">{isAr ? 'اختر شحنة من القائمة لعرض تفاصيلها وأسعارها' : 'Select an order to view full details'}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Printable Waybill Modal */}
      <WaybillModal
        isOpen={!!waybillModalShipment}
        onClose={() => setWaybillModalShipment(null)}
        shipment={waybillModalShipment}
        locale={locale}
      />

      {/* Hub Agent Chat Modal */}
      <AgentChatModal
        isOpen={chatModalOpen}
        onClose={() => setChatModalOpen(false)}
        trackingNumber={selectedShipment?.trackingNumber}
        locale={locale}
      />

      {/* Legal, Customs & Prohibited Items Compliance Modal */}
      <ComplianceModal
        isOpen={complianceModalOpen}
        onClose={() => setComplianceModalOpen(false)}
        initialTab={complianceInitialTab}
        locale={locale}
        onAcceptTerms={() => {
          setProhibitedAgreed(true);
        }}
      />
    </div>
  );
};
