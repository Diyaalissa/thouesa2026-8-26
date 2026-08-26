import React, { useState } from 'react';
import {
  ShieldAlert,
  Users,
  Wallet,
  TrendingUp,
  RefreshCw,
  Lock,
  Globe,
  FileText,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Play,
  History,
  Plane,
  Box,
  Building2,
  UserPlus,
  Key,
  BadgeCheck,
} from 'lucide-react';
import { AuditLog, ExchangeRate, Locale, User } from '../../types';
import { formatCurrency } from '../../lib/crypto';
import { DEFAULT_EXCHANGE_RATES, HUBS_DATA, INITIAL_EMPLOYEES } from '../../lib/constants';
import { DashboardCharts } from './DashboardCharts';

interface AdminPortalProps {
  currentUser: User;
  users: User[];
  auditLogs: AuditLog[];
  locale: Locale;
  onApproveKYC: (userId: string, status: 'APPROVED' | 'REJECTED') => Promise<void>;
  onTriggerCron: (jobType: string) => Promise<any>;
  onRefreshData: () => void;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({
  currentUser,
  users,
  auditLogs,
  locale,
  onApproveKYC,
  onTriggerCron,
  onRefreshData,
}) => {
  const isAr = locale === 'ar';
  const [activeTab, setActiveTab] = useState<
    'METRICS' | 'EMPLOYEES' | 'KYC_MANAGER' | 'RATES_LOCK' | 'AUDIT_LOGS' | 'CRON_TERMINAL' | 'SYSTEM_SETTINGS'
  >('METRICS');
  const [selectedUserForKyc, setSelectedUserForKyc] = useState<User | null>(null);
  const [exchangeRates, setExchangeRates] = useState<ExchangeRate[]>(DEFAULT_EXCHANGE_RATES);
  const [cronRunning, setCronRunning] = useState(false);
  const [cronLogs, setCronLogs] = useState<string[]>([]);

  // Employee creation state
  const [employeesList, setEmployeesList] = useState(INITIAL_EMPLOYEES);
  const [newEmpName, setNewEmpName] = useState('');
  const [newEmpEmail, setNewEmpEmail] = useState('');
  const [newEmpCode, setNewEmpCode] = useState('');
  const [newEmpHubId, setNewEmpHubId] = useState('hub-mct');
  const [newEmpPassword, setNewEmpPassword] = useState('');
  const [isCreatingEmp, setIsCreatingEmp] = useState(false);
  const [empSuccessMsg, setEmpSuccessMsg] = useState('');

  const handleCronExecute = async (job: string) => {
    setCronRunning(true);
    const result = await onTriggerCron(job);
    setCronRunning(false);
    if (result && result.details) {
      setCronLogs((prev) => [
        `[${new Date().toLocaleTimeString()}] ${result.message} (Processed: ${JSON.stringify(result.details)})`,
        ...prev,
      ]);
    }
  };

  const handleCreateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreatingEmp(true);
    try {
      const res = await fetch('/api/admin/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: newEmpName,
          email: newEmpEmail,
          employeeCode: newEmpCode || `EMP-${newEmpHubId.toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`,
          hubId: newEmpHubId,
          password: newEmpPassword,
        }),
      });
      const data = await res.json();
      if (data.status === 'success' && data.employee) {
        setEmployeesList((prev) => [...prev, data.employee]);
        setEmpSuccessMsg(
          isAr
            ? `تم إنشاء حساب الموظف (${data.employee.fullName}) لفرع ${data.employee.hubNameAr} بنجاح! كود الموظف: ${data.employee.employeeCode}`
            : `Created staff account for ${data.employee.fullName} at ${data.employee.hubNameEn}!`
        );
        setNewEmpName('');
        setNewEmpEmail('');
        setNewEmpCode('');
        setNewEmpPassword('');
        setTimeout(() => setEmpSuccessMsg(''), 6000);
      } else {
        alert(data.message || 'Error creating employee');
      }
    } catch (err) {
      console.error(err);
      alert('Network error creating employee');
    } finally {
      setIsCreatingEmp(false);
    }
  };

  return (
    <div className="space-y-6" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Admin Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold">
                {isAr ? 'لوحة تحكم الإدارة المركزية والرقابة العامة' : 'Master Admin & General Oversight'}
              </h2>
              <span className="text-xs bg-purple-500/20 text-purple-300 font-bold px-2 py-0.5 rounded-md border border-purple-500/30">
                Super Admin
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {isAr
                ? 'إدارة حسابات موظفي الفروع، الرقابة المالية، أسعار الصرف، وسجل التدقيق'
                : 'Manage hub staff, escrow liquidity, exchange rate locks, and audit logs'}
            </p>
          </div>
        </div>

        <button
          onClick={onRefreshData}
          className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>{isAr ? 'تحديث البيانات' : 'Refresh State'}</span>
        </button>
      </div>

      {/* Admin Subtabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto bg-slate-100 p-1.5 rounded-2xl border border-slate-200 text-xs font-semibold scrollbar-none">
        <button
          onClick={() => setActiveTab('METRICS')}
          className={`px-4 py-2.5 rounded-xl transition-all cursor-pointer ${
            activeTab === 'METRICS' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          {isAr ? 'المؤشرات والسيولة المالية' : 'Financial Liquidity'}
        </button>
        <button
          onClick={() => setActiveTab('EMPLOYEES')}
          className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl transition-all cursor-pointer ${
            activeTab === 'EMPLOYEES' ? 'bg-white text-slate-900 shadow-xs font-bold text-amber-700' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Building2 className="w-3.5 h-3.5 text-amber-600" />
          <span>{isAr ? 'إدارة حسابات موظفي الفروع' : 'Branch Staff & Employees'}</span>
          <span className="px-1.5 py-0.2 bg-amber-100 text-amber-800 rounded-full text-[10px]">{employeesList.length}</span>
        </button>
        <button
          onClick={() => setActiveTab('KYC_MANAGER')}
          className={`px-4 py-2.5 rounded-xl transition-all cursor-pointer ${
            activeTab === 'KYC_MANAGER' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          {isAr ? 'توثيق هويات المسافرين (KYC)' : 'Traveler KYC Approvals'}
        </button>
        <button
          onClick={() => setActiveTab('RATES_LOCK')}
          className={`px-4 py-2.5 rounded-xl transition-all cursor-pointer ${
            activeTab === 'RATES_LOCK' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          {isAr ? 'تثبيت أسعار الصرف' : 'Exchange Rate Locks'}
        </button>
        <button
          onClick={() => setActiveTab('AUDIT_LOGS')}
          className={`px-4 py-2.5 rounded-xl transition-all cursor-pointer ${
            activeTab === 'AUDIT_LOGS' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          {isAr ? 'سجل التدقيق المشفر (Audit Trail)' : 'Audit Trail'}
        </button>
        <button
          onClick={() => setActiveTab('CRON_TERMINAL')}
          className={`px-4 py-2.5 rounded-xl transition-all cursor-pointer ${
            activeTab === 'CRON_TERMINAL' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          {isAr ? 'مهام cPanel المجدولة (Cron Jobs)' : 'cPanel Cron Terminal'}
        </button>
        <button
          onClick={() => setActiveTab('SYSTEM_SETTINGS')}
          className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl transition-all cursor-pointer ${
            activeTab === 'SYSTEM_SETTINGS' ? 'bg-white text-slate-900 shadow-xs font-bold text-brand-600' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Building2 className="w-3.5 h-3.5 text-brand-500" />
          <span>{isAr ? 'إعدادات النظام وعناويننا' : 'System Hubs & Addresses'}</span>
        </button>
      </div>

      {/* TAB 1: FINANCIAL METRICS & ANALYTICS CHARTS */}
      {activeTab === 'METRICS' && (
        <div className="space-y-6">
          <DashboardCharts locale={locale} />
        </div>
      )}

      {/* TAB 2: BRANCH EMPLOYEES MANAGER */}
      {activeTab === 'EMPLOYEES' && (
        <div className="space-y-6">
          {empSuccessMsg && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
              <span>{empSuccessMsg}</span>
            </div>
          )}

          {/* Create New Employee Form */}
          <form onSubmit={handleCreateEmployee} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4 text-xs">
            <div className="border-b border-slate-200 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-brand-500" />
                <span>{isAr ? 'إنشاء حساب موظف جديد وتعيين الفرع' : 'Create Staff Account & Assign Hub'}</span>
              </h3>
              <p className="text-slate-500 mt-0.5">
                {isAr
                  ? 'بصفتك المدير المركزي، يمكنك إنشاء حساب لموظف في سلطنة عُمان أو الجزائر أو أي فرع وتحديد الكود وكلمة المرور'
                  : 'As Central Admin, issue credentials for Oman, Algeria, Jordan, Cairo or Riyadh staff members'}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">{isAr ? 'اسم الموظف الكامل' : 'Employee Full Name'}</label>
                <input
                  type="text"
                  required
                  placeholder={isAr ? 'مثال: سالم بن خلفان المعمري' : 'e.g. Salim Al Maamari'}
                  value={newEmpName}
                  onChange={(e) => setNewEmpName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">{isAr ? 'البريد الإلكتروني / اسم الدخول' : 'Email / Login'}</label>
                <input
                  type="email"
                  required
                  placeholder="salim@thouesa.om"
                  value={newEmpEmail}
                  onChange={(e) => setNewEmpEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">{isAr ? 'الفرع والمركز المعين' : 'Assigned Hub'}</label>
                <select
                  value={newEmpHubId}
                  onChange={(e) => setNewEmpHubId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                >
                  {HUBS_DATA.map((h) => (
                    <option key={h.id} value={h.id}>
                      {isAr ? h.nameAr : h.nameEn} ({h.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">{isAr ? 'كود الموظف (اختياري / تلقائي)' : 'Employee Code'}</label>
                <input
                  type="text"
                  placeholder="EMP-MCT-102"
                  value={newEmpCode}
                  onChange={(e) => setNewEmpCode(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono uppercase"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">{isAr ? 'كلمة المرور' : 'Password'}</label>
                <input
                  type="text"
                  required
                  placeholder="Secret password"
                  value={newEmpPassword}
                  onChange={(e) => setNewEmpPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono"
                />
              </div>

              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={isCreatingEmp}
                  className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 bg-brand-500 hover:bg-brand-600 text-white font-bold rounded-xl transition-colors cursor-pointer disabled:opacity-50"
                >
                  <Key className="w-3.5 h-3.5" />
                  <span>{isCreatingEmp ? (isAr ? 'جاري الحفظ...' : 'Saving...') : (isAr ? 'إنشاء وتفعيل الحساب' : 'Create Staff Account')}</span>
                </button>
              </div>
            </div>
          </form>

          {/* Employees List Table */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4 text-xs">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-amber-600" />
              <span>{isAr ? 'قائمة موظفي الفروع المركزية النشطين' : 'Active Central Branch Employees'}</span>
            </h3>

            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-start">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="p-3 text-start">{isAr ? 'كود الموظف' : 'Employee ID'}</th>
                    <th className="p-3 text-start">{isAr ? 'اسم الموظف' : 'Full Name'}</th>
                    <th className="p-3 text-start">{isAr ? 'البريد الإلكتروني' : 'Email'}</th>
                    <th className="p-3 text-start">{isAr ? 'الفرع المخصص' : 'Assigned Hub'}</th>
                    <th className="p-3 text-center">{isAr ? 'الحالة' : 'Status'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {employeesList.map((emp) => (
                    <tr key={emp.id} className="hover:bg-slate-50">
                      <td className="p-3 font-mono font-bold text-brand-500">{emp.employeeCode}</td>
                      <td className="p-3 font-semibold">{emp.fullName}</td>
                      <td className="p-3 font-mono text-slate-500">{emp.email}</td>
                      <td className="p-3 font-semibold">
                        <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 text-[11px]">
                          {isAr ? emp.hubNameAr : emp.hubNameEn} ({emp.hubCode})
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          <BadgeCheck className="w-3 h-3" />
                          <span>{isAr ? 'نشط ومصرح' : 'Active'}</span>
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: KYC MANAGER */}
      {activeTab === 'KYC_MANAGER' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">
              {isAr ? 'طلبات التحقق من الهوية الوطنية وجوازات السفر (KYC Documents)' : 'Traveler KYC Verification & Identity Photos'}
            </h3>
            <span className="text-xs text-slate-500 font-medium">
              {users.filter(u => u.kycStatus === 'PENDING').length} {isAr ? 'قيد المراجعة' : 'Pending Review'}
            </span>
          </div>

          <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
            <table className="w-full text-start">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3 text-start">{isAr ? 'المستخدم والاتصال' : 'User & Contact'}</th>
                  <th className="p-3 text-start">{isAr ? 'الدور والبلد' : 'Role & Country'}</th>
                  <th className="p-3 text-start">{isAr ? 'الجنسية / الهوية' : 'Nationality & ID'}</th>
                  <th className="p-3 text-start">{isAr ? 'حالة KYC' : 'KYC Status'}</th>
                  <th className="p-3 text-start">{isAr ? 'معاينة الوثائق' : 'Inspect Documents'}</th>
                  <th className="p-3 text-start">{isAr ? 'الإجراء' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50">
                    <td className="p-3 font-semibold">
                      <div>{u.fullName}</div>
                      <div className="text-[11px] text-slate-500 font-mono">{u.phone}</div>
                    </td>
                    <td className="p-3">
                      <div>{u.role}</div>
                      <div className="text-[11px] text-slate-500">{u.country}</div>
                    </td>
                    <td className="p-3">
                      <div>{u.nationality || (u.country === 'DZA' ? 'Algerian' : 'Jordanian')}</div>
                      <div className="text-[11px] text-slate-500 font-mono">{u.nationalIdNumber || 'ID-REG-2026'}</div>
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-full font-bold text-[11px] ${
                        u.kycStatus === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {u.kycStatus}
                      </span>
                    </td>
                    <td className="p-3">
                      <button
                        onClick={() => setSelectedUserForKyc(u)}
                        className="px-2.5 py-1 bg-brand-50 hover:bg-brand-100 text-brand-600 border border-brand-200 rounded-lg font-bold flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <FileText className="w-3 h-3" />
                        <span>{isAr ? 'فحص الصور' : 'Inspect Photos'}</span>
                      </button>
                    </td>
                    <td className="p-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => onApproveKYC(u.id, 'APPROVED')}
                          className="px-2.5 py-1 bg-teal-600 hover:bg-emerald-700 text-white rounded-lg font-bold cursor-pointer"
                        >
                          {isAr ? 'اعتماد' : 'Approve'}
                        </button>
                        <button
                          onClick={() => onApproveKYC(u.id, 'REJECTED')}
                          className="px-2.5 py-1 bg-rose-100 hover:bg-rose-200 text-rose-800 rounded-lg font-bold cursor-pointer"
                        >
                          {isAr ? 'رفض' : 'Reject'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* KYC Document Inspector Modal */}
          {selectedUserForKyc && (
            <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl max-w-2xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                  <div>
                    <h4 className="text-base font-bold text-slate-900">
                      {isAr ? 'وثائق إثبات الهوية وجواز السفر للمستخدم' : 'User KYC & Identity Verification Photos'}
                    </h4>
                    <p className="text-xs text-slate-500 font-medium">
                      {selectedUserForKyc.fullName} — {selectedUserForKyc.phone} ({selectedUserForKyc.email})
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedUserForKyc(null)}
                    className="text-slate-400 hover:text-slate-600 text-lg font-bold cursor-pointer p-1"
                  >
                    ✕
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4 text-xs">
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                    <span className="font-bold text-slate-800 block">
                      {isAr ? 'بطاقة الهوية الوطنية (الوجه الأمامي)' : 'National ID (Front Side)'}
                    </span>
                    <div className="h-44 rounded-lg bg-slate-200 overflow-hidden border border-slate-300">
                      <img
                        src={selectedUserForKyc.idDocumentFrontUrl || 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=500&auto=format&fit=crop&q=80'}
                        alt="ID Front"
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                    <span className="font-bold text-slate-800 block">
                      {isAr ? 'بطاقة الهوية الوطنية (الوجه الخلفي)' : 'National ID (Back Side)'}
                    </span>
                    <div className="h-44 rounded-lg bg-slate-200 overflow-hidden border border-slate-300">
                      <img
                        src={selectedUserForKyc.idDocumentBackUrl || 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=500&auto=format&fit=crop&q=80'}
                        alt="ID Back"
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                    <span className="font-bold text-slate-800 block">
                      {isAr ? 'صفحة جواز السفر المعتمدة' : 'Passport Identification Page'}
                    </span>
                    <div className="h-44 rounded-lg bg-slate-200 overflow-hidden border border-slate-300">
                      <img
                        src={selectedUserForKyc.passportPhotoUrl || 'https://images.unsplash.com/photo-1544717302-de2939b7ef71?w=500&auto=format&fit=crop&q=80'}
                        alt="Passport"
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                    <span className="font-bold text-slate-800 block">
                      {isAr ? 'صورة شخصية مع الهوية (Selfie)' : 'Selfie with ID'}
                    </span>
                    <div className="h-44 rounded-lg bg-slate-200 overflow-hidden border border-slate-300">
                      <img
                        src={selectedUserForKyc.selfieWithIdUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80'}
                        alt="Selfie verification"
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                  <button
                    onClick={() => {
                      onApproveKYC(selectedUserForKyc.id, 'REJECTED');
                      setSelectedUserForKyc(null);
                    }}
                    className="px-4 py-2 bg-rose-100 hover:bg-rose-200 text-rose-800 font-bold rounded-xl cursor-pointer text-xs"
                  >
                    {isAr ? 'رفض الطلب' : 'Reject KYC'}
                  </button>
                  <button
                    onClick={() => {
                      onApproveKYC(selectedUserForKyc.id, 'APPROVED');
                      setSelectedUserForKyc(null);
                    }}
                    className="px-4 py-2 bg-teal-600 hover:bg-emerald-700 text-white font-bold rounded-xl cursor-pointer text-xs"
                  >
                    {isAr ? 'اعتماد وتوثيق الهوية' : 'Approve & Verify KYC'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: EXCHANGE RATES LOCK */}
      {activeTab === 'RATES_LOCK' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900">{isAr ? 'أسعار الصرف المثبتة لمنع تقلبات العملة أثناء الرحلة' : 'Locked Multi-Currency Rates'}</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            {exchangeRates.map((r) => (
              <div key={r.currency} className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="font-bold text-slate-700 block mb-1">1 USD =</span>
                <div className="text-xl font-black text-brand-600">
                  {r.rateToUsd} {r.currency}
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">تحديث دوري مثبت</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: AUDIT TRAIL */}
      {activeTab === 'AUDIT_LOGS' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900">{isAr ? 'سجل التدقيق المشفر وغير القابل للتعديل' : 'HMAC Verified Immutable Audit Trail'}</h3>

          <div className="space-y-2 text-xs">
            {auditLogs.map((log) => (
              <div key={log.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-start justify-between gap-3">
                <div>
                  <div className="font-bold text-slate-900 flex items-center gap-2">
                    <span>{log.action}</span>
                    <span className="text-[10px] font-mono text-slate-400">({log.entityType}: {log.entityId})</span>
                  </div>
                  <p className="text-slate-600 mt-0.5">{log.actorRole} • {log.ipAddress}</p>
                </div>
                <span className="text-[11px] text-slate-400 font-mono shrink-0">
                  {new Date(log.createdAt).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 6: CPANEL CRON JOBS SIMULATOR */}
      {activeTab === 'CRON_TERMINAL' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-5 text-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div>
              <h3 className="text-sm font-bold text-slate-900">{isAr ? 'إدارة وتشغيل مهام cPanel Cron المجدولة' : 'cPanel Cron Scheduler Terminal'}</h3>
              <p className="text-slate-500">مهام النظام الدورية لتنظيف السجلات وحل انتهاء مهل النزاعات وفك القيود</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-3">
            <button
              onClick={() => handleCronExecute('CLEANUP')}
              disabled={cronRunning}
              className="p-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-start font-bold transition-colors flex items-center justify-between cursor-pointer"
            >
              <div>
                <span className="block text-slate-900">تشغيل تنظيف الحجوزات المنتهية</span>
                <span className="text-[11px] text-slate-500 font-normal">Expire stale bookings</span>
              </div>
              <Play className="w-4 h-4 text-brand-500" />
            </button>

            <button
              onClick={() => handleCronExecute('DISPUTE_TIMEOUTS')}
              disabled={cronRunning}
              className="p-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-start font-bold transition-colors flex items-center justify-between cursor-pointer"
            >
              <div>
                <span className="block text-slate-900">معالجة مهل النزاعات التلقائية</span>
                <span className="text-[11px] text-slate-500 font-normal">Resolve dispute timeouts</span>
              </div>
              <Play className="w-4 h-4 text-teal-600" />
            </button>

            <button
              onClick={() => handleCronExecute('DAILY_LEDGER_AUDIT')}
              disabled={cronRunning}
              className="p-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-start font-bold transition-colors flex items-center justify-between cursor-pointer"
            >
              <div>
                <span className="block text-slate-900">تدقيق ميزانية القيد المزدوج اليومية</span>
                <span className="text-[11px] text-slate-500 font-normal">Audit daily double-entry balance</span>
              </div>
              <Play className="w-4 h-4 text-purple-600" />
            </button>
          </div>

          {/* Cron Output Log Terminal */}
          <div className="bg-slate-950 text-emerald-400 p-4 rounded-xl font-mono text-xs h-40 overflow-y-auto space-y-1">
            <div className="text-slate-500">-- THOUESA cPanel Cron Output Console --</div>
            {cronLogs.map((log, idx) => (
              <div key={idx}>{log}</div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 7: SYSTEM SETTINGS & OUR OFFICIAL ADDRESSES */}
      {activeTab === 'SYSTEM_SETTINGS' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-6 text-xs">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-200">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-brand-500" />
                <span>{isAr ? 'إعدادات النظام وعناوين الفروع الرسمية (Our Addresses & Hub Registry)' : 'System Settings & Official Hub Directory'}</span>
              </h3>
              <p className="text-slate-500 mt-1">
                {isAr
                  ? 'سجل العناوين المعتمدة لمراكز الاستلام، نقاط التفتيش الأمني، وأرقام الاتصال المباشرة لشبكة ثويسا الدولية.'
                  : 'Official registered physical hubs, security inspection checkpoints, direct contact lines, and storage metrics.'}
              </p>
            </div>
            <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full font-bold text-xs">
              {HUBS_DATA.length} {isAr ? 'فروع دولية معتمدة' : 'Active International Hubs'}
            </span>
          </div>

          {/* Grid of All Hubs with Physical Address Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {HUBS_DATA.map((hub) => (
              <div
                key={hub.id}
                className="bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-2xl p-5 space-y-3 transition-all"
              >
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <span className="text-base">{hub.countryCode === 'JOR' ? '🇯🇴' : hub.countryCode === 'DZA' ? '🇩🇿' : hub.countryCode === 'EGY' ? '🇪🇬' : hub.countryCode === 'SAU' ? '🇸🇦' : '🇴🇲'}</span>
                    <span>{isAr ? hub.cityAr : hub.cityEn}</span>
                  </div>
                  <span className="font-mono text-xs font-bold px-2 py-0.5 bg-slate-200 text-slate-700 rounded-md">
                    {hub.code}
                  </span>
                </div>

                <div className="space-y-2 text-slate-600">
                  <div>
                    <span className="font-semibold text-slate-800 block mb-0.5">{isAr ? 'العنوان الفعلي المعتمد:' : 'Physical Street Address:'}</span>
                    <p className="text-xs bg-white p-2.5 rounded-lg border border-slate-200 text-slate-700 leading-relaxed">
                      {hub.address}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">{isAr ? 'هاتف الفرع' : 'Phone'}</span>
                      <span className="font-mono font-semibold text-slate-800 text-xs" dir="ltr">{hub.phone}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">{isAr ? 'المدير المسؤول' : 'Hub Manager'}</span>
                      <span className="font-semibold text-slate-800 text-xs">{hub.managerName}</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-[11px]">
                    <span className="text-slate-500">{isAr ? 'ساعات العمل الرسمية:' : 'Hours:'}</span>
                    <span className="font-semibold text-emerald-700">{hub.operatingHours || '08:00 - 22:00'}</span>
                  </div>

                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-500">{isAr ? 'السعة التخزينية المتاحة:' : 'Capacity:'}</span>
                    <span className="font-bold text-brand-600">{hub.storageCapacityKg || 2500} كغ (نشط)</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
