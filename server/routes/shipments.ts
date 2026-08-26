import { Request, Response, Router } from 'express';
import { db } from '../store';
import { calculateShippingQuote, generateTrackingNumber } from '../../src/lib/crypto';
import { Shipment, ShipmentStatus } from '../../src/types';

export const shipmentsRouter = Router();

// Get all shipments with optional filters
shipmentsRouter.get('/', (req: Request, res: Response) => {
  const { senderId, hubId, status } = req.query;
  let list = Array.from(db.shipments.values());

  if (senderId) {
    list = list.filter((s) => s.senderId === senderId);
  }
  if (hubId) {
    list = list.filter((s) => s.originHubId === hubId || s.destinationHubId === hubId);
  }
  if (status) {
    list = list.filter((s) => s.currentStatus === status);
  }

  // Sort descending by created date
  list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  res.json({ success: true, shipments: list });
});

// Get single shipment by ID or tracking number
shipmentsRouter.get('/:idOrTracking', (req: Request, res: Response) => {
  const { idOrTracking } = req.params;
  const shipment =
    db.shipments.get(idOrTracking) ||
    Array.from(db.shipments.values()).find((s) => s.trackingNumber === idOrTracking);

  if (!shipment) {
    return res.status(404).json({ success: false, error: 'Shipment not found' });
  }

  const originHub = db.hubs.get(shipment.originHubId);
  const destHub = db.hubs.get(shipment.destinationHubId);
  const assignedTrip = shipment.assignedTripId ? db.trips.get(shipment.assignedTripId) : null;

  res.json({
    success: true,
    shipment,
    originHub,
    destHub,
    assignedTrip,
  });
});

const CURRENCY_RATES: Record<string, number> = {
  USD: 1.0,
  JOD: 0.709,
  DZD: 220.0,
  SAR: 3.75,
  EGP: 48.5,
};

