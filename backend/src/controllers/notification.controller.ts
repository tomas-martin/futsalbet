import { Response, NextFunction } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../middlewares/auth.middleware';

export const getNotifications = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.notification.count({ where: { userId } }),
      prisma.notification.count({ where: { userId, isRead: false } }),
    ]);

    res.json({
      data: notifications,
      unreadCount,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    next(error);
  }
};

export const markAsRead = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    if (id === 'read-all') {
      await prisma.notification.updateMany({
        where: { userId, isRead: false },
        data: { isRead: true },
      });
      res.json({ message: 'Todas las notificaciones marcadas como leídas' });
      return;
    }

    const notification = await prisma.notification.updateMany({
      where: { id, userId },
      data: { isRead: true },
    });

    res.json({ message: 'Notificación marcada como leída', notification });
  } catch (error) {
    next(error);
  }
};

export const registerDeviceToken = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { token, platform } = req.body;

    if (!token || typeof token !== 'string') {
      res.status(400).json({ error: 'El token de dispositivo es obligatorio' });
      return;
    }

    const device = await prisma.deviceToken.upsert({
      where: { token },
      update: {
        userId,
        platform: platform || 'web',
        updatedAt: new Date(),
      },
      create: {
        userId,
        token,
        platform: platform || 'web',
      },
    });

    res.json({ message: 'Dispositivo registrado exitosamente para notificaciones', device });
  } catch (error) {
    next(error);
  }
};

export const unregisterDeviceToken = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { token } = req.body;

    if (!token || typeof token !== 'string') {
      res.status(400).json({ error: 'El token es obligatorio' });
      return;
    }

    await prisma.deviceToken.deleteMany({
      where: { token },
    });

    res.json({ message: 'Dispositivo desvinculado de notificaciones' });
  } catch (error) {
    next(error);
  }
};

export const sendTestPush = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { sendPushToUser } = await import('../services/fcm.service');

    const result = await sendPushToUser(userId, {
      title: '⚽ ¡FutsalBet Notificaciones Activas!',
      body: 'Recibirás avisos de nuevos partidos para pronosticar y recordatorios 24hs antes de cada fecha.',
      url: '/prode',
    });

    // También guardar una notificación interna
    await prisma.notification.create({
      data: {
        userId,
        title: '⚽ ¡Notificaciones Push Conectadas!',
        message: 'Tu dispositivo está listo para recibir avisos de partidos y recordatorios de pronósticos.',
        type: 'SYSTEM',
      },
    });

    res.json({
      message: 'Prueba de notificación enviada',
      successCount: result.success,
      failureCount: result.failure,
    });
  } catch (error) {
    next(error);
  }
};

