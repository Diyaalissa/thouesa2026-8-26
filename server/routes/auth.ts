import { Request, Response, Router } from 'express';
import rateLimit from 'express-rate-limit';
import { db } from '../store';
import { DEMO_PROFILES } from '../../src/lib/constants';
import { KYCStatus, User, UserRole } from '../../src/types';
import { broadcastNotification } from './notifications';

export const authRouter = Router();

// Rate limiter for authentication and sign-in protection (Brute-force protection)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes window
  max: 30, // Limit each IP to 30 authentication requests per windowMs
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  message: {
    success: false,
    error: 'عدد محاولات تسجيل الدخول تجاوز الحد المسموح به. يرجى المحاولة بعد 15 دقيقة (Rate limit exceeded).',
  },
});

// Current session / active profile
let currentUserId = 'usr-sender-101';

authRouter.use('/signin', authLimiter);
authRouter.use('/signup', authLimiter);
authRouter.use('/employee-login', authLimiter);

authRouter.get('/me', (req: Request, res: Response) => {
  const user = db.users.get(currentUserId) || db.users.get('usr-sender-101');
  const wallet = db.wallets.get(currentUserId);
  res.json({
    success: true,
    user,
    wallet,
  });
});

// Sender / User Sign-Up
authRouter.post('/signup', (req: Request, res: Response) => {
  const { fullName, phone, email, address, password } = req.body;

  if (!fullName || !phone || !email) {
    return res.status(400).json({
      success: false,
      error: 'الاسم الكامل، رقم الهاتف، والبريد الإلكتروني حقول مطلوبة.',
    });
  }

  // Check if email already registered
  const existingUser = Array.from(db.users.values()).find(
    (u) => u.email.toLowerCase() === email.toLowerCase() || u.phone === phone
  );

  if (existingUser) {
    currentUserId = existingUser.id;
    const wallet = db.wallets.get(existingUser.id);
    return res.json({
      success: true,
      message: 'تم تسجيل الدخول إلى الحساب الموجود مسبقاً بنجاح.',
      user: existingUser,
      wallet,
    });
  }

  const newUserId = `usr-sender-${Date.now()}`;
  const targetRole = (req.body.role === 'TRAVELER' ? 'TRAVELER' : 'SENDER') as UserRole;
  const newUser: User = {
    id: newUserId,
    fullName,
    email,
    phone,
    address: address || '',
    role: targetRole,
    kycStatus: 'PENDING', // Verified later with identification
    isActive: true,
    preferredLocale: 'ar',
    totalShipments: 0,
    createdAt: new Date().toISOString(),
  };

  db.users.set(newUser.id, newUser);

  // Initialize Escrow Wallet with welcome credit for demo
  const wallet = {
    id: `wlt-${newUser.id}`,
    userId: newUser.id,
    balance: targetRole === 'TRAVELER' ? 1200.0 : 500.0,
    lockedEscrowDeposit: 0.0,
    pendingEarnings: 0.0,
    currency: 'USD' as const,
    updatedAt: new Date().toISOString(),
  };
  db.wallets.set(newUser.id, wallet);

  currentUserId = newUser.id;

  db.logAudit({
    actorId: newUser.id,
    actorName: newUser.fullName,
    actorRole: targetRole,
    domain: 'Identity',
    action: targetRole === 'TRAVELER' ? 'REGISTER_TRAVELER' : 'REGISTER_SENDER',
    resourceType: 'User',
    resourceId: newUser.id,
    details: { email, phone, address, role: targetRole, kycStatus: 'PENDING' },
  });

  res.json({
    success: true,
    message: 'تم تسجيل البيانات بنجاح وبانتظار رمز التوثيق وتأكيد الهوية.',
    user: newUser,
    wallet,
    verificationDetails: {
      phone,
      email,
      sampleOtp: '9842',
      expiresInMinutes: 10,
    },
  });
});

