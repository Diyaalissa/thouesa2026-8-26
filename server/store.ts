import {
  AuditLog,
  Dispute,
  Employee,
  EscrowWallet,
  FinancialTransaction,
  Hub,
  Manifest,
  Shipment,
  Trip,
  User,
} from '../src/types';
import { DEMO_PROFILES, HUBS_DATA, INITIAL_EMPLOYEES } from '../src/lib/constants';

class DataStore {
  public users: Map<string, User> = new Map();
  public employees: Map<string, Employee> = new Map();
  public hubs: Map<string, Hub> = new Map();
  public trips: Map<string, Trip> = new Map();
  public shipments: Map<string, Shipment> = new Map();
  public manifests: Map<string, Manifest> = new Map();
  public wallets: Map<string, EscrowWallet> = new Map();
  public transactions: Map<string, FinancialTransaction> = new Map();
  public disputes: Map<string, Dispute> = new Map();
  public auditLogs: AuditLog[] = [];

  constructor() {
    this.seedInitialData();
  }

  private seedInitialData() {
    // 1. Seed Hubs
    HUBS_DATA.forEach((hub) => {
      this.hubs.set(hub.id, { ...hub });
    });

    // 1.1 Seed Employees
    INITIAL_EMPLOYEES.forEach((emp) => {
      this.employees.set(emp.id, { ...emp });
      // Also register as a system user for unified auth
      this.users.set(emp.id, {
        id: emp.id,
        fullName: emp.fullName,
        email: emp.email,
        phone: emp.phone,
        role: emp.role,
        kycStatus: 'VERIFIED',
        isActive: emp.isActive,
        preferredLocale: 'ar',
        assignedHubId: emp.assignedHubId,
        staffCode: emp.staffCode,
        createdAt: emp.createdAt,
      });
    });

    // 2. Seed Users
    Object.values(DEMO_PROFILES).forEach((user) => {
      this.users.set(user.id, { ...user });
      this.wallets.set(user.id, {
        id: `wlt-${user.id}`,
        userId: user.id,
        balance: user.role === 'TRAVELER' ? 1450.0 : user.role === 'SENDER' ? 850.0 : 0.0,
        lockedEscrowDeposit: user.role === 'TRAVELER' ? 650.0 : 0.0,
        pendingEarnings: user.role === 'TRAVELER' ? 320.0 : 0.0,
        currency: 'USD',
        updatedAt: new Date().toISOString(),
      });
    });

    // Extra users for realistic lists
    const extraTraveler: User = {
      id: 'usr-traveler-203',
      fullName: 'سمير خلوفي (Samir Kheloufi)',
      email: 'samir.k@thouesa.com',
      phone: '+213 66 112 3344',
      role: 'TRAVELER',
      kycStatus: 'VERIFIED',
      isActive: true,
      preferredLocale: 'ar',
      passportNumber: 'DZ991044',
      rating: 4.88,
      totalTrips: 12,
      createdAt: '2025-10-01T09:00:00Z',
    };
    this.users.set(extraTraveler.id, extraTraveler);
    this.wallets.set(extraTraveler.id, {
      id: `wlt-${extraTraveler.id}`,
      userId: extraTraveler.id,
      balance: 890.0,
      lockedEscrowDeposit: 200.0,
      pendingEarnings: 150.0,
      currency: 'USD',
      updatedAt: new Date().toISOString(),
    });

    // 3. Seed Trips
    const trip1: Trip = {
      id: 'trip-amm-alg-801',
      travelerId: 'usr-traveler-202',
      travelerName: 'كريم بوجمعة (Karim Boujemaa)',
      travelerPhone: '+213 55 987 6543',
      travelerRating: 4.96,
      originHubId: 'hub-amm',
      destinationHubId: 'hub-alg',
      airline: 'Royal Jordanian (RJ-511)',
      flightNumber: 'RJ511',
      pnrCode: 'RJ892B',
      departureTime: new Date(Date.now() + 18 * 3600000).toISOString(),
      arrivalTime: new Date(Date.now() + 24 * 3600000).toISOString(),
      availableWeightKg: 18.0,
      allocatedWeightKg: 9.5,
      pricePerKgEarned: 12.0,
      totalEarningsEstimated: 114.0,
      requiredEscrowDeposit: 650.0,
      isEscrowPaid: true,
      status: 'ESCROW_PAID',
      ticketDocUrl: '/docs/tickets/pnr-RJ892B.pdf',
      createdAt: new Date(Date.now() - 48 * 3600000).toISOString(),
    };

    const trip2: Trip = {
      id: 'trip-cai-amm-802',
      travelerId: 'usr-traveler-203',
      travelerName: 'سمير خلوفي (Samir Kheloufi)',
      travelerPhone: '+213 66 112 3344',
      travelerRating: 4.88,
      originHubId: 'hub-cai',
      destinationHubId: 'hub-amm',
      airline: 'EgyptAir (MS-719)',
      flightNumber: 'MS719',
      pnrCode: 'MS441Q',
      departureTime: new Date(Date.now() + 42 * 3600000).toISOString(),
      arrivalTime: new Date(Date.now() + 44 * 3600000).toISOString(),
      availableWeightKg: 15.0,
      allocatedWeightKg: 4.0,
      pricePerKgEarned: 8.0,
      totalEarningsEstimated: 32.0,
      requiredEscrowDeposit: 200.0,
      isEscrowPaid: true,
      status: 'VERIFIED',
      ticketDocUrl: '/docs/tickets/pnr-MS441Q.pdf',
      createdAt: new Date(Date.now() - 24 * 3600000).toISOString(),
    };

    this.trips.set(trip1.id, trip1);
    this.trips.set(trip2.id, trip2);

    // 4. Seed Shipments & Service Orders
    const ship1: Shipment = {
      id: 'ship-101',
      trackingNumber: 'TH-JOR-ALG-202608-8841',
      serviceType: 'SEND_PARCEL',
      senderId: 'usr-sender-101',
      senderName: 'طارق الهاشمي',
      senderPhone: '+962 79 123 4567',
      originHubId: 'hub-amm',
      destinationHubId: 'hub-alg',
      recipientName: 'أمين بلحاج (Amine Belhadj)',
      recipientPhone: '+213 77 441 9922',
      recipientAddress: 'حي حيدرة، نهج الإخوة بوعدو، الجزائر العاصمة',
      recipientNationalId: 'DZ-09812441',
      itemCategory: 'ELECTRONICS',
      itemDescription: 'جهاز iPad Pro 11-inch مع كيبورد أصلي مغلف ومفحوص أمنياً',
      orderItems: [
        {
          id: 'item-101-1',
          name: 'iPad Pro 11" 256GB M4 Wi-Fi (Space Black)',
          quantity: 1,
          unitPrice: 550.0,
          totalCost: 550.0,
          notes: 'مغلف بغلاف المصنع الأصلي',
        },
        {
          id: 'item-101-2',
          name: 'Magic Keyboard for iPad Pro 11"',
          quantity: 1,
          unitPrice: 100.0,
          totalCost: 100.0,
          notes: 'ملحقات إضافية',
        }
      ],
      itemPhotos: [
        'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400&auto=format&fit=crop&q=80',
      ],
      declaredValue: 650.0,
      currency: 'USD',
      estimatedWeightKg: 2.2,
      actualWeightKg: 2.3,
      dimensionsCm: { length: 28, width: 22, height: 6 },
      securitySealId: 'SEAL-AMM-98231',
      shippingCost: 52.5,
      insuranceFee: 4.5,
      customsDutyEstimated: 0.0,
      escrowDepositRequired: 650.0,
      currentStatus: 'ASSIGNED_TO_TRIP',
      senderLegalWaiverSigned: true,
      senderLegalWaiverTimestamp: new Date(Date.now() - 36 * 3600000).toISOString(),
      paymentMethod: 'WALLET',
      assignedTripId: trip1.id,
      assignedTravelerId: trip1.travelerId,
      assignedTravelerName: trip1.travelerName,
      flightNumber: 'RJ511',
      airline: 'Royal Jordanian',
      inspectionPhotos: [
        'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=600&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=600&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&auto=format&fit=crop&q=80'
      ],
      inspectionNotes: 'تم فحص الشاشة والبطارية، مطابقة للمواصفات وخالية من أي بطاريات منتفخة أو سوائل. تم تثبيت قفل الأمان الإلكتروني SEAL-AMM-98231.',
      inspectedByAgentId: 'usr-agent-303',
      inspectedAt: new Date(Date.now() - 12 * 3600000).toISOString(),
      idempotencyKey: 'idemp-ship-101-seed',
      createdAt: new Date(Date.now() - 36 * 3600000).toISOString(),
      updatedAt: new Date(Date.now() - 12 * 3600000).toISOString(),
    };

    const ship2: Shipment = {
      id: 'ship-102',
      trackingNumber: 'TH-AMZ-USA-ALG-9022',
      serviceType: 'INTERNATIONAL_BUY',
      senderId: 'usr-sender-101',
      senderName: 'طارق الهاشمي',
      senderPhone: '+962 79 123 4567',
      originHubId: 'hub-amm',
      destinationHubId: 'hub-alg',
      recipientName: 'طارق الهاشمي',
      recipientPhone: '+962 79 123 4567',
      recipientAddress: 'عمان، شارع المدينة المنورة، مجمع الروابي',
      itemCategory: 'ELECTRONICS',
      itemDescription: 'طلب شراء من Amazon US: بنك طاقة وسماعات عازلة للضوضاء',
      orderItems: [
        {
          id: 'item-102-1',
          name: 'Anker Prime Power Bank 27,650mAh (250W)',
          url: 'https://amazon.com/dp/B0BYP2F3SG',
          quantity: 2,
          unitPrice: 120.0,
          totalCost: 240.0,
          notes: 'Amazon US Official Store',
        },
        {
          id: 'item-102-2',
          name: 'Sony WH-1000XM5 Wireless Headphones',
          url: 'https://amazon.com/dp/B09XS7JWHH',
          quantity: 1,
          unitPrice: 280.0,
          totalCost: 280.0,
          notes: 'لون أسود مع علبة السفر',
        }
      ],
      itemPhotos: [
        'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&auto=format&fit=crop&q=80',
      ],
      inspectionPhotos: [
        'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=600&auto=format&fit=crop&q=80',
      ],
      declaredValue: 520.0,
      currency: 'USD',
      estimatedWeightKg: 1.8,
      actualWeightKg: 1.85,
      dimensionsCm: { length: 30, width: 22, height: 12 },
      securitySealId: 'SEAL-AMM-98232',
      shippingCost: 38.0,
      insuranceFee: 3.0,
      customsDutyEstimated: 15.0,
      escrowDepositRequired: 520.0,
      currentStatus: 'INSPECTED_SEALED',
      senderLegalWaiverSigned: true,
      senderLegalWaiverTimestamp: new Date(Date.now() - 20 * 3600000).toISOString(),
      inspectionNotes: 'تم استلام المنتجات من المتجر العالمي وتدقيق الفواتير وأرقام السيريال وتغليفها أمنياً مع قفل SEAL-AMM-98232.',
      inspectedByAgentId: 'usr-agent-303',
      inspectedAt: new Date(Date.now() - 6 * 3600000).toISOString(),
      idempotencyKey: 'idemp-ship-102-seed',
      createdAt: new Date(Date.now() - 20 * 3600000).toISOString(),
      updatedAt: new Date(Date.now() - 6 * 3600000).toISOString(),
    };

    const ship3: Shipment = {
      id: 'ship-103',
      trackingNumber: 'TH-BUY-JOR-ALG-4411',
      serviceType: 'SPECIFIC_COUNTRY_BUY',
      senderId: 'usr-sender-101',
      senderName: 'طارق الهاشمي',
      senderPhone: '+962 79 123 4567',
      originHubId: 'hub-amm',
      destinationHubId: 'hub-alg',
      recipientName: 'د. ليلى عماري (Dr. Leila Ammari)',
      recipientPhone: '+213 55 220 8811',
      recipientAddress: 'جامعة الجزائر 1، كلية الصيدلة، بن عكنون',
      itemCategory: 'GIFTS_COSMETICS',
      itemDescription: 'شراء منتجات أردنية حصرية: أملاح وطين البحر الميت مع زعفران محلي فاخر',
      orderItems: [
        {
          id: 'item-103-1',
          name: 'مجموعة مستحضرات البحر الميت الملكية (طين + أملاح + سيروم)',
          countryOrigin: 'JOR',
          quantity: 3,
          unitPrice: 45.0,
          totalCost: 135.0,
          notes: 'ماركة ريفاج الأصلية من عمان',
        },
        {
          id: 'item-103-2',
          name: 'شال حريري مطرز تطريز يدوي فلسطيني/أردني أصيل',
          countryOrigin: 'JOR',
          quantity: 2,
          unitPrice: 65.0,
          totalCost: 130.0,
          notes: 'شغل يدوي تراثي فاخر',
        }
      ],
      itemPhotos: [
        'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400&auto=format&fit=crop&q=80',
      ],
      declaredValue: 265.0,
      currency: 'USD',
      estimatedWeightKg: 2.5,
      dimensionsCm: { length: 35, width: 25, height: 15 },
      shippingCost: 35.0,
      customsDutyEstimated: 0.0,
      escrowDepositRequired: 265.0,
      currentStatus: 'PENDING_HUB_DROPOFF',
      senderLegalWaiverSigned: true,
      senderLegalWaiverTimestamp: new Date(Date.now() - 8 * 3600000).toISOString(),
      idempotencyKey: 'idemp-ship-103-seed',
      createdAt: new Date(Date.now() - 8 * 3600000).toISOString(),
      updatedAt: new Date(Date.now() - 8 * 3600000).toISOString(),
    };

    // 4.1 Seed Overweight Shipment for instant testing of weight adjustment approval banner
    const ship4: Shipment = {
      id: 'ship-104',
      trackingNumber: 'TH-JOR-ALG-202608-9952',
      serviceType: 'SEND_PARCEL',
      senderId: 'usr-sender-101',
      senderName: 'طارق الهاشمي',
      senderPhone: '+962 79 123 4567',
      originHubId: 'hub-amm',
      destinationHubId: 'hub-alg',
      recipientName: 'بلال قدور (Bilel Kaddour)',
      recipientPhone: '+213 66 332 1199',
      recipientAddress: 'وهران، حي العقيد لطفي، إقامة النور',
      itemCategory: 'OTHER_SAFE_GOODS',
      itemDescription: 'قطع غيار طابعات ثلاثية الأبعاد وكتب هندسية ثقيلة',
      itemPhotos: [
        'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=400&auto=format&fit=crop&q=80',
      ],
      inspectionPhotos: [
        'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=600&auto=format&fit=crop&q=80',
      ],
      declaredValue: 350.0,
      currency: 'USD',
      estimatedWeightKg: 1.5,
      actualWeightKg: 2.8,
      dimensionsCm: { length: 30, width: 25, height: 18 },
      securitySealId: 'SEAL-AMM-99104',
      shippingCost: 28.0,
      insuranceFee: 2.5,
      customsDutyEstimated: 0.0,
      escrowDepositRequired: 350.0,
      currentStatus: 'WEIGHT_ADJUSTMENT_PENDING',
      senderLegalWaiverSigned: true,
      senderLegalWaiverTimestamp: new Date(Date.now() - 14 * 3600000).toISOString(),
      inspectionNotes: 'تم وزن الطرد على الميزان المعاير، الوزن الفعلي 2.8 كغ مقابل 1.5 كغ مقدر (+1.3 كغ فارق وزن). بانتظار موافقة العميل على فارق السعر.',
      inspectedByAgentId: 'usr-agent-303',
      inspectedAt: new Date(Date.now() - 2 * 3600000).toISOString(),
      weightDiscrepancy: {
        originalKg: 1.5,
        actualKg: 2.8,
        priceDelta: 23.4, // +$23.40
        status: 'PENDING_CUSTOMER_APPROVAL',
      },
      idempotencyKey: 'idemp-ship-104-seed',
      createdAt: new Date(Date.now() - 14 * 3600000).toISOString(),
      updatedAt: new Date(Date.now() - 2 * 3600000).toISOString(),
    };

    this.shipments.set(ship1.id, ship1);
    this.shipments.set(ship2.id, ship2);
    this.shipments.set(ship3.id, ship3);
    this.shipments.set(ship4.id, ship4);

    // 5. Seed Manifest
    const manifest1: Manifest = {
      id: 'man-8801',
      manifestCode: 'MAN-AMM-ALG-0824',
      tripId: trip1.id,
      travelerId: trip1.travelerId,
      originHubId: 'hub-amm',
      destinationHubId: 'hub-alg',
      dispatchedByAgentId: 'usr-agent-303',
      shipmentIds: [ship1.id],
      totalPackages: 1,
      totalWeightKg: 2.3,
      totalDeclaredValue: 650.0,
      handoverQrSecret: 'HMAC_SECRET_KEY_AMM_ALG_8801',
      status: 'PREPARING',
      tamperSealIds: [ship1.securitySealId!],
      createdAt: new Date(Date.now() - 4 * 3600000).toISOString(),
    };
    this.manifests.set(manifest1.id, manifest1);

    // 6. Seed Financial Transactions (Double-Entry Ledger)
    const tx1: FinancialTransaction = {
      id: 'tx-001',
      transactionCode: 'TXN-SHP-2026-1011',
      walletId: this.wallets.get('usr-sender-101')!.id,
      userId: 'usr-sender-101',
      userName: 'طارق الهاشمي',
      shipmentId: ship1.id,
      type: 'SHIPPING_PAYMENT',
      amount: 52.5,
      currency: 'USD',
      exchangeRateToUsd: 1.0,
      idempotencyKey: 'idemp-tx-001',
      status: 'COMMITTED',
      referenceNote: 'سداد رسوم الشحن والتأمين لطرد TH-JOR-ALG-202608-8841',
      createdAt: new Date(Date.now() - 36 * 3600000).toISOString(),
    };

    const tx2: FinancialTransaction = {
      id: 'tx-002',
      transactionCode: 'TXN-ESC-2026-2022',
      walletId: this.wallets.get('usr-traveler-202')!.id,
      userId: 'usr-traveler-202',
      userName: 'كريم بوجمعة',
      tripId: trip1.id,
      type: 'ESCROW_LOCK',
      amount: 650.0,
      currency: 'USD',
      exchangeRateToUsd: 1.0,
      idempotencyKey: 'idemp-tx-002',
      status: 'COMMITTED',
      referenceNote: 'حجز مبلغ الضمان المالي المسترد (Escrow) لرحلة RJ511 طرود بقيمة $650',
      createdAt: new Date(Date.now() - 24 * 3600000).toISOString(),
    };

    this.transactions.set(tx1.id, tx1);
    this.transactions.set(tx2.id, tx2);

    // 7. Seed Audit Logs
    this.auditLogs.push(
      {
        id: 'aud-001',
        actorId: 'usr-sender-101',
        actorName: 'طارق الهاشمي',
        actorRole: 'SENDER',
        domain: 'Logistics',
        action: 'CREATE_SHIPMENT',
        resourceType: 'Shipment',
        resourceId: ship1.id,
        details: { trackingNumber: ship1.trackingNumber, declaredValue: 650 },
        createdAt: new Date(Date.now() - 36 * 3600000).toISOString(),
      },
      {
        id: 'aud-002',
        actorId: 'usr-agent-303',
        actorName: 'عمر النجار',
        actorRole: 'HUB_AGENT',
        domain: 'HubOperations',
        action: 'INSPECT_AND_APPLY_SEAL',
        resourceType: 'Shipment',
        resourceId: ship1.id,
        details: { sealId: ship1.securitySealId, actualKg: 2.3 },
        createdAt: new Date(Date.now() - 12 * 3600000).toISOString(),
      },
      {
        id: 'aud-003',
        actorId: 'usr-traveler-202',
        actorName: 'كريم بوجمعة',
        actorRole: 'TRAVELER',
        domain: 'Escrow',
        action: 'LOCK_SECURITY_DEPOSIT',
        resourceType: 'Trip',
        resourceId: trip1.id,
        details: { amount: 650, pnr: 'RJ892B' },
        createdAt: new Date(Date.now() - 24 * 3600000).toISOString(),
      }
    );
  }

  // Helper Methods for Atomic Operations & Queries
  public logAudit(log: Omit<AuditLog, 'id' | 'createdAt'>): AuditLog {
    const fullLog: AuditLog = {
      ...log,
      id: `aud-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      createdAt: new Date().toISOString(),
    };
    this.auditLogs.unshift(fullLog);
    return fullLog;
  }

  public recordTransaction(tx: Omit<FinancialTransaction, 'id' | 'createdAt'>): FinancialTransaction {
    const fullTx: FinancialTransaction = {
      ...tx,
      id: `tx-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      createdAt: new Date().toISOString(),
    };
    this.transactions.set(fullTx.id, fullTx);
    return fullTx;
  }
}

export const db = new DataStore();
