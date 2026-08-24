import { Response, NextFunction } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../middlewares/auth.middleware';
import { z } from 'zod';
import { PREDICTION_EXACT_POINTS } from '../services/predictionSettlement.service';

const createGroupSchema = z.object({
  name: z.string().min(3, 'El nombre del grupo debe tener al menos 3 caracteres').max(50, 'El nombre del grupo es demasiado largo'),
  description: z.string().max(200, 'La descripción no puede superar los 200 caracteres').optional(),
});

const joinGroupSchema = z.object({
  code: z.string().min(4, 'Código de invitación inválido').max(10, 'Código de invitación inválido'),
});

// Helper to generate a random 6-character uppercase alphanumeric code
function generateGroupCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Exclude ambiguous characters (I, O, 0, 1)
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export const createGroup = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, description } = createGroupSchema.parse(req.body);
    const userId = req.user!.id;

    // Generate a unique code
    let code = generateGroupCode();
    let existingCode = await prisma.group.findUnique({ where: { code } });
    let attempts = 0;
    while (existingCode && attempts < 10) {
      code = generateGroupCode();
      existingCode = await prisma.group.findUnique({ where: { code } });
      attempts++;
    }

    const group = await prisma.$transaction(async (tx) => {
      const newGroup = await tx.group.create({
        data: {
          name,
          description: description || null,
          code,
          ownerId: userId,
        },
      });

      await tx.groupMember.create({
        data: {
          groupId: newGroup.id,
          userId,
          role: 'ADMIN',
        },
      });

      return newGroup;
    });

    res.status(201).json({
      message: 'Grupo creado exitosamente',
      data: group,
    });
  } catch (error) {
    next(error);
  }
};

export const joinGroup = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { code } = joinGroupSchema.parse(req.body);
    const userId = req.user!.id;
    const cleanCode = code.trim().toUpperCase();

    const group = await prisma.group.findUnique({
      where: { code: cleanCode },
      include: {
        owner: { select: { id: true, displayName: true, username: true } },
        _count: { select: { members: true } },
      },
    });

    if (!group) {
      res.status(404).json({ error: 'No se encontró ningún grupo con ese código de invitación' });
      return;
    }

    const existingMember = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId: group.id, userId } },
    });

    if (existingMember) {
      res.status(400).json({ error: 'Ya eres integrante de este grupo', data: group });
      return;
    }

    await prisma.groupMember.create({
      data: {
        groupId: group.id,
        userId,
        role: 'MEMBER',
      },
    });

    res.json({
      message: `¡Te has unido exitosamente al grupo "${group.name}"!`,
      data: group,
    });
  } catch (error) {
    next(error);
  }
};

export const getMyGroups = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;

    const memberships = await prisma.groupMember.findMany({
      where: { userId },
      include: {
        group: {
          include: {
            owner: { select: { id: true, displayName: true, username: true, avatarUrl: true } },
            _count: { select: { members: true } },
          },
        },
      },
      orderBy: { joinedAt: 'desc' },
    });

    const groups = memberships.map((m) => ({
      ...m.group,
      myRole: m.role,
      joinedAt: m.joinedAt,
      memberCount: m.group._count.members,
    }));

    res.json({ data: groups });
  } catch (error) {
    next(error);
  }
};