// Create new shipment / service order
shipmentsRouter.post('/', (req: Request, res: Response) => {
  const {
    senderId,
    senderName,
    senderPhone,
    serviceType,
    orderItems,
    originHubId,
    destinationHubId,
    recipientName,
    recipientPhone,
    recipientAddress,
    recipientNationalId,
    itemCategory,
    itemDescription,
    itemPhotos,
    declaredValue,
    estimatedWeightKg,
    dimensionsCm,
    prohibitedItemsAgreed,
    senderLegalWaiverSigned,
    sender_legal_waiver_signed,
    paymentMethod = 'WALLET',
    paymentCurrency = 'USD',
  } = req.body;

  // 1. Mandatory Legal & Customs Declaration Validation (HTTP 422 if not signed)
  const isWaiverSigned = senderLegalWaiverSigned === true || sender_legal_waiver_signed === true || prohibitedItemsAgreed === true;
  if (!isWaiverSigned) {
    return res.status(422).json({
      success: false,
      error: 'Mandatory Legal & Customs Declaration Waiver must be signed before proceeding with shipment creation.',
    });
  }

  const originHub = db.hubs.get(originHubId);
  const destHub = db.hubs.get(destinationHubId);

  if (!originHub || !destHub) {
    return res.status(400).json({ success: false, error: 'Invalid origin or destination hub.' });
  }

  const quote = calculateShippingQuote({
    originCountry: originHub.countryCode,
    destinationCountry: destHub.countryCode,
    weightKg: Number(estimatedWeightKg) || 1.0,
    lengthCm: dimensionsCm?.length || 20,
    widthCm: dimensionsCm?.width || 20,
    heightCm: dimensionsCm?.height || 20,
    declaredValueUsd: Number(declaredValue) || 100,
    category: itemCategory || 'GENERAL_MERCHANDISE',
  });

  const trackingNumber = generateTrackingNumber(originHub.countryCode, destHub.countryCode);
  const newShipmentId = `ship-${Date.now()}`;
  const idempotencyKey = `idemp-ship-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
  const rateToUsd = CURRENCY_RATES[paymentCurrency] || 1.0;
  const localAmount = Number((quote.totalCostUsd * rateToUsd).toFixed(2));
  const insuranceFee = Number((quote.totalCostUsd * 0.05).toFixed(2));

  const newShipment: Shipment = {
    id: newShipmentId,
    trackingNumber,
    serviceType: serviceType || 'SEND_PARCEL',
    senderId,
    senderName,
    senderPhone,
    originHubId,
    destinationHubId,
    recipientName: recipientName || senderName,
    recipientPhone: recipientPhone || senderPhone,
    recipientAddress: recipientAddress || '',
    recipientNationalId,
    itemCategory: itemCategory || 'GENERAL_MERCHANDISE',
    itemDescription,
    orderItems: orderItems || undefined,
    itemPhotos: itemPhotos || [
      'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400&auto=format&fit=crop&q=80',
    ],
    declaredValue: Number(declaredValue) || 100,
    currency: 'USD',
    estimatedWeightKg: Number(estimatedWeightKg) || 1.0,
    dimensionsCm: dimensionsCm || { length: 20, width: 20, height: 20 },
    shippingCost: quote.totalCostUsd,
    insuranceFee,
    customsDutyEstimated: serviceType === 'INTERNATIONAL_BUY' ? 15.0 : 0.0,
    escrowDepositRequired: quote.escrowDepositRequiredUsd,
    currentStatus: 'PENDING_HUB_DROPOFF',
    senderLegalWaiverSigned: true,
    senderLegalWaiverTimestamp: new Date().toISOString(),
    paymentMethod,
    paymentLocalAmount: localAmount,
    idempotencyKey,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  db.shipments.set(newShipment.id, newShipment);

  // Financial ledger: debit sender wallet if wallet payment selected
  const senderWallet = db.wallets.get(senderId);
  if (senderWallet && paymentMethod === 'WALLET') {
    senderWallet.balance = Math.max(0, Number((senderWallet.balance - quote.totalCostUsd).toFixed(2)));
    db.wallets.set(senderId, senderWallet);
  }

  db.recordTransaction({
    transactionCode: `TXN-SHP-${Date.now().toString().slice(-6)}`,
    walletId: senderWallet ? senderWallet.id : `wlt-${senderId}`,
    userId: senderId,
    userName: senderName,
    shipmentId: newShipment.id,
    type: 'SHIPPING_PAYMENT',
    amount: quote.totalCostUsd,
    currency: 'USD',
    exchangeRateToUsd: rateToUsd,
    localCurrencyAmount: localAmount,
    paymentGateway: paymentMethod,
    idempotencyKey: `idemp-tx-shp-${newShipment.id}`,
    status: 'COMMITTED',
    referenceNote: `Payment via ${paymentMethod} (${localAmount} ${paymentCurrency}) for tracking ${trackingNumber}`,
  });

  db.logAudit({
    actorId: senderId,
    actorName: senderName,
    actorRole: 'SENDER',
    domain: 'Logistics',
    action: 'CREATE_SHIPMENT_WITH_LEGAL_WAIVER',
    resourceType: 'Shipment',
    resourceId: newShipment.id,
    details: {
      trackingNumber,
      declaredValue,
      shippingCost: quote.totalCostUsd,
      paymentMethod,
      localAmount,
      currency: paymentCurrency,
      originHub: originHub.code,
      destinationHub: destHub.code,
    },
  });

  res.status(201).json({
    success: true,
    message: 'Shipment created successfully. Please drop off the package at your local Hub.',
    shipment: newShipment,
  });
});

// Direct approve weight adjustment endpoint
shipmentsRouter.post('/:id/approve-weight', (req: Request, res: Response) => {
  const { id } = req.params;
  const shipment = db.shipments.get(id);

  if (!shipment || !shipment.weightDiscrepancy) {
    return res.status(404).json({ success: false, error: 'Shipment or weight discrepancy record not found' });
  }

  const delta = shipment.weightDiscrepancy.priceDelta || 0;
  shipment.weightDiscrepancy.status = 'APPROVED';
  shipment.shippingCost = Number((shipment.shippingCost + delta).toFixed(2));
  shipment.currentStatus = 'INSPECTED_SEALED';
  shipment.updatedAt = new Date().toISOString();
  db.shipments.set(shipment.id, shipment);

  db.recordTransaction({
    transactionCode: `TXN-ADJ-${Date.now().toString().slice(-6)}`,
    walletId: `wlt-${shipment.senderId}`,
    userId: shipment.senderId,
    userName: shipment.senderName,
    shipmentId: shipment.id,
    type: 'PRICE_ADJUSTMENT',
    amount: delta,
    currency: 'USD',
    exchangeRateToUsd: 1.0,
    idempotencyKey: `idemp-adj-${shipment.id}-${Date.now()}`,
    status: 'COMMITTED',
    referenceNote: `Approved weight difference price delta (+$${delta}) for parcel ${shipment.trackingNumber}`,
  });

  db.logAudit({
    actorId: shipment.senderId,
    actorName: shipment.senderName,
    actorRole: 'SENDER',
    domain: 'Logistics',
    action: 'APPROVE_WEIGHT_DISCREPANCY',
    resourceType: 'Shipment',
    resourceId: shipment.id,
    details: { delta, newTotalCost: shipment.shippingCost },
  });

  res.json({
    success: true,
    message: `Overweight price adjustment (+$${delta}) approved. Parcel is ready for flight assignment!`,
    shipment,
  });
});

// Approve or Reject Weight Discrepancy (Customer approval workflow)
shipmentsRouter.post('/:id/weight-discrepancy/respond', (req: Request, res: Response) => {
  const { id } = req.params;
  const { action } = req.body; // 'APPROVE' | 'REJECT'
  const shipment = db.shipments.get(id);

  if (!shipment || !shipment.weightDiscrepancy) {
    return res.status(404).json({ success: false, error: 'Shipment or discrepancy not found' });
  }

  if (action === 'APPROVE') {
    shipment.weightDiscrepancy.status = 'APPROVED';
    shipment.shippingCost += shipment.weightDiscrepancy.priceDelta;
    shipment.currentStatus = 'INSPECTED_AND_SEALED';
    shipment.updatedAt = new Date().toISOString();
    db.shipments.set(shipment.id, shipment);

    // Record adjustment transaction
    db.recordTransaction({
      transactionCode: `TXN-ADJ-${Date.now().toString().slice(-6)}`,
      walletId: `wlt-${shipment.senderId}`,
      userId: shipment.senderId,
      userName: shipment.senderName,
      shipmentId: shipment.id,
      type: 'PRICE_ADJUSTMENT',
      amount: shipment.weightDiscrepancy.priceDelta,
      currency: 'USD',
      exchangeRateToUsd: 1.0,
      idempotencyKey: `idemp-adj-${shipment.id}`,
      status: 'COMMITTED',
      referenceNote: `Approved weight discrepancy charge for ${shipment.trackingNumber} (+${shipment.weightDiscrepancy.priceDelta}$)`,
    });

    db.logAudit({
      actorId: shipment.senderId,
      actorName: shipment.senderName,
      actorRole: 'SENDER',
      domain: 'Logistics',
      action: 'APPROVE_WEIGHT_DISCREPANCY',
      resourceType: 'Shipment',
      resourceId: shipment.id,
      details: { delta: shipment.weightDiscrepancy.priceDelta },
    });

    return res.json({
      success: true,
      message: 'Weight adjustment approved. Package is now scheduled for dispatch.',
      shipment,
    });
  } else {
    shipment.weightDiscrepancy.status = 'REJECTED';
    shipment.currentStatus = 'CANCELLED';
    shipment.updatedAt = new Date().toISOString();
    db.shipments.set(shipment.id, shipment);

    db.logAudit({
      actorId: shipment.senderId,
      actorName: shipment.senderName,
      actorRole: 'SENDER',
      domain: 'Logistics',
      action: 'REJECT_WEIGHT_DISCREPANCY',
      resourceType: 'Shipment',
      resourceId: shipment.id,
    });

    return res.json({
      success: true,
      message: 'Adjustment rejected. Package will be returned to sender at the origin hub.',
      shipment,
    });
  }
});
