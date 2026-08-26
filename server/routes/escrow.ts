import { Request, Response, Router } from 'express';
import { db } from '../store';
import { FinancialTransaction } from '../../src/types';

export const escrowRouter = Router();

// Get wallet details for user
escrowRouter.get('/wallet/:userId', (req: Request, res: Response) => {
  const { userId } = req.params;
  let wallet = db.wallets.get(userId);

  if (!wallet) {
    wallet = {
      id: `wlt-${userId}`,
      userId,
      balance: 1000.0,
      lockedEscrowDeposit: 0.0,
      pendingEarnings: 0.0,
      currency: 'USD',
      updatedAt: new Date().toISOString(),
    };
    db.wallets.set(userId, wallet);
  }

  res.json({ success: true, wallet });
});

// List all ledger transactions (with filters by userId, tripId, type)
escrowRouter.get('/ledger', (req: Request, res: Response) => {
  const { userId, tripId, type } = req.query;
  let list = Array.from(db.transactions.values());

  if (userId) {
    list = list.filter((t) => t.userId === userId);
  }
  if (tripId) {
    list = list.filter((t) => t.tripId === tripId);
  }
  if (type) {
    list = list.filter((t) => t.type === type);
  }

  list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  res.json({ success: true, transactions: list });
});

// Common Withdrawal Handler
const handleWithdrawal = (req: Request, res: Response) => {
  const { userId, amount, bankDetails, payoutMethod } = req.body;
  const targetUserId = userId || 'usr-traveler-202';
  let wallet = db.wallets.get(targetUserId);

  if (!wallet) {
    wallet = {
      id: `wlt-${targetUserId}`,
      userId: targetUserId,
      balance: 1000.0,
      lockedEscrowDeposit: 0.0,
      pendingEarnings: 0.0,
      currency: 'USD',
      updatedAt: new Date().toISOString(),
    };
    db.wallets.set(targetUserId, wallet);
  }

  const withdrawAmount = Number(amount) || 0;
  if (withdrawAmount <= 0) {
    return res.status(400).json({
      success: false,
      error: 'Please enter a valid withdrawal amount greater than zero.',
    });
  }

  if (withdrawAmount > wallet.balance) {
    return res.status(400).json({
      success: false,
      error: `Insufficient available balance. You have $${wallet.balance} available for withdrawal.`,
    });
  }

  wallet.balance = Number((wallet.balance - withdrawAmount).toFixed(2));
  wallet.updatedAt = new Date().toISOString();
  db.wallets.set(targetUserId, wallet);

  const tx = db.recordTransaction({
    transactionCode: `TXN-WDR-${Date.now().toString().slice(-6)}`,
    walletId: wallet.id,
    userId: targetUserId,
    userName: db.users.get(targetUserId)?.fullName || 'Traveler User',
    type: 'TRAVELER_PAYOUT',
    amount: withdrawAmount,
    currency: wallet.currency,
    exchangeRateToUsd: 1.0,
    idempotencyKey: `idemp-wdr-${Date.now()}-${Math.random()}`,
    status: 'COMMITTED',
    referenceNote: `Instant bank/wallet withdrawal of $${withdrawAmount} via ${payoutMethod || 'Direct IBAN Bank Transfer'}`,
  });

  db.logAudit({
    actorId: targetUserId,
    actorName: db.users.get(targetUserId)?.fullName || 'Traveler User',
    actorRole: 'TRAVELER',
    domain: 'Escrow',
    action: 'INSTANT_PAYOUT_WITHDRAWAL',
    resourceType: 'Wallet',
    resourceId: wallet.id,
    details: { amount: withdrawAmount, method: payoutMethod },
  });

  return res.json({
    success: true,
    message: `Withdrawal request of $${withdrawAmount} processed successfully. Funds will arrive in your account shortly.`,
    wallet,
    transaction: tx,
  });
};

// Request Instant Traveler Payout Withdrawal (support both /withdraw and /wallet/withdraw)
escrowRouter.post('/withdraw', handleWithdrawal);
escrowRouter.post('/wallet/withdraw', handleWithdrawal);

// Deposit / Top-up Wallet Balance
escrowRouter.post('/wallet/topup', (req: Request, res: Response) => {
  const { userId, amount } = req.body;
  const wallet = db.wallets.get(userId);

  if (!wallet) {
    return res.status(404).json({ success: false, error: 'Wallet not found' });
  }

  const topupAmount = Number(amount);
  wallet.balance = Number((wallet.balance + topupAmount).toFixed(2));
  wallet.updatedAt = new Date().toISOString();
  db.wallets.set(userId, wallet);

  res.json({
    success: true,
    message: `Added $${topupAmount} to wallet. Current balance: $${wallet.balance}`,
    wallet,
  });
});