// Verify Registration OTP Code
authRouter.post('/verify-code', (req: Request, res: Response) => {
  const { userId, code, phone, email } = req.body;

  let user: User | undefined;
  if (userId) {
    user = db.users.get(userId);
  } else if (email) {
    user = Array.from(db.users.values()).find((u) => u.email.toLowerCase() === email.toLowerCase());
  } else if (phone) {
    user = Array.from(db.users.values()).find((u) => u.phone === phone);
  }

  if (!user) {
    user = db.users.get(currentUserId);
  }

  if (!user) {
    return res.status(404).json({ success: false, error: 'لم يتم العثور على الحساب المطلوب.' });
  }

  // Any 4 or 6 digit code or '9842'
  if (!code || code.length < 4) {
    return res.status(400).json({ success: false, error: 'الرجاء إدخال رمز التحقق المكون من 4 أرقام على الأقل.' });
  }

  // Update user KYC or verified status
  user.isActive = true;
  db.users.set(user.id, user);
  const wallet = db.wallets.get(user.id);

  db.logAudit({
    actorId: user.id,
    actorName: user.fullName,
    actorRole: user.role,
    domain: 'Identity',
    action: 'PHONE_EMAIL_VERIFIED',
    resourceType: 'User',
    resourceId: user.id,
    details: { code, verifiedAt: new Date().toISOString() },
  });

  res.json({
    success: true,
    message: 'تم التحقق من رقم الهاتف والبريد الإلكتروني بنجاح! حسابك جاهز للاستخدام.',
    user,
    wallet,
  });
});

// Resend Verification Code
authRouter.post('/resend-code', (req: Request, res: Response) => {
  const { phone, email } = req.body;

  res.json({
    success: true,
    message: `تم إرسال رمز تحقق جديد إلى ${phone || email || 'وسيلة الاتصال المسجلة'}.`,
    sampleOtp: '9842',
    expiresInMinutes: 10,
  });
});

// Sender / User Sign-In
authRouter.post('/signin', (req: Request, res: Response) => {
  const { identifier, password } = req.body;

  if (!identifier) {
    return res.status(400).json({ success: false, error: 'الرجاء إدخال البريد الإلكتروني أو رقم الهاتف.' });
  }

  const cleanIdent = identifier.trim().toLowerCase();
  const user = Array.from(db.users.values()).find(
    (u) => u.email.toLowerCase() === cleanIdent || u.phone.includes(cleanIdent) || u.fullName.toLowerCase().includes(cleanIdent)
  );

  if (!user) {
    // If not found in demo, let's pick default sender
    const defaultSender = db.users.get('usr-sender-101')!;
    currentUserId = defaultSender.id;
    return res.json({
      success: true,
      message: 'تم الدخول عبر الحساب التجريبي النشط.',
      user: defaultSender,
      wallet: db.wallets.get(defaultSender.id),
    });
  }

  currentUserId = user.id;
  const wallet = db.wallets.get(user.id);

  db.logAudit({
    actorId: user.id,
    actorName: user.fullName,
    actorRole: user.role,
    domain: 'Identity',
    action: 'SIGN_IN',
    resourceType: 'User',
    resourceId: user.id,
  });

  res.json({
    success: true,
    message: 'تم تسجيل الدخول بنجاح.',
    user,
    wallet,
  });
});

// Dedicated Staff / Employee Login
authRouter.post('/employee-login', (req: Request, res: Response) => {
  const { staffCodeOrEmail, passwordPin } = req.body;

  if (!staffCodeOrEmail) {
    return res.status(400).json({
      success: false,
      error: 'الرجاء إدخال الرقم الوظيفي (Staff Code) أو البريد الإلكتروني.',
    });
  }

  const query = staffCodeOrEmail.trim().toLowerCase();
  const employee = Array.from(db.employees.values()).find(
    (emp) =>
      emp.staffCode.toLowerCase() === query ||
      emp.email.toLowerCase() === query ||
      emp.id.toLowerCase() === query
  );

  if (!employee) {
    return res.status(401).json({
      success: false,
      error: 'لم يتم العثور على موظف مسجل بهذه البيانات. يرجى مراجعة مسؤول النظام المركزي.',
    });
  }

  if (passwordPin && employee.passwordPin && employee.passwordPin !== passwordPin) {
    return res.status(401).json({
      success: false,
      error: 'رمز المرور أو رقم PIN غير صحيح.',
    });
  }

  if (!employee.isActive) {
    return res.status(403).json({
      success: false,
      error: 'هذا الحساب الوظيفي معطل حالياً من قِبل الإدارة المركزية.',
    });
  }

  currentUserId = employee.id;
  const hub = db.hubs.get(employee.assignedHubId);

  db.logAudit({
    actorId: employee.id,
    actorName: employee.fullName,
    actorRole: employee.role,
    domain: 'HubOperations',
    action: 'EMPLOYEE_TERMINAL_LOGIN',
    resourceType: 'Employee',
    resourceId: employee.id,
    details: { staffCode: employee.staffCode, hubId: employee.assignedHubId },
  });

  res.json({
    success: true,
    message: `مرحباً بك يا ${employee.fullName} في محطة تشغيل ${hub?.nameAr || 'الفرع'}.`,
    employee,
    hub,
  });
});

