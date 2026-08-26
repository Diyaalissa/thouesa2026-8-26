import { Request, Response, Router } from 'express';
import { db } from '../store';
import { Shipment, Trip, TripStatus } from '../../src/types';
import { ROUTE_PRICING } from '../../src/lib/constants';

export const tripsRouter = Router();

// List all trips
tripsRouter.get('/', (req: Request, res: Response) => {
  const { travelerId, status, originHubId, destHubId } = req.query;
  let list = Array.from(db.trips.values());

  if (travelerId) {
    list = list.filter((t) => t.travelerId === travelerId);
  }
  if (status) {
    list = list.filter((t) => t.status === status);
  }
  if (originHubId) {
    list = list.filter((t) => t.originHubId === originHubId);
  }
  if (destHubId) {
    list = list.filter((t) => t.destinationHubId === destHubId);
  }

  list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  res.json({ success: true, trips: list });
});

// Register new flight trip
tripsRouter.post('/', (req: Request, res: Response) => {
  const {
    travelerId,
    travelerName,
    travelerPhone,
    originHubId,
    destinationHubId,
    airline,
    flightNumber,
    pnrCode,
    departureTime,
    arrivalTime,
    availableWeightKg,
    ticketDocUrl,
  } = req.body;

  const originHub = db.hubs.get(originHubId);
  const destHub = db.hubs.get(destinationHubId);

  if (!originHub || !destHub) {
    return res.status(400).json({ success: false, error: 'Invalid origin or destination hub.' });
  }

  const route = ROUTE_PRICING.find(
    (r) => r.originCountry === originHub.countryCode && r.destinationCountry === destHub.countryCode
  ) || { travelerShareKg: 12.0 };

  const weight = Number(availableWeightKg);
  const pricePerKg = route.travelerShareKg;
  const estimatedEarnings = Number((weight * pricePerKg).toFixed(2));

  // Initial required escrow deposit estimated at 50$ per kg (or exact package declared value upon assignment)
  const requiredDeposit = Number((weight * 35.0).toFixed(2));

  const newTrip: Trip = {
    id: `trip-${Date.now()}`,
    travelerId,
    travelerName: travelerName || 'Traveler',
    travelerPhone: travelerPhone || '+962 79 000 0000',
    travelerRating: 4.95,
    originHubId,
    destinationHubId,
    airline: airline || 'Middle East Airlines',
    flightNumber: flightNumber || 'ME-302',
    pnrCode: pnrCode || 'PNR771X',
    departureTime: departureTime || new Date(Date.now() + 48 * 3600000).toISOString(),
    arrivalTime: arrivalTime || new Date(Date.now() + 54 * 3600000).toISOString(),
    availableWeightKg: weight,
    allocatedWeightKg: 0.0,
    pricePerKgEarned: pricePerKg,
    totalEarningsEstimated: estimatedEarnings,
    requiredEscrowDeposit: requiredDeposit,
    isEscrowPaid: false,
    status: 'VERIFIED', // Auto-verified in prototype simulation
    ticketDocUrl: ticketDocUrl || '/docs/tickets/sample-ticket.pdf',
    createdAt: new Date().toISOString(),
  };

  db.trips.set(newTrip.id, newTrip);

  db.logAudit({
    actorId: travelerId,
    actorName: travelerName,
    actorRole: 'TRAVELER',
    domain: 'Capacity',
    action: 'REGISTER_TRIP',
    resourceType: 'Trip',
    resourceId: newTrip.id,
    details: {
      flightNumber: newTrip.flightNumber,
      pnrCode: newTrip.pnrCode,
      availableWeightKg: weight,
    },
  });

  res.status(201).json({
    success: true,
    message: 'Flight trip registered and PNR verified. Please lock your refundable escrow deposit.',
    trip: newTrip,
  });
});

// Exchange rate lookup helper for multi-currency rate freezing
const CURRENCY_RATES_TO_USD: Record<string, number> = {
  USD: 1.0,
  JOD: 0.709, // 1 USD = 0.709 JOD
  DZD: 220.0, // 1 USD = 220 DZD
  SAR: 3.75,  // 1 USD = 3.75 SAR
  EGP: 48.5,  // 1 USD = 48.5 EGP
};

