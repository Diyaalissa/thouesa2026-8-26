import { Request, Response, Router } from 'express';
import { db } from '../store';
import { Dispute, DisputeStatus } from '../../src/types';

export const adminRouter = Router();

// Master Admin Analytics Overview
adminRouter.get('/stats', (req: Request, res: Response) => {
  const shipments = Array.from(db.shipments.values());
  const trips = Array.from(db.trips.values());
  const users = Array.from(db.users.values());
  const transactions = Array.from(db.transactions.values());

  const totalVolume = shipments.length;
  const activeShipments = shipments.filter(
    (s) => s.currentStatus !== 'DELIVERED' && s.currentStatus !== 'CANCELLED'
  ).length;

  const deliveredShipments = shipments.filter((s) => s.currentStatus === 'DELIVERED').length;

  const totalEscrowLocked = Array.from(db.wallets.values()).reduce(
    (sum, w) => sum + (w.lockedEscrowDeposit || 0),
    0
  );

  const grossRevenue = transactions
    .filter((t) => t.type === 'SHIPPING_PAYMENT' && t.status === 'COMMITTED')
    .reduce((sum, t) => sum + t.amount, 0);

  const verifiedTravelersCount = users.filter(
    (u) => u.role === 'TRAVELER' && u.kycStatus === 'VERIFIED'
  ).length;

  const openDisputesCount = Array.from(db.disputes.values()).filter(
    (d) => d.status === 'OPEN' || d.status === 'UNDER_REVIEW'
  ).length;

  res.json({
    success: true,
    stats: {
      totalVolume,
      activeShipments,
      deliveredShipments,
      totalEscrowLocked: Number(totalEscrowLocked.toFixed(2)),
      grossRevenue: Number(grossRevenue.toFixed(2)),
      verifiedTravelersCount,
      openDisputesCount,
      activeTripsCount: trips.filter((t) => t.status !== 'COMPLETED' && t.status !== 'CANCELLED').length,
    },
  });
});

// Audit Logs Explorer
adminRouter.get('/audit-logs', (req: Request, res: Response) => {
  const { domain, limit } = req.query;
  let logs = [...db.auditLogs];

  if (domain) {
    logs = logs.filter((l) => l.domain === domain);
  }

  const max = limit ? parseInt(limit as string, 10) : 50;
  res.json({ success: true, auditLogs: logs.slice(0, max) });
});