// Switch active demo profile
authRouter.post('/switch-profile', (req: Request, res: Response) => {
  const { roleKey } = req.body;
  const targetProfile = DEMO_PROFILES[roleKey] || Object.values(DEMO_PROFILES).find(p => p.role === roleKey);

  if (!targetProfile) {
    return res.status(404).json({ success: false, error: 'Profile not found' });
  }

  currentUserId = targetProfile.id;
  const user = db.users.get(currentUserId);
  const wallet = db.wallets.get(currentUserId);

  db.logAudit({
    actorId: user!.id,
    actorName: user!.fullName,
    actorRole: user!.role,
    domain: 'Identity',
    action: 'SWITCH_DEMO_PROFILE',
    resourceType: 'User',
    resourceId: user!.id,
  });

  res.json({
    success: true,
    message: `Switched to ${user!.fullName} (${user!.role})`,
    user,
    wallet,
  });
});

// Submit KYC documents
authRouter.post('/kyc/submit', (req: Request, res: Response) => {
  const { nationalId, passportNumber, docUrl } = req.body;
  const user = db.users.get(currentUserId);

  if (!user) {
    return res.status(404).json({ success: false, error: 'User not found' });
  }

  user.nationalId = nationalId || user.nationalId;
  user.passportNumber = passportNumber || user.passportNumber;
  user.kycStatus = 'PENDING';
  db.users.set(user.id, user);

  db.logAudit({
    actorId: user.id,
    actorName: user.fullName,
    actorRole: user.role,
    domain: 'Identity',
    action: 'SUBMIT_KYC',
    resourceType: 'User',
    resourceId: user.id,
    details: { nationalId, passportNumber },
  });

  res.json({
    success: true,
    message: 'KYC documents submitted for admin review',
    user,
  });
});

// Admin verify or reject KYC
authRouter.post('/kyc/review', (req: Request, res: Response) => {
  const { userId, status, reason } = req.body;
  const user = db.users.get(userId);

  if (!user) {
    return res.status(404).json({ success: false, error: 'User not found' });
  }

  user.kycStatus = status as KYCStatus;
  db.users.set(user.id, user);

  db.logAudit({
    actorId: currentUserId,
    actorName: 'Admin',
    actorRole: 'MASTER_ADMIN',
    domain: 'Identity',
    action: `REVIEW_KYC_${status}`,
    resourceType: 'User',
    resourceId: user.id,
    details: { status, reason },
  });

  res.json({
    success: true,
    message: `KYC status updated to ${status}`,
    user,
  });
});

// Firebase Auth Sync
authRouter.post('/sync-firebase', (req: Request, res: Response) => {
  const { user } = req.body;
  if (!user || !user.id) {
    return res.status(400).json({ success: false, error: 'User data required' });
  }

  // Check if exists
  let existingUser = db.users.get(user.id);
  
  if (existingUser) {
    // Update
    existingUser = { ...existingUser, ...user };
    db.users.set(user.id, existingUser);
  } else {
    // Create new
    db.users.set(user.id, user);
    // Give them a welcome wallet
    const wallet = {
      id: `wlt-${user.id}`,
      userId: user.id,
      balance: user.role === 'TRAVELER' ? 1200.0 : 500.0,
      lockedEscrowDeposit: 0.0,
      pendingEarnings: 0.0,
      currency: 'USD' as const,
      updatedAt: new Date().toISOString(),
    };
    db.wallets.set(user.id, wallet);
    existingUser = user;
  }
  
  currentUserId = existingUser.id;
  
  res.json({
    success: true,
    user: existingUser,
    wallet: db.wallets.get(existingUser.id)
  });
});
