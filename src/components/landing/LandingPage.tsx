import React, { useState } from 'react';
import {
  ShieldCheck,
  Plane,
  Box,
  Building2,
  Lock,
  ArrowRight,
  ArrowLeft,
  Calculator,
  CheckCircle2,
  Clock,
  Sparkles,
  MapPin,
  TrendingUp,
  AlertCircle,
  PackagePlus,
  Globe2,
  ShoppingBag,
} from 'lucide-react';
import { Currency, ItemCategory, Locale, UserRole } from '../../types';
import { calculateShippingQuote, formatCurrency } from '../../lib/crypto';
import { HUBS_DATA, ROUTE_PRICING } from '../../lib/constants';

interface LandingPageProps {
  locale: Locale;
  onNavigate: (role: UserRole) => void;
  onOpenAuth?: (mode?: 'SIGNIN' | 'SIGNUP' | 'EMPLOYEE') => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ locale, onNavigate, onOpenAuth }) => {
  const isAr = locale === 'ar';
  const ArrowIcon = isAr ? ArrowLeft : ArrowRight;

  // Calculator State
  const [originCountry, setOriginCountry] = useState('JOR');
  const [destCountry, setDestCountry] = useState('DZA');
  const [weightKg, setWeightKg] = useState(2.5);
  const [lengthCm, setLengthCm] = useState(25);
  const [widthCm, setWidthCm] = useState(20);
  const [heightCm, setHeightCm] = useState(10);
  const [category, setCategory] = useState<ItemCategory>('ELECTRONICS');
  const [declaredValUsd, setDeclaredValUsd] = useState(450);
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>('USD');

  const quote = calculateShippingQuote({
    originCountry,
    destinationCountry: destCountry,
    weightKg,
    lengthCm,
    widthCm,
    heightCm,
    declaredValueUsd: declaredValUsd,
    category,
  });

  const categories: { id: ItemCategory; labelAr: string; labelEn: string }[] = [
    { id: 'ELECTRONICS', labelAr: 'إلكترونيات وهواتف', labelEn: 'Electronics & Gadgets' },
    { id: 'DOCUMENTS', labelAr: 'وثائق وأوراق رسمية', labelEn: 'Official Documents' },
    { id: 'CLOTHING_TEXTILES', labelAr: 'ملابس ومقتنيات', labelEn: 'Apparel & Textiles' },
    { id: 'MEDICATIONS_PERMITTED', labelAr: 'أدوية شخصية مصرحة', labelEn: 'Prescription Medicines' },
    { id: 'GIFTS_COSMETICS', labelAr: 'هدايا ومستحضرات تجميل', labelEn: 'Gifts & Cosmetics' },
    { id: 'FOOD_COMMERCIAL_PACKED', labelAr: 'أغذية مغلفة مصنعياً', labelEn: 'Packaged Food Items' },
  ];

  const handleSendNowClick = () => {
    if (onOpenAuth) {
      onOpenAuth('SIGNUP');
    } else {
      onNavigate('SENDER');
    }
  };

  return (
    <div className="space-y-12 pb-16" dir={isAr ? 'rtl' : 'ltr'}>
      {/* 1. Hero Section with Luxury Cover Background */}
      <section className="relative overflow-hidden rounded-3xl bg-slate-950 text-white p-8 md:p-14 border border-slate-800 shadow-2xl">
        {/* Cover image background with high-end atmospheric blending */}
        <div
          className="absolute inset-0 z-0 bg-cover bg-center opacity-25 mix-blend-luminosity scale-105 pointer-events-none"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1578575437130-527eed3abbec?auto=format&fit=crop&w=2000&q=80')`,
          }}
        />
        <div className="absolute inset-0 z-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-brand-950/60 pointer-events-none" />
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 bg-brand-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-12 -ml-12 w-96 h-96 bg-teal-600/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-400/20 border border-brand-400/30 text-brand-300 text-xs font-semibold mb-6 backdrop-blur-xs">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>{isAr ? 'ضمان مالي مشدد 100% ومراكز فحص معتمدة' : '100% Escrow Guarantee & Physical Hub Network'}</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight mb-6">
            {isAr
              ? 'اشحن طرودك وتسوّق دولياً بأمان عبر المسافرين والضمان المالي'
              : 'Ship Packages & Shop Globally Safely with Verified Travelers & Escrow'}
          </h2>

          <p className="text-slate-300 text-sm sm:text-base leading-relaxed mb-8">
            {isAr
              ? 'منصة ثويسا تجمع بين خدمات إرسال الطرود الشخصية والشراء من المتاجر العالمية والشحن من دول محددة مع فحص أمني دقيق في الفروع وتأمين مالي مسترد (Escrow) من المسافرين.'
              : 'THOUESA eliminates blind handovers through a certified Hub-and-Spoke model. Parcels are weighed and tamper-sealed at origin hubs, while travelers lock a refundable financial deposit until delivery.'}
          </p>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleSendNowClick}
              className="flex items-center gap-2 px-6 py-3 bg-brand-500 hover:bg-brand-400 text-white font-bold text-sm rounded-xl shadow-lg shadow-brand-500/40 transition-all hover:scale-105 cursor-pointer"
            >
              <PackagePlus className="w-4 h-4" />
              <span>{isAr ? 'أرسل طردك الآن (تسجيل / دخول)' : 'Send Now (Sign Up / Sign In)'}</span>
              <ArrowIcon className="w-4 h-4" />
            </button>

            <button
              onClick={() => onNavigate('TRAVELER')}
              className="flex items-center gap-2 px-6 py-3 bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700 font-bold text-sm rounded-xl transition-all cursor-pointer backdrop-blur-xs"
            >
              <Plane className="w-4 h-4 text-emerald-400" />
              <span>{isAr ? 'اكسب كمسافر معتمد' : 'Earn as a Traveler'}</span>
            </button>

            <button
              onClick={() => onOpenAuth ? onOpenAuth('EMPLOYEE') : onNavigate('HUB_AGENT')}
              className="flex items-center gap-2 px-4 py-3 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 font-bold text-xs rounded-xl transition-all cursor-pointer backdrop-blur-xs"
            >
              <Building2 className="w-4 h-4 text-amber-400" />
              <span>{isAr ? 'بوابة الموظفين المركزية' : 'Staff Terminal'}</span>
            </button>
          </div>
        </div>

        {/* Live Metrics Strip */}
        <div className="grid grid-cols-1 md:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-12 pt-8 border-t border-slate-800/80 text-xs relative z-10">
          <div>
            <span className="text-slate-400 block">{isAr ? 'الضمان المالي المحجوز' : 'Active Escrow Locked'}</span>
            <span className="text-lg font-bold text-emerald-400">$680,000+</span>
          </div>
          <div>
            <span className="text-slate-400 block">{isAr ? 'فروع المراكز المعتمدة' : 'Certified Country Hubs'}</span>
            <span className="text-lg font-bold text-slate-100">{isAr ? 'عمان، الجزائر، مسقط، القاهرة، الرياض' : 'Amman, Algiers, Muscat, Cairo, Riyadh'}</span>
          </div>
          <div>
            <span className="text-slate-400 block">{isAr ? 'المسافرون الموثقون' : 'Verified Travelers'}</span>
            <span className="text-lg font-bold text-brand-300">1,420+ مسافر</span>
          </div>
          <div>
            <span className="text-slate-400 block">{isAr ? 'نسبة تسليم الطرود الآمنة' : 'Safe Delivery Rate'}</span>
            <span className="text-lg font-bold text-slate-100">99.96%</span>
          </div>
        </div>
      </section>

      {/* 2. THE 3 CORE SERVICES CARDS */}
      <section className="space-y-6">
        <div className="text-center max-w-2xl mx-auto">
          <span className="px-3 py-1 bg-brand-400/10 text-brand-300 border border-brand-400/30 rounded-full text-xs font-bold uppercase tracking-wider">
            {isAr ? 'خدمات المنصة الشاملة' : 'Core Logistics Services'}
          </span>
          <h3 className="text-2xl sm:text-3xl font-black text-slate-100 mt-2">
            {isAr ? 'ثلاث خيارات متكاملة للشحن والتسوق الدولي' : 'Three Integrated Services for Global Shipping & Sourcing'}
          </h3>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            {isAr
              ? 'اختر الخدمة المناسبة لاحتياجك واستمتع بضمان مالي 100% وفحص أمني في المراكز'
              : 'Select your preferred service with full financial escrow and physical hub verification.'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Service 1: Send Package */}
          <div
            onClick={handleSendNowClick}
            className="group relative bg-slate-900 border border-slate-800 hover:border-brand-400/60 rounded-3xl p-6 transition-all duration-300 hover:shadow-xl hover:shadow-brand-400/10 cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-2xl bg-brand-500/20 text-brand-300 border border-brand-400/30 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Box className="w-6 h-6" />
              </div>
              <span className="text-[11px] font-bold text-brand-300 uppercase tracking-wide">
                {isAr ? 'الخدمة الأولى' : 'Service #1'}
              </span>
              <h4 className="text-lg font-black text-white mt-1 mb-2">
                {isAr ? 'إرسال طرد شخصي (أمانات وهدايا)' : 'Send Personal Package'}
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                {isAr
                  ? 'تسليم طردك لأقرب مركز محلي، يتم وزنه وفحصه ووضع شريط لاصق أمني مشفر (Seal ID) ونقله مع مسافر معتمد.'
                  : 'Drop off items at your local hub. We inspect, weigh, and seal with cryptographic IDs before passenger dispatch.'}
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs font-bold text-brand-300 group-hover:text-brand-300">
              <span>{isAr ? 'ابدأ إرسال طرد' : 'Send Package'}</span>
              <ArrowIcon className="w-4 h-4 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Service 2: Buy from International Stores */}
          <div
            onClick={handleSendNowClick}
            className="group relative bg-slate-900 border border-slate-800 hover:border-brand-500/60 rounded-3xl p-6 transition-all duration-300 hover:shadow-xl hover:shadow-brand-500/10 cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-2xl bg-brand-600/20 text-brand-400 border border-brand-500/30 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Globe2 className="w-6 h-6" />
              </div>
              <span className="text-[11px] font-bold text-brand-400 uppercase tracking-wide">
                {isAr ? 'الخدمة الثانية' : 'Service #2'}
              </span>
              <h4 className="text-lg font-black text-white mt-1 mb-2">
                {isAr ? 'الشراء من المتاجر العالمية' : 'Buy from Global Stores'}
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                {isAr
                  ? 'ضع رابط المنتج من Amazon, Apple, AliExpress, eBay أو غيرها، ونقوم بالشراء والشحن لعنوانك مباشرة بأقل رسوم.'
                  : 'Paste product URLs from Amazon, Apple, AliExpress, or eBay. We handle purchasing, receiving, and direct transit.'}
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs font-bold text-brand-400 group-hover:text-brand-300">
              <span>{isAr ? 'طلب شراء من متجر عالمي' : 'Order Global Store Items'}</span>
              <ArrowIcon className="w-4 h-4 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Service 3: Buy from Specific Country & Ship */}
          <div
            onClick={handleSendNowClick}
            className="group relative bg-slate-900 border border-slate-800 hover:border-emerald-500/60 rounded-3xl p-6 transition-all duration-300 hover:shadow-xl hover:shadow-emerald-500/10 cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-2xl bg-teal-600/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <ShoppingBag className="w-6 h-6" />
              </div>
              <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wide">
                {isAr ? 'الخدمة الثالثة' : 'Service #3'}
              </span>
              <h4 className="text-lg font-black text-white mt-1 mb-2">
                {isAr ? 'الشراء من دولة محددة والشحن' : 'Buy from Specific Country & Ship'}
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                {isAr
                  ? 'اطلب منتجات مميزة من أسواق الأردن، الجزائر، مصر، سلطنة عُمان، أو السعودية ويقوم كادرنا أو المسافرون بشرائها وتوصيلها.'
                  : 'Source local goods from Jordan, Algeria, Egypt, Oman, or Saudi Arabia via verified shoppers and travelers.'}
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs font-bold text-emerald-400 group-hover:text-emerald-300">
              <span>{isAr ? 'طلب شراء محلي متخصص' : 'Source from Country'}</span>
              <ArrowIcon className="w-4 h-4 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform" />
            </div>
          </div>
        </div>
      </section>

      {/* 2. Interactive Live Instant Shipping Calculator */}
      <section className="bg-white rounded-3xl p-6 md:p-10 border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-brand-100 text-brand-600 flex items-center justify-center">
            <Calculator className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900">
              {isAr ? 'حاسبة الشحن الفورية وتسعير الأمان والضمان' : 'Instant Shipping Cost & Escrow Calculator'}
            </h3>
            <p className="text-xs text-slate-500">
              {isAr
                ? 'حساب التكلفة الدقيقة بناءً على الوزن الحجمي وقيمة التأمين المستردة'
                : 'Accurate pricing calculated via volumetric dimensions & cargo escrow'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Inputs */}
          <div className="lg:col-span-2 space-y-5 text-xs text-slate-700">
            {/* Route Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold mb-1.5">{isAr ? 'بلد الانطلاق (فرع الشحن)' : 'Origin Hub'}</label>
                <select
                  value={originCountry}
                  onChange={(e) => setOriginCountry(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                >
                  <option value="JOR">{isAr ? 'الأردن (مركز عمان AMM-01)' : 'Jordan (Amman Hub AMM-01)'}</option>
                  <option value="DZA">{isAr ? 'الجزائر (مركز الجزائر ALG-01)' : 'Algeria (Algiers Hub ALG-01)'}</option>
                  <option value="EGY">{isAr ? 'مصر (مركز القاهرة CAI-01)' : 'Egypt (Cairo Hub CAI-01)'}</option>
                  <option value="SAU">{isAr ? 'السعودية (مركز الرياض RUH-01)' : 'Saudi Arabia (Riyadh Hub RUH-01)'}</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1.5">{isAr ? 'بلد الوصول (فرع الاستلام)' : 'Destination Hub'}</label>
                <select
                  value={destCountry}
                  onChange={(e) => setDestCountry(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                >
                  <option value="DZA">{isAr ? 'الجزائر (مركز الجزائر ALG-01)' : 'Algeria (Algiers Hub ALG-01)'}</option>
                  <option value="JOR">{isAr ? 'الأردن (مركز عمان AMM-01)' : 'Jordan (Amman Hub AMM-01)'}</option>
                  <option value="EGY">{isAr ? 'مصر (مركز القاهرة CAI-01)' : 'Egypt (Cairo Hub CAI-01)'}</option>
                  <option value="SAU">{isAr ? 'السعودية (مركز الرياض RUH-01)' : 'Saudi Arabia (Riyadh Hub RUH-01)'}</option>
                </select>
              </div>
            </div>

            {/* Category & Declared Value */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold mb-1.5">{isAr ? 'نوع المحتويات' : 'Item Category'}</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as ItemCategory)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {isAr ? c.labelAr : c.labelEn}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1.5">
                  {isAr ? 'القيمة المصرح بها للطرد ($)' : 'Declared Parcel Value ($)'}
                </label>
                <input
                  type="number"
                  min="10"
                  max="5000"
                  value={declaredValUsd}
                  onChange={(e) => setDeclaredValUsd(Number(e.target.value))}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                />
              </div>
            </div>

            {/* Weight Slider & Dimensions */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="font-semibold">{isAr ? 'الوزن التقريبي (كغم)' : 'Estimated Weight (kg)'}</label>
                <span className="font-bold text-brand-500 bg-brand-50 px-2 py-0.5 rounded-md">{weightKg} كغم</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="25"
                step="0.5"
                value={weightKg}
                onChange={(e) => setWeightKg(Number(e.target.value))}
                className="w-full accent-brand-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-slate-500 mb-1">{isAr ? 'الطول (سم)' : 'Length (cm)'}</label>
                <input
                  type="number"
                  value={lengthCm}
                  onChange={(e) => setLengthCm(Number(e.target.value))}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-center font-medium"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-500 mb-1">{isAr ? 'العرض (سم)' : 'Width (cm)'}</label>
                <input
                  type="number"
                  value={widthCm}
                  onChange={(e) => setWidthCm(Number(e.target.value))}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-center font-medium"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-500 mb-1">{isAr ? 'الارتفاع (سم)' : 'Height (cm)'}</label>
                <input
                  type="number"
                  value={heightCm}
                  onChange={(e) => setHeightCm(Number(e.target.value))}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-center font-medium"
                />
              </div>
            </div>
          </div>

          {/* Quotation Summary Card */}
          <div className="bg-slate-900 text-white rounded-2xl p-6 flex flex-col justify-between border border-slate-800">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-xs text-slate-400">
                <span>{isAr ? 'التسعير التقديري' : 'Price Quotation'}</span>
                <span className="font-semibold text-brand-300">
                  {isAr ? 'الوزن المعتمد:' : 'Chargeable:'} {quote.chargeableWeightKg} kg
                </span>
              </div>

              <div className="my-5">
                <span className="text-xs text-slate-400 block">{isAr ? 'التكلفة الإجمالية للشحن' : 'Total Shipping Fee'}</span>
                <div className="text-3xl font-black text-white mt-1">
                  {formatCurrency(quote.totalCostUsd, 'USD')}
                </div>
              </div>

              <div className="space-y-2 text-xs text-slate-300 border-t border-slate-800 pt-4">
                <div className="flex justify-between">
                  <span className="text-slate-400">{isAr ? 'عائد المسافر المعتمد:' : 'Traveler Share:'}</span>
                  <span className="font-semibold text-emerald-400">{formatCurrency(quote.travelerShareUsd, 'USD')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">{isAr ? 'رسوم الفحص والختم الأمني:' : 'Inspection & Tamper Seal:'}</span>
                  <span className="font-semibold text-slate-200">{formatCurrency(quote.insuranceUsd, 'USD')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">{isAr ? 'الضمان المطلوب من المسافر:' : 'Required Escrow Hold:'}</span>
                  <span className="font-semibold text-amber-400">{formatCurrency(quote.escrowDepositRequiredUsd, 'USD')}</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => onNavigate('SENDER')}
              className="mt-6 w-full py-3 bg-brand-500 hover:bg-brand-400 text-white font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              <span>{isAr ? 'متابعة وحجز الشحنة' : 'Book Shipment with Escrow'}</span>
              <ArrowIcon className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </section>

      {/* 3. 4-Step Chain of Custody Diagram */}
      <section className="bg-slate-50 border border-slate-200 rounded-3xl p-6 md:p-10">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h3 className="text-2xl font-bold text-slate-900">
            {isAr ? 'كيف تضمن منصة ثويسا سلامة شحنتك بنسبة 100%؟' : 'How THOUESA Guarantees 100% Cargo Safety'}
          </h3>
          <p className="text-xs text-slate-500 mt-2">
            {isAr
              ? 'سلسلة عهدة رقمية وميدانية متكاملة تحمي أموالك وطرودك في كل خطوة'
              : 'An unbroken digital & physical chain of custody safeguarding your shipments'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs relative">
            <div className="w-10 h-10 rounded-xl bg-brand-100 text-brand-600 flex items-center justify-center font-black mb-3">
              1
            </div>
            <h4 className="font-bold text-slate-900 text-sm mb-1.5">
              {isAr ? '1. فحص وختم أمني في المركز' : '1. Physical Intake & Seal'}
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              {isAr
                ? 'يسلم المرسل الطرد لفرع الدولة، يقوم الموظف بفحص المحتويات، قياس الوزن المعتمد، ووضع شريط الختم الأمني المشفر.'
                : 'Sender drops parcel at local hub. Agent inspects contents, checks certified scale weight, and applies serialized tamper seals.'}
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs relative">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-black mb-3">
              2
            </div>
            <h4 className="font-bold text-slate-900 text-sm mb-1.5">
              {isAr ? '2. توثيق المسافر وحجز التأمين' : '2. PNR & Escrow Deposit'}
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              {isAr
                ? 'يتم تدقيق تذكرة الطيران (PNR) والهوية. يودع المسافر مبلغ تأمين مالي مسترد (Escrow) يعادل القيمة المصرح بها للطرد.'
                : 'Traveler identity & flight ticket (PNR) are verified. A refundable security deposit matching declared value is locked.'}
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs relative">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-black mb-3">
              3
            </div>
            <h4 className="font-bold text-slate-900 text-sm mb-1.5">
              {isAr ? '3. تسليم مشفر برمز QR' : '3. Mutual QR Handover'}
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              {isAr
                ? 'يسلم الموظف الطرود للمسافر عبر مسح متبادل لرمز QR موقع بتوقيع HMAC لتوثيق انتقال العهدة رقمياً ولحظياً.'
                : 'Origin agent dispatches packages to traveler via mutual HMAC QR scanning, digitally recording custody handover.'}
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs relative">
            <div className="w-10 h-10 rounded-xl bg-brand-100 text-brand-700 flex items-center justify-center font-black mb-3">
              4
            </div>
            <h4 className="font-bold text-slate-900 text-sm mb-1.5">
              {isAr ? '4. استلام في الوجهة وفك التأمين' : '4. Intake & Escrow Release'}
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              {isAr
                ? 'يسلم المسافر الطرود لمركز وجهة الوصول. بعد فحص الأختام، يفك حجز التأمين فوراً، وتحول أرباح المسافر، ويسلم الطرد للمستلم.'
                : 'Destination hub verifies sealed packages via QR. Escrow deposit is unlocked, traveler payout released, and recipient notified.'}
            </p>
          </div>
        </div>
      </section>

      {/* 4. Confirmed Traveler Capacity & Hub Network */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Verified Trips */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Plane className="w-5 h-5 text-brand-500" />
              <h4 className="font-bold text-slate-900 text-sm">
                {isAr ? 'سعات الأمتعة المتاحة لرحلات المسافرين القادمة' : 'Verified Upcoming Traveler Routes'}
              </h4>
            </div>
            <span className="text-xs bg-emerald-50 text-emerald-700 font-semibold px-2 py-0.5 rounded-full">
              {isAr ? 'مؤكدة بـ PNR' : 'PNR Verified'}
            </span>
          </div>

          <div className="space-y-3">
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
              <div>
                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                  <span>{isAr ? 'عمان (AMM)' : 'Amman (AMM)'}</span>
                  <span>➔</span>
                  <span>{isAr ? 'الجزائر العاصمة (ALG)' : 'Algiers (ALG)'}</span>
                </div>
                <p className="text-slate-500 text-[11px] mt-0.5">Royal Jordanian (RJ-511) • رحلة بعد 18 ساعة</p>
              </div>
              <div className="text-left">
                <span className="font-bold text-emerald-700 block">8.5 كغم متاحة</span>
                <span className="text-[10px] text-slate-400">تأمين محجوز ($650)</span>
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
              <div>
                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                  <span>{isAr ? 'القاهرة (CAI)' : 'Cairo (CAI)'}</span>
                  <span>➔</span>
                  <span>{isAr ? 'عمان (AMM)' : 'Amman (AMM)'}</span>
                </div>
                <p className="text-slate-500 text-[11px] mt-0.5">EgyptAir (MS-719) • رحلة بعد 42 ساعة</p>
              </div>
              <div className="text-left">
                <span className="font-bold text-emerald-700 block">11.0 كغم متاحة</span>
                <span className="text-[10px] text-slate-400">تأمين محجوز ($200)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Hub Network Cards */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-brand-500" />
              <h4 className="font-bold text-slate-900 text-sm">
                {isAr ? 'شبكة مراكز الفحص والتخزين المعتمدة (Hubs)' : 'Certified Country Hub Network'}
              </h4>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            {HUBS_DATA.map((h) => (
              <div key={h.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-slate-900">{h.code}</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                </div>
                <p className="font-medium text-slate-700 text-[11px] truncate">{isAr ? h.nameAr : h.nameEn}</p>
                <p className="text-slate-500 text-[10px] mt-1">{h.operatingHours}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};
