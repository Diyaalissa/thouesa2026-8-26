import React from 'react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Locale } from '../../types';
import { TrendingUp, DollarSign, ShieldCheck, Activity, MapPin } from 'lucide-react';

interface DashboardChartsProps {
  locale: Locale;
}

export const DashboardCharts: React.FC<DashboardChartsProps> = ({ locale }) => {
  const isAr = locale === 'ar';

  // 1. Daily Volume Data (Shipments Created vs Delivered)
  const volumeData = [
    { day: isAr ? 'السبت' : 'Sat', created: 14, delivered: 11, inFlight: 3 },
    { day: isAr ? 'الأحد' : 'Sun', created: 22, delivered: 18, inFlight: 5 },
    { day: isAr ? 'الإثنين' : 'Mon', created: 28, delivered: 24, inFlight: 7 },
    { day: isAr ? 'الثلاثاء' : 'Tue', created: 35, delivered: 30, inFlight: 9 },
    { day: isAr ? 'الأربعاء' : 'Wed', created: 31, delivered: 27, inFlight: 8 },
    { day: isAr ? 'الخميس' : 'Thu', created: 42, delivered: 39, inFlight: 12 },
    { day: isAr ? 'الجمعة' : 'Fri', created: 25, delivered: 22, inFlight: 6 },
  ];

  // 2. Cross-Border Corridor Revenue Data
  const corridorData = [
    {
      corridor: isAr ? 'عمان ⇄ الجزائر' : 'AMM ⇄ ALG',
      revenue: 4850,
      parcels: 94,
      fill: '#3b82f6',
    },
    {
      corridor: isAr ? 'القاهرة ⇄ عمان' : 'CAI ⇄ AMM',
      revenue: 2920,
      parcels: 62,
      fill: '#10b981',
    },
    {
      corridor: isAr ? 'الرياض ⇄ الجزائر' : 'RUH ⇄ ALG',
      revenue: 3400,
      parcels: 48,
      fill: '#f59e0b',
    },
    {
      corridor: isAr ? 'مسقط ⇄ عمان' : 'MCT ⇄ AMM',
      revenue: 1650,
      parcels: 28,
      fill: '#8b5cf6',
    },
  ];

  // 3. KYC Verification Rate Breakdown
  const kycData = [
    { name: isAr ? 'هويات معتمدة' : 'Verified', value: 84, color: '#10b981' },
    { name: isAr ? 'قيد التدقيق' : 'Pending Review', value: 11, color: '#f59e0b' },
    { name: isAr ? 'مرفوضة / غير مطابقة' : 'Rejected', value: 5, color: '#ef4444' },
  ];

  return (
    <div className="space-y-6">
      {/* Top Quick Intelligence Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs mb-2">
            <span>{isAr ? 'إجمالي حركة الشحن الأسبوعية' : 'Weekly Shipment Volume'}</span>
            <Activity className="w-4 h-4 text-brand-400" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">197 {isAr ? 'طرد' : 'pkgs'}</div>
          <div className="text-xs text-teal-600 dark:text-emerald-400 flex items-center gap-1 mt-1 font-semibold">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>+18.4% {isAr ? 'مقارنة بالأسبوع الماضي' : 'vs last week'}</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs mb-2">
            <span>{isAr ? 'إيرادات الممرات الجوية' : 'Corridor Revenue'}</span>
            <DollarSign className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">$12,820</div>
          <div className="text-xs text-teal-600 dark:text-emerald-400 flex items-center gap-1 mt-1 font-semibold">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>{isAr ? 'أعلى ممر: الأردن ⇄ الجزائر' : 'Top: Jordan ⇄ Algeria'}</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs mb-2">
            <span>{isAr ? 'نسبة اعتماد هويات KYC' : 'KYC Approval Rate'}</span>
            <ShieldCheck className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">94.4%</div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {isAr ? 'متوسط سرعة التدقيق: 14 دقيقة' : 'Avg verification: 14 mins'}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs mb-2">
            <span>{isAr ? 'سلامة الختم الأمني والتسليم' : 'Tamper Seal Compliance'}</span>
            <ShieldCheck className="w-4 h-4 text-brand-400" />
          </div>
          <div className="text-2xl font-black text-teal-600 dark:text-emerald-400">100%</div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {isAr ? 'صفر حالات عبث أو فقدان' : '0 tamper/loss incidents'}
          </div>
        </div>
      </div>

      {/* Main Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Daily Shipment Activity Area Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                {isAr ? 'حجم تدفق الشحنات اليومية والتسليم' : 'Daily Shipment Inflow & Delivery'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isAr ? 'مقارنة الطرود المنشأة والمسلمة خلال آخر 7 أيام' : 'Created vs Delivered parcels across the week'}
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1 text-brand-500 font-semibold">
                <span className="w-2.5 h-2.5 rounded-full bg-brand-400" />
                {isAr ? 'تم الإنشاء' : 'Created'}
              </span>
              <span className="flex items-center gap-1 text-teal-600 font-semibold">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                {isAr ? 'تم التسليم' : 'Delivered'}
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={volumeData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCreated" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorDelivered" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.15} />
                <XAxis dataKey="day" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    border: '1px solid #334155',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="created"
                  name={isAr ? 'شحنات جديدة' : 'Created'}
                  stroke="#3b82f6"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorCreated)"
                />
                <Area
                  type="monotone"
                  dataKey="delivered"
                  name={isAr ? 'تم التسليم' : 'Delivered'}
                  stroke="#10b981"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorDelivered)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* KYC Distribution Donut Chart */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base">
              {isAr ? 'حالة توثيق وثائق KYC' : 'KYC Verification Funnel'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              {isAr ? 'توزيع نتائج تدقيق جوازات السفر والهويات' : 'Passport & ID verification distribution'}
            </p>

            <div className="h-48 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={kycData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {kycData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      border: '1px solid #334155',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '11px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Donut Legend */}
          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
            {kycData.map((item) => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-slate-700 dark:text-slate-300 font-medium">{item.name}</span>
                </div>
                <span className="font-bold text-slate-900 dark:text-white">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Corridor Revenue Breakdown Bar Chart */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base">
              {isAr ? 'توزيع الإيرادات حسب الممرات الجوية الدولية' : 'Revenue by International Air Corridor'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {isAr ? 'عمان، الجزائر، القاهرة، الرياض، مسقط' : 'Amman, Algiers, Cairo, Riyadh, Muscat'}
            </p>
          </div>
          <span className="px-3 py-1 bg-brand-50 dark:bg-brand-900/40 text-brand-500 dark:text-brand-300 border border-brand-200 dark:border-brand-700 rounded-full text-xs font-semibold">
            {isAr ? 'تحديث لحظي' : 'Live Data'}
          </span>
        </div>

        <div className="h-60 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={corridorData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.15} />
              <XAxis dataKey="corridor" stroke="#64748b" fontSize={11} />
              <YAxis stroke="#64748b" fontSize={11} />
              <Tooltip
                formatter={(val: any) => [`$${val}`, isAr ? 'الإيراد' : 'Revenue']}
                contentStyle={{
                  backgroundColor: '#0f172a',
                  border: '1px solid #334155',
                  borderRadius: '12px',
                  color: '#fff',
                  fontSize: '12px',
                }}
              />
              <Bar dataKey="revenue" name={isAr ? 'الإيراد ($)' : 'Revenue ($)'} radius={[6, 6, 0, 0]}>
                {corridorData.map((entry, index) => (
                  <Cell key={`cell-bar-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