// Lock Escrow Deposit for Trip with Multi-Currency Exchange Rate Lock
tripsRouter.post('/:id/lock-escrow', (req: Request, res: Response) => {
  const { id } = req.params;
  const { currency = 'USD' } = req.body;
  const trip = db.trips.get(id);

  if (!trip) {
    return res.status(404).json({ success: false, error: 'Trip not found' });
  }

  const wallet = db.wallets.get(trip.travelerId);
  if (!wallet) {
    return res.status(404).json({ success: false, error: 'Traveler wallet not found' });
  }

  const depositAmountUsd = trip.requiredEscrowDeposit;
  const rateToUsd = CURRENCY_RATES_TO_USD[currency] || 1.0;
  const localAmount = Number((depositAmountUsd * rateToUsd).toFixed(2));

  // Debit balance & move to locked escrow
  wallet.balance = Math.max(0, Number((wallet.balance - depositAmountUsd).toFixed(2)));
  wallet.lockedEscrowDeposit = Number((wallet.lockedEscrowDeposit + depositAmountUsd).toFixed(2));
  wallet.updatedAt = new Date().toISOString();
  db.wallets.set(wallet.userId, wallet);

  trip.isEscrowPaid = true;
  trip.status = 'ESCROW_LOCKED';
  db.trips.set(trip.id, trip);

  db.recordTransaction({
    transactionCode: `TXN-ESC-${Date.now().toString().slice(-6)}`,
    walletId: wallet.id,
    userId: trip.travelerId,
    userName: trip.travelerName,
    tripId: trip.id,
    type: 'ESCROW_LOCK',
    amount: depositAmountUsd,
    currency: 'USD',
    exchangeRateToUsd: rateToUsd,
    localCurrencyAmount: localAmount,
    idempotencyKey: `idemp-lock-esc-${trip.id}`,
    status: 'COMMITTED',
    referenceNote: `Refundable escrow deposit locked for flight ${trip.flightNumber} ($${depositAmountUsd} / ${localAmount} ${currency} rate locked @ ${rateToUsd})`,
  });

  db.logAudit({
    actorId: trip.travelerId,
    actorName: trip.travelerName,
    actorRole: 'TRAVELER',
    domain: 'Escrow',
    action: 'LOCK_SECURITY_DEPOSIT',
    resourceType: 'Trip',
    resourceId: trip.id,
    details: { amountUsd: depositAmountUsd, localAmount, currency, rateToUsd, flight: trip.flightNumber },
  });

  res.json({
    success: true,
    message: `Security deposit ($${depositAmountUsd}) locked with exchange rate frozen (${rateToUsd} ${currency}/USD). Manifest will be dispatched by Origin Hub.`,
    trip,
    wallet,
    exchangeRateFrozen: rateToUsd,
  });
});

// Comprehensive Flight Exception & Auto-Reroute Engine
tripsRouter.post('/:id/handle-exception', (req: Request, res: Response) => {
  const { id } = req.params;
  const { exceptionType, delayHours, newDepartureTime, notes } = req.body;
  const trip = db.trips.get(id);

  if (!trip) {
    return res.status(404).json({ success: false, error: 'Trip not found' });
  }

  if (exceptionType === 'FLIGHT_DELAYED') {
    const hours = Number(delayHours) || 4;
    const currentDep = new Date(trip.departureTime);
    const updatedDep = newDepartureTime ? new Date(newDepartureTime) : new Date(currentDep.getTime() + hours * 3600000);
    const updatedArr = new Date(new Date(trip.arrivalTime).getTime() + hours * 3600000);

    trip.departureTime = updatedDep.toISOString();
    trip.arrivalTime = updatedArr.toISOString();
    trip.status = 'DELAYED';
    trip.emergencyReason = notes || `Flight delayed by ${hours} hours`;
    db.trips.set(trip.id, trip);

    // Notify assigned shipments
    const affectedShipments = Array.from(db.shipments.values()).filter((s) => s.assignedTripId === trip.id);

    db.logAudit({
      actorId: trip.travelerId,
      actorName: trip.travelerName,
      actorRole: 'TRAVELER',
      domain: 'Logistics',
      action: 'FLIGHT_DELAYED_UPDATE',
      resourceType: 'Trip',
      resourceId: trip.id,
      details: {
        newDeparture: trip.departureTime,
        affectedPackagesCount: affectedShipments.length,
        notes: trip.emergencyReason,
      },
    });

    return res.json({
      success: true,
      message: `Flight delay recorded (+${hours}h). Senders and Hubs have been notified with updated ETA.`,
      trip,
      affectedShipmentsCount: affectedShipments.length,
    });
  }

  if (exceptionType === 'TRAVELER_NO_SHOW' || exceptionType === 'FLIGHT_CANCELLED') {
    trip.status = 'CANCELLED';
    trip.emergencyReason = notes || (exceptionType === 'TRAVELER_NO_SHOW' ? 'Traveler did not show up for package handover at Hub' : 'Flight cancelled by airline');
    db.trips.set(trip.id, trip);

    // 1. Safe Escrow Release with Rate Lock
    const wallet = db.wallets.get(trip.travelerId);
    if (wallet && trip.isEscrowPaid) {
      wallet.lockedEscrowDeposit = Math.max(0, Number((wallet.lockedEscrowDeposit - trip.requiredEscrowDeposit).toFixed(2)));
      wallet.balance = Number((wallet.balance + trip.requiredEscrowDeposit).toFixed(2));
      db.wallets.set(wallet.userId, wallet);

      db.recordTransaction({
        transactionCode: `TXN-REL-${Date.now().toString().slice(-6)}`,
        walletId: wallet.id,
        userId: trip.travelerId,
        userName: trip.travelerName,
        tripId: trip.id,
        type: 'ESCROW_RELEASE',
        amount: trip.requiredEscrowDeposit,
        currency: 'USD',
        exchangeRateToUsd: 1.0,
        idempotencyKey: `idemp-rel-cancel-${trip.id}-${Date.now()}`,
        status: 'COMMITTED',
        referenceNote: `Escrow security deposit unlocked due to exception: ${trip.emergencyReason}`,
      });
    }

    // 2. Auto-reroute engine: unassign packages and revert status back to INSPECTED_SEALED in Origin Hub queue
    const unassignedShipments: Shipment[] = [];
    Array.from(db.shipments.values())
      .filter((s) => s.assignedTripId === trip.id)
      .forEach((s) => {
        s.assignedTripId = undefined;
        s.assignedTravelerId = undefined;
        s.assignedTravelerName = undefined;
        s.flightNumber = undefined;
        s.airline = undefined;
        s.currentStatus = 'INSPECTED_SEALED';
        s.updatedAt = new Date().toISOString();
        db.shipments.set(s.id, s);
        unassignedShipments.push(s);
      });

    db.logAudit({
      actorId: 'SYSTEM',
      actorName: 'Auto-Reroute Engine',
      actorRole: 'MASTER_ADMIN',
      domain: 'Logistics',
      action: 'EXCEPTION_AUTO_REROUTE_UNASSIGN',
      resourceType: 'Trip',
      resourceId: trip.id,
      details: {
        reason: trip.emergencyReason,
        unassignedCount: unassignedShipments.length,
        unassignedIds: unassignedShipments.map((s) => s.id),
      },
    });

    return res.json({
      success: true,
      message: `Exception processed (${exceptionType}). Traveler escrow unlocked without penalty and ${unassignedShipments.length} parcel(s) returned to Origin Hub queue for next flight.`,
      trip,
      unassignedShipmentsCount: unassignedShipments.length,
    });
  }

  res.status(400).json({ success: false, error: 'Invalid exception type specified' });
});

