import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../config/database';
import { registerSchema, loginSchema, changePasswordSchema } from '../validators/schemas';
import { AuthRequest } from '../middlewares/auth.middleware';
import { TransactionType } from '@prisma/client';

export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = registerSchema.parse(req.body);

    // Check existing
    const existing = await prisma.user.findFirst({
      where: { OR: [{ email: data.email }, { username: data.username }] },
    });

    if (existing) {
      if (existing.email === data.email) {
        res.status(409).json({ error: 'El email ya está registrado' });
        return;
      }
      res.status(409).json({ error: 'El nombre de usuario ya está en uso' });
      return;
    }

    const passwordHash = await bcrypt.hash(data.password, 12);

    const initialPoints = parseInt(process.env.INITIAL_POINTS || '1000');

    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email: data.email,
          username: data.username,
          displayName: data.displayName,
          passwordHash,
        },
      });

      const wallet = await tx.virtualWallet.create({
        data: {
          userId: newUser.id,
          balance: initialPoints,
        },
      });

      await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          type: TransactionType.INITIAL_BONUS,
          amount: initialPoints,
          balanceBefore: 0,
          balanceAfter: initialPoints,
          description: `Bono de bienvenida: ${initialPoints} puntos virtuales`,
        },
      });

      await tx.notification.create({
        data: {
          userId: newUser.id,
          title: '¡Bienvenido a FutsalBet!',
          message: `Recibiste ${initialPoints} puntos virtuales de bienvenida. ¡Empieza a pronosticar!`,
          type: 'SYSTEM',
        },
      });

      return newUser;
    });

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.status(201).json({
      message: 'Usuario registrado exitosamente',
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        displayName: user.displayName,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { email: data.email },
      include: { wallet: { select: { balance: true } } },
    });

    if (!user) {
      res.status(401).json({ error: 'Credenciales incorrectas' });
      return;
    }

    if (!user.isActive) {
      res.status(403).json({ error: 'Tu cuenta ha sido desactivada. Contacta al administrador.' });
      return;
    }

    const isValid = await bcrypt.compare(data.password, user.passwordHash);
    if (!isValid) {
      res.status(401).json({ error: 'Credenciales incorrectas' });
      return;
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.json({
      message: 'Sesión iniciada',
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        role: user.role,
        balance: user.wallet?.balance ?? 0,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      include: {
        wallet: {
          select: { balance: true, totalWon: true, totalLost: true, totalBet: true },
        },
        _count: {
          select: {
            bets: true,
            notifications: { where: { isRead: false } },
          },
        },
      },
    });

    if (!user) {
      res.status(404).json({ error: 'Usuario no encontrado' });
      return;
    }

    const wonBets = await prisma.bet.count({ where: { userId: user.id, status: 'WON' } });
    const lostBets = await prisma.bet.count({ where: { userId: user.id, status: 'LOST' } });

    res.json({
      id: user.id,
      email: user.email,
      username: user.username,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      role: user.role,
      createdAt: user.createdAt,
      wallet: user.wallet,
      stats: {
        totalBets: user._count.bets,
        wonBets,
        lostBets,
        unreadNotifications: user._count.notifications,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const changePassword = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = changePasswordSchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
    if (!user) {
      res.status(404).json({ error: 'Usuario no encontrado' });
      return;
    }

    const isValid = await bcrypt.compare(data.currentPassword, user.passwordHash);
    if (!isValid) {
      res.status(400).json({ error: 'Contraseña actual incorrecta' });
      return;
    }

    const newHash = await bcrypt.hash(data.newPassword, 12);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: newHash },
    });

    res.json({ message: 'Contraseña actualizada exitosamente' });
  } catch (error) {
    next(error);
  }
};
