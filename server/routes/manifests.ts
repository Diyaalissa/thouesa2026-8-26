import { Request, Response, Router } from 'express';
import { db } from '../store';
import { Manifest } from '../../src/types';
import { generateCryptographicHandoverToken, verifyCryptographicHandoverToken } from '../../src/lib/crypto';

export const manifestsRouter = Router();

// GET all manifests
manifestsRouter.get('/', (req: Request, res: Response) => {
  const manifests = Array.from(db.manifests.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  res.json({ success: true, manifests });
});

// GET single manifest
manifestsRouter.get('/:id', (req: Request, res: Response) => {
  const manifest = db.manifests.get(req.params.id);
  if (!manifest) {
    return res.status(404).json({ success: false, error: 'Manifest not found' });
  }
  res.json({ success: true, manifest });
});

// POST create manifest
manifestsRouter.post('/', (req: Request, res: Response) => {
  const {
    tripId,
    agentId,
    shipmentIds,
  } = req.body;

  const trip = db.trips.get(tripId);
  if (!trip) {
    return res.status(404).json({ success: false, error: 'Trip not found' });
  }

  const packages = Array.from(db.shipments.values()).filter((s) => shipmentIds.includes(s.id));
  if (packages.length === 0) {
    return res.status(400).json({ success: false, error: 'No valid packages selected for manifest' });
  }

  const totalWeight = Number(packages.reduce((sum, p) => sum + (p.actualWeightKg || p.estimatedWeightKg), 0).toFixed(2));
  const totalValue = Number(packages.reduce((sum, p) => sum + p.declaredValue, 0).toFixed(2));
  const sealIds = packages.map((p) => p.securitySealId).filter(Boolean) as string[];

  const manifestId = `man-${Date.now().toString().slice(-5)}`;
  const manifestCode = `MAN-${trip.originHubId.replace('hub-', '').toUpperCase()}-${trip.destinationHubId.replace('hub-', '').toUpperCase()}-${Date.now().toString().slice(-4)}`;

  const handoverSecret = generateCryptographicHandoverToken({
    manifestId,
    travelerId: trip.travelerId,
    agentId: agentId || 'usr-agent-303',
    totalWeightKg: totalWeight,
    packageCount: packages.length,
    timestamp: new Date().toISOString(),
  });

  const manifest: Manifest = {
    id: manifestId,
    manifestCode,
    tripId: trip.id,
    travelerId: trip.travelerId,
    originHubId: trip.originHubId,
    destinationHubId: trip.destinationHubId,
    dispatchedByAgentId: agentId || 'usr-agent-303',
    shipmentIds,
    totalPackages: packages.length,
    totalWeightKg: totalWeight,
    totalDeclaredValue: totalValue,
    handoverQrSecret: handoverSecret,
    dispatchTimestamp: new Date().toISOString(),
    status: 'HANDED_OVER',
    tamperSealIds: sealIds,
    createdAt: new Date().toISOString(),
  };

  db.manifests.set(manifest.id, manifest);

  // Update Trip
  trip.allocatedWeightKg = totalWeight;
  trip.manifestId = manifest.id;
  trip.status = 'DISPATCHED';
  db.trips.set(trip.id, trip);

  // Update Shipments
  packages.forEach((s) => {
    s.assignedTripId = trip.id;
    s.assignedTravelerId = trip.travelerId;
    s.assignedTravelerName = trip.travelerName;
    s.flightNumber = trip.flightNumber;
    s.airline = trip.airline;
    s.currentStatus = 'IN_TRANSIT';
    s.updatedAt = new Date().toISOString();
    db.shipments.set(s.id, s);
  });

  db.logAudit({
    actorId: agentId || 'usr-agent-303',
    actorName: 'Hub Agent',
    actorRole: 'HUB_AGENT',
    domain: 'Manifest',
    action: 'DISPATCH_MANIFEST_TO_TRAVELER',
    resourceType: 'Manifest',
    resourceId: manifest.id,
    details: {
      manifestCode,
      tripId: trip.id,
      travelerName: trip.travelerName,
      totalPackages: packages.length,
      totalWeightKg: totalWeight,
    },
  });

  res.status(201).json({
    success: true,
    message: 'Manifest created and securely dispatched to traveler via HMAC-signed QR token.',
    manifest,
    handoverToken: handoverSecret,
  });
});

// Handover Dispatch endpoint alias
manifestsRouter.post('/:id/handover-dispatch', (req: Request, res: Response) => {
  const { id } = req.params;
  const { agentId, agentName } = req.body;
  const manifest = db.manifests.get(id);

  if (!manifest) {
    return res.status(404).json({ success: false, error: 'Manifest not found' });
  }

  manifest.status = 'HANDED_OVER';
  manifest.dispatchedByAgentId = agentId || manifest.dispatchedByAgentId;
  manifest.dispatchTimestamp = new Date().toISOString();
  db.manifests.set(manifest.id, manifest);

  const trip = db.trips.get(manifest.tripId);
  if (trip) {
    trip.status = 'DISPATCHED';
    db.trips.set(trip.id, trip);
  }

  res.json({
    success: true,
    message: `Manifest ${manifest.manifestCode} dispatched successfully.`,
    manifest,
  });
});

// Destination Intake endpoint
manifestsRouter.post('/:id/destination-intake', (req: Request, res: Response) => {
  const { id } = req.params;
  const { qrToken, agentId, agentName } = req.body;
  let manifest = db.manifests.get(id);

  if (!manifest && qrToken) {
    const verification = verifyCryptographicHandoverToken(qrToken);
    if (verification.isValid && verification.payload) {
      manifest = db.manifests.get(verification.payload.manifestId);
    }
  }

  if (!manifest) {
    return res.status(404).json({ success: false, error: 'Manifest not found' });
  }

  manifest.status = 'DELIVERED_TO_DEST_HUB';
  manifest.receivedByAgentId = agentId || 'usr-manager-404';
  manifest.receiptTimestamp = new Date().toISOString();
  db.manifests.set(manifest.id, manifest);

  manifest.shipmentIds.forEach((shipId) => {
    const s = db.shipments.get(shipId);
    if (s) {
      s.currentStatus = 'READY_FOR_PICKUP';
      s.updatedAt = new Date().toISOString();
      db.shipments.set(s.id, s);
    }
  });

  const trip = db.trips.get(manifest.tripId);
  if (trip) {
    trip.status = 'COMPLETED';
    db.trips.set(trip.id, trip);

    // Escrow Release & Traveler Payout
    const travelerWallet = db.wallets.get(trip.travelerId);
    if (travelerWallet) {
      const depositToUnlock = trip.requiredEscrowDeposit;
      travelerWallet.lockedEscrowDeposit = Math.max(0, Number((travelerWallet.lockedEscrowDeposit - depositToUnlock).toFixed(2)));
      travelerWallet.balance = Number((travelerWallet.balance + depositToUnlock).toFixed(2));

      const payoutAmount = trip.totalEarningsEstimated;
      travelerWallet.balance = Number((travelerWallet.balance + payoutAmount).toFixed(2));
      travelerWallet.pendingEarnings = Math.max(0, Number((travelerWallet.pendingEarnings - payoutAmount).toFixed(2)));
      travelerWallet.updatedAt = new Date().toISOString();
      db.wallets.set(travelerWallet.userId, travelerWallet);

      db.recordTransaction({
        transactionCode: `TXN-REL-${Date.now().toString().slice(-6)}`,
        walletId: travelerWallet.id,
        userId: trip.travelerId,
        userName: trip.travelerName,
        tripId: trip.id,
        type: 'ESCROW_RELEASE',
        amount: depositToUnlock,
        currency: 'USD',
        exchangeRateToUsd: 1.0,
        idempotencyKey: `idemp-rel-dest-${trip.id}`,
        status: 'COMMITTED',
        referenceNote: `Refundable escrow security deposit released upon verified delivery to destination hub (${manifest.manifestCode})`,
      });

      db.recordTransaction({
        transactionCode: `TXN-PAY-${Date.now().toString().slice(-6)}`,
        walletId: travelerWallet.id,
        userId: trip.travelerId,
        userName: trip.travelerName,
        tripId: trip.id,
        type: 'TRAVELER_PAYOUT',
        amount: payoutAmount,
        currency: 'USD',
        exchangeRateToUsd: 1.0,
        idempotencyKey: `idemp-pay-dest-${trip.id}`,
        status: 'COMMITTED',
        referenceNote: `Traveler luggage delivery earnings payout for ${manifest.totalPackages} packages (${manifest.totalWeightKg} kg)`,
      });
    }
  }

  res.json({
    success: true,
    message: `Destination intake verified successfully! ${manifest.totalPackages} packages received. Traveler escrow released.`,
    manifest,
  });
});