// Disputes: List all
adminRouter.get('/disputes', (req: Request, res: Response) => {
  const disputes = Array.from(db.disputes.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  res.json({ success: true, disputes });
});

// Disputes: Create new dispute claim
adminRouter.post('/disputes', (req: Request, res: Response) => {
  const {
    shipmentId,
    claimantId,
    claimantName,
    claimantRole,
    reason,
    description,
    claimAmount,
    evidencePhotos,
  } = req.body;

  const shipment = db.shipments.get(shipmentId);
  if (!shipment) {
    return res.status(404).json({ success: false, error: 'Shipment not found' });
  }

  const newDispute: Dispute = {
    id: `disp-${Date.now()}`,
    shipmentId,
    trackingNumber: shipment.trackingNumber,
    claimantId,
    claimantName,
    claimantRole: claimantRole || 'SENDER',
    reason,
    description,
    evidencePhotos: evidencePhotos || [
      'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=400&auto=format&fit=crop&q=80',
    ],
    claimAmount: Number(claimAmount) || shipment.declaredValue,
    currency: 'USD',
    status: 'OPEN',
    createdAt: new Date().toISOString(),
  };

  db.disputes.set(newDispute.id, newDispute);
  shipment.currentStatus = 'DISPUTED';
  db.shipments.set(shipment.id, shipment);

  db.logAudit({
    actorId: claimantId,
    actorName: claimantName,
    actorRole: claimantRole || 'SENDER',
    domain: 'Governance',
    action: 'CREATE_DISPUTE_CLAIM',
    resourceType: 'Dispute',
    resourceId: newDispute.id,
    details: { reason, claimAmount },
  });

  res.status(201).json({
    success: true,
    message: 'Dispute claim filed. Admin will review evidence and enforce escrow resolution.',
    dispute: newDispute,
  });
});

// Disputes: Resolve claim (Refund or Escrow Forfeit)
adminRouter.post('/disputes/:id/resolve', (req: Request, res: Response) => {
  const { id } = req.params;
  const { resolutionStatus, resolutionNotes, adminId } = req.body; // 'RESOLVED_REFUND' | 'RESOLVED_ESCROW_RELEASE' | 'REJECTED'

  const dispute = db.disputes.get(id);
  if (!dispute) {
    return res.status(404).json({ success: false, error: 'Dispute not found' });
  }

  dispute.status = resolutionStatus as DisputeStatus;
  dispute.resolutionNotes = resolutionNotes;
  dispute.resolvedByAdminId = adminId || 'usr-admin-001';
  dispute.resolvedAt = new Date().toISOString();
  db.disputes.set(dispute.id, dispute);

  const shipment = db.shipments.get(dispute.shipmentId);
  if (shipment) {
    if (resolutionStatus === 'RESOLVED_REFUND') {
      shipment.currentStatus = 'CANCELLED';
      // Credit sender refund from forfeited escrow
      const senderWallet = db.wallets.get(shipment.senderId);
      if (senderWallet) {
        senderWallet.balance = Number((senderWallet.balance + dispute.claimAmount).toFixed(2));
        db.wallets.set(senderWallet.userId, senderWallet);
      }

      db.recordTransaction({
        transactionCode: `TXN-REF-${Date.now().toString().slice(-6)}`,
        walletId: `wlt-${shipment.senderId}`,
        userId: shipment.senderId,
        userName: shipment.senderName,
        shipmentId: shipment.id,
        type: 'REFUND',
        amount: dispute.claimAmount,
        currency: 'USD',
        exchangeRateToUsd: 1.0,
        idempotencyKey: `idemp-disp-ref-${dispute.id}`,
        status: 'COMMITTED',
        referenceNote: `Dispute claim refund approved by Master Admin (${dispute.reason})`,
      });
    } else {
      shipment.currentStatus = 'READY_FOR_PICKUP';
    }
    db.shipments.set(shipment.id, shipment);
  }

  db.logAudit({
    actorId: adminId || 'usr-admin-001',
    actorName: 'Master Admin',
    actorRole: 'MASTER_ADMIN',
    domain: 'Governance',
    action: `RESOLVE_DISPUTE_${resolutionStatus}`,
    resourceType: 'Dispute',
    resourceId: dispute.id,
    details: { notes: resolutionNotes },
  });

  res.json({
    success: true,
    message: `Dispute resolved with status: ${resolutionStatus}`,
    dispute,
  });
});

// Employee Management: List all employees
adminRouter.get('/employees', (req: Request, res: Response) => {
  const employees = Array.from(db.employees.values());
  res.json({ success: true, employees });
});

// Employee Management: Create new employee account
adminRouter.post('/employees', (req: Request, res: Response) => {
  const {
    fullName,
    email,
    phone,
    assignedHubId,
    role,
    passwordPin,
    permissions,
    adminId,
  } = req.body;

  if (!fullName || !email || !assignedHubId || !passwordPin) {
    return res.status(400).json({
      success: false,
      error: 'الاسم، البريد الإلكتروني، الفرع المعين، ورمز PIN هي حقول إجبارية.',
    });
  }

  const hub = db.hubs.get(assignedHubId);
  const hubCode = hub ? hub.code.split('-')[0] : 'HUB';
  const staffCode = `EMP-${hubCode}-${Math.floor(100 + Math.random() * 900)}`;
  const employeeId = `emp-${Date.now()}`;

  const newEmployee = {
    id: employeeId,
    staffCode,
    fullName,
    email,
    phone: phone || '+962 70 000 0000',
    assignedHubId,
    assignedHubName: hub ? `${hub.nameAr} (${hub.code})` : 'الفرع الميداني',
    role: role || 'HUB_AGENT',
    passwordPin,
    isActive: true,
    permissions: permissions || ['INTAKE_INSPECT', 'MANIFEST_BUILD', 'RECIPIENT_DELIVERY'],
    createdAt: new Date().toISOString(),
  };

  db.employees.set(newEmployee.id, newEmployee);

  // Register in user store as well
  db.users.set(newEmployee.id, {
    id: newEmployee.id,
    fullName: newEmployee.fullName,
    email: newEmployee.email,
    phone: newEmployee.phone,
    role: newEmployee.role,
    kycStatus: 'VERIFIED',
    isActive: true,
    preferredLocale: 'ar',
    assignedHubId: newEmployee.assignedHubId,
    staffCode: newEmployee.staffCode,
    createdAt: newEmployee.createdAt,
  });

  db.logAudit({
    actorId: adminId || 'usr-admin-001',
    actorName: 'Master Admin',
    actorRole: 'MASTER_ADMIN',
    domain: 'HubOperations',
    action: 'CREATE_EMPLOYEE_ACCOUNT',
    resourceType: 'Employee',
    resourceId: newEmployee.id,
    details: { staffCode: newEmployee.staffCode, hubId: assignedHubId, role: newEmployee.role },
  });

  res.json({
    success: true,
    message: `تم إنشاء حساب الموظف ${newEmployee.fullName} برقم وظيفي (${newEmployee.staffCode}) بنجاح.`,
    employee: newEmployee,
  });
});

// Employee Management: Toggle Active status
adminRouter.post('/employees/:id/toggle', (req: Request, res: Response) => {
  const { id } = req.params;
  const { adminId } = req.body;
  const employee = db.employees.get(id);

  if (!employee) {
    return res.status(404).json({ success: false, error: 'الموظف غير موجود' });
  }

  employee.isActive = !employee.isActive;
  db.employees.set(employee.id, employee);

  const user = db.users.get(employee.id);
  if (user) {
    user.isActive = employee.isActive;
    db.users.set(user.id, user);
  }

  db.logAudit({
    actorId: adminId || 'usr-admin-001',
    actorName: 'Master Admin',
    actorRole: 'MASTER_ADMIN',
    domain: 'HubOperations',
    action: employee.isActive ? 'ACTIVATE_EMPLOYEE' : 'DEACTIVATE_EMPLOYEE',
    resourceType: 'Employee',
    resourceId: employee.id,
    details: { staffCode: employee.staffCode, isActive: employee.isActive },
  });

  res.json({
    success: true,
    message: `تم ${employee.isActive ? 'تفعيل' : 'تعطيل'} حساب الموظف ${employee.fullName} بنجاح.`,
    employee,
  });
});

// Admin KYC Decision (Approve / Reject traveler or sender verification)
adminRouter.post('/kyc-decision', (req: Request, res: Response) => {
  const { userId, status, adminId } = req.body;
  const user = db.users.get(userId);

  if (!user) {
    return res.status(404).json({ success: false, error: 'User not found' });
  }

  user.kycStatus = status === 'APPROVED' ? 'VERIFIED' : 'REJECTED';
  db.users.set(user.id, user);

  db.logAudit({
    actorId: adminId || 'usr-admin-001',
    actorName: 'Master Admin',
    actorRole: 'MASTER_ADMIN',
    domain: 'Governance',
    action: `KYC_DECISION_${status}`,
    resourceType: 'User',
    resourceId: user.id,
    details: { targetUser: user.fullName, newKycStatus: user.kycStatus },
  });

  return res.json({
    success: true,
    message: `KYC status for ${user.fullName} updated to ${user.kycStatus}.`,
    user,
  });
});