export const getGroupDetails = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const groupId = req.params.id;
    const userId = req.user!.id;

    const membership = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId } },
    });

    if (!membership) {
      res.status(403).json({ error: 'No tienes acceso a este grupo o no eres integrante' });
      return;
    }

    const group = await prisma.group.findUnique({
      where: { id: groupId },
      include: {
        owner: { select: { id: true, displayName: true, username: true, avatarUrl: true } },
        members: {
          include: {
            user: { select: { id: true, displayName: true, username: true, avatarUrl: true } },
          },
          orderBy: { joinedAt: 'asc' },
        },
      },
    });

    if (!group) {
      res.status(404).json({ error: 'Grupo no encontrado' });
      return;
    }

    res.json({
      data: {
        ...group,
        myRole: membership.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getGroupRanking = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const groupId = req.params.id;
    const userId = req.user!.id;
    const tournamentId = req.query.tournamentId as string | undefined;

    // Verify membership
    const membership = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId } },
    });

    if (!membership) {
      res.status(403).json({ error: 'No tienes permiso para ver la tabla de este grupo' });
      return;
    }

    // Get all members of the group
    const members = await prisma.groupMember.findMany({
      where: { groupId },
      include: {
        user: { select: { id: true, displayName: true, username: true, avatarUrl: true } },
      },
    });

    const memberUserIds = members.map((m) => m.userId);

    const matchWhere = tournamentId ? { tournamentId } : {};

    // Get settled predictions for group members
    const predictions = await prisma.prediction.findMany({
      where: {
        userId: { in: memberUserIds },
        match: matchWhere,
        result: { in: ['WON', 'LOST'] },
      },
      select: { userId: true, result: true, pointsEarned: true },
    });

    const totals = new Map<string, { points: number; predictions: number; won: number; exact: number }>();
    
    // Initialize stats for ALL group members
    for (const m of members) {
      totals.set(m.userId, { points: 0, predictions: 0, won: 0, exact: 0 });
    }

    for (const p of predictions) {
      const entry = totals.get(p.userId) ?? { points: 0, predictions: 0, won: 0, exact: 0 };
      entry.predictions++;
      entry.points += p.pointsEarned;
      if (p.result === 'WON') {
        entry.won++;
        if (p.pointsEarned === PREDICTION_EXACT_POINTS) entry.exact++;
      }
      totals.set(p.userId, entry);
    }

    const rows = members
      .map((m) => {
        const stats = totals.get(m.userId) || { points: 0, predictions: 0, won: 0, exact: 0 };
        return {
          user: m.user,
          role: m.role,
          joinedAt: m.joinedAt,
          points: stats.points,
          predictions: stats.predictions,
          won: stats.won,
          exact: stats.exact,
        };
      })
      .sort((a, b) => b.points - a.points || b.won - a.won || b.exact - a.exact || a.user.displayName.localeCompare(b.user.displayName));

    const ranked = rows.map((row, idx) => ({
      rank: idx + 1,
      ...row,
    }));

    res.json({ data: ranked });
  } catch (error) {
    next(error);
  }
};

export const leaveGroup = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const groupId = req.params.id;
    const userId = req.user!.id;

    const group = await prisma.group.findUnique({
      where: { id: groupId },
      include: { members: true },
    });

    if (!group) {
      res.status(404).json({ error: 'Grupo no encontrado' });
      return;
    }

    const membership = group.members.find((m) => m.userId === userId);
    if (!membership) {
      res.status(400).json({ error: 'No eres integrante de este grupo' });
      return;
    }

    if (group.members.length === 1) {
      // Sole member -> delete group entirely
      await prisma.group.delete({ where: { id: groupId } });
      res.json({ message: 'Has salido del grupo y al ser el único integrante, el grupo ha sido eliminado' });
      return;
    }

    if (group.ownerId === userId) {
      // Transfer owner role to oldest remaining member
      const otherMembers = group.members.filter((m) => m.userId !== userId);
      otherMembers.sort((a, b) => a.joinedAt.getTime() - b.joinedAt.getTime());
      const newOwner = otherMembers[0];

      await prisma.$transaction([
        prisma.groupMember.delete({ where: { id: membership.id } }),
        prisma.group.update({
          where: { id: groupId },
          data: { ownerId: newOwner.userId },
        }),
        prisma.groupMember.update({
          where: { id: newOwner.id },
          data: { role: 'ADMIN' },
        }),
      ]);
    } else {
      await prisma.groupMember.delete({ where: { id: membership.id } });
    }

    res.json({ message: 'Has salido del grupo correctamente' });
  } catch (error) {
    next(error);
  }
};

export const deleteGroup = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const groupId = req.params.id;
    const userId = req.user!.id;

    const group = await prisma.group.findUnique({ where: { id: groupId } });
    if (!group) {
      res.status(404).json({ error: 'Grupo no encontrado' });
      return;
    }

    if (group.ownerId !== userId && req.user!.role !== 'ADMIN') {
      res.status(403).json({ error: 'Solo el creador del grupo o un administrador puede eliminar el grupo' });
      return;
    }

    await prisma.group.delete({ where: { id: groupId } });
    res.json({ message: 'Grupo eliminado correctamente' });
  } catch (error) {
    next(error);
  }
};