// Emergency Unassign alias for backward compatibility
tripsRouter.post('/:id/emergency-unassign', (req: Request, res: Response) => {
  const { id } = req.params;
  const { reason } = req.body;
  req.body.exceptionType = 'FLIGHT_CANCELLED';
  req.body.notes = reason;
  // Delegate directly to handle-exception
  const trip = db.trips.get(id);
  if (!trip) {
    return res.status(404).json({ success: false, error: 'Trip not found' });
  }

  trip.status = 'CANCELLED';
  trip.emergencyReason = reason || 'Flight cancelled by airline';
  db.trips.set(trip.id, trip);

  const wallet = db.wallets.get(trip.travelerId);
  if (wallet && trip.isEscrowPaid) {
    wallet.lockedEscrowDeposit = Math.max(0, Number((wallet.lockedEscrowDeposit - trip.requiredEscrowDeposit).toFixed(2)));
    wallet.balance = Number((wallet.balance + trip.requiredEscrowDeposit).toFixed(2));
    db.wallets.set(wallet.userId, wallet);
  }

  Array.from(db.shipments.values())
    .filter((s) => s.assignedTripId === trip.id)
    .forEach((s) => {
      s.assignedTripId = undefined;
      s.assignedTravelerId = undefined;
      s.assignedTravelerName = undefined;
      s.currentStatus = 'INSPECTED_SEALED';
      s.updatedAt = new Date().toISOString();
      db.shipments.set(s.id, s);
    });

  res.json({
    success: true,
    message: 'Trip safely unassigned. Escrow deposit returned to traveler and shipments re-queued for next flight.',
    trip,
  });
});

// Upload Document for Trip
tripsRouter.post('/:id/documents', (req: Request, res: Response) => {
  const { id } = req.params;
  const { docType, fileData, fileName } = req.body;
  
  const trip = db.trips.get(id);
  if (!trip) {
    return res.status(404).json({ success: false, error: 'Trip not found' });
  }
  
  // In a real MariaDB/cPanel environment, fileData (Base64) would be saved to disk
  // and the path saved to the DB. Here we just store a mock URL indicating success.
  const docUrl = `/uploads/trips/${id}/${docType}-${Date.now()}.png`;
  
  if (!trip.documents) {
    trip.documents = {};
  }
  trip.documents[docType] = { url: docUrl, fileName, uploadedAt: new Date().toISOString() };
  
  db.trips.set(trip.id, trip);
  
  db.logAudit({
    actorId: trip.travelerId,
    actorName: trip.travelerName,
    actorRole: 'TRAVELER',
    domain: 'Compliance',
    action: 'UPLOAD_DOCUMENT',
    resourceType: 'Trip',
    resourceId: trip.id,
    details: { docType, fileName }
  });
  
  // Also create a notification for admins
  db.pushNotification({
    type: 'SYSTEM_ALERT',
    titleEn: 'New Traveler Document',
    titleAr: 'مستند مسافر جديد',
    messageEn: `Traveler ${trip.travelerName} uploaded ${docType} for flight ${trip.flightNumber}.`,
    messageAr: `قام المسافر ${trip.travelerName} برفع ${docType} للرحلة ${trip.flightNumber}.`,
    targetRole: 'ADMIN',
    referenceId: trip.id,
    priority: 'NORMAL'
  });

  res.json({ success: true, trip, message: 'Document uploaded successfully' });
});
