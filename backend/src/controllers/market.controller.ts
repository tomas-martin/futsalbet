import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../middlewares/auth.middleware';
import { updateOddsSchema } from '../validators/schemas';

export const getMarket = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const market = await prisma.market.findUnique({
      where: { id: req.params.id },
      include: {
        options: { orderBy: { odds: 'asc' } },
        match: {
          include: {
            homeTeam: { select: { name: true, logoUrl: true } },
            awayTeam: { select: { name: true, logoUrl: true } },
          },
        },
      },
    });

    if (!market) {
      res.status(404).json({ error: 'Mercado no encontrado' });
      return;
    }

    res.json(market);
  } catch (error) {
    next(error);
  }
};

export const updateMarket = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { status } = req.body;

    const market = await prisma.market.update({
      where: { id: req.params.id },
      data: { status },
    });

    res.json({ message: 'Mercado actualizado', market });
  } catch (error) {
    next(error);
  }
};

export const updateMarketOptionOdds = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { odds } = updateOddsSchema.parse(req.body);
    const { id: marketId, optionId } = req.params;

    const option = await prisma.marketOption.findFirst({
      where: { id: optionId, marketId },
    });

    if (!option) {
      res.status(404).json({ error: 'Opción de mercado no encontrada' });
      return;
    }

    const oldOdds = Number(option.odds);

    const updated = await prisma.marketOption.update({
      where: { id: optionId },
      data: { odds },
    });

    // Log the odds change
    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        action: 'UPDATE_ODDS',
        entity: 'MarketOption',
        entityId: optionId,
        oldData: { odds: oldOdds },
        newData: { odds },
      },
    });

    res.json({ message: 'Cuota actualizada', option: updated });
  } catch (error) {
    next(error);
  }
};
