import { Request, Response, Router } from 'express';
import { db } from '../store';

export const usersRouter = Router();

// GET all users
usersRouter.get('/', (req: Request, res: Response) => {
  const users = Array.from(db.users.values()).map((u) => {
    const { ...safeUser } = u;
    return safeUser;
  });
  res.json({ success: true, users });
});

// GET single user
usersRouter.get('/:id', (req: Request, res: Response) => {
  const user = db.users.get(req.params.id);
  if (!user) {
    return res.status(404).json({ success: false, error: 'User not found' });
  }
  res.json({ success: true, user });
});

// Update KYC or profile status
usersRouter.patch('/:id/kyc', (req: Request, res: Response) => {
  const user = db.users.get(req.params.id);
  if (!user) {
    return res.status(404).json({ success: false, error: 'User not found' });
  }

  const { status, nationality, passportNumber, selfieWithIdUrl } = req.body;
  if (status) user.kycStatus = status;
  if (nationality) user.nationality = nationality;
  if (passportNumber) user.passportNumber = passportNumber;
  if (selfieWithIdUrl) user.selfieWithIdUrl = selfieWithIdUrl;

  db.users.set(user.id, user);

  res.json({ success: true, user });
});
