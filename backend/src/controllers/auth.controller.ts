import { Request, Response, NextFunction } from 'express';
import jwt, { Secret, SignOptions } from 'jsonwebtoken';
import { createClient } from '@supabase/supabase-js';
import prisma from '../config/database';
import { supabaseAuthSchema, registerSchema } from '../validators/schemas';
import { AuthRequest } from '../middlewares/auth.middleware';

const JWT_SECRET: Secret = process.env.JWT_SECRET || 'super_secret_key_futsalbet_2026';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || '').toLowerCase();

function supabaseAdmin() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Supabase no configurado en el backend (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)');
  }
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
}

function deriveUsername(email: string): string {
  const base = (email.split('@')[0] || 'usuario')
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '')
    .slice(0, 24) || 'usuario';
  return base;
}

async function uniqueUsername(base: string): Promise<string> {
  let candidate = base;
  let suffix = 2;
  while (await prisma.user.findUnique({ where: { username: candidate } })) {
    candidate = `${base}${suffix}`;
    suffix++;
  }
  return candidate;
}

function displayNameFor(meta: Record<string, any>, email: string): string {
  const fromMeta = meta.displayName || meta.full_name || meta.name;
  if (fromMeta && String(fromMeta).trim().length >= 2) return String(fromMeta).trim().slice(0, 50);
  return email.split('@')[0] || 'Usuario';
}

/**
 * Recibe el access_token de una sesión de Supabase Auth, verifica al usuario
 * contra Supabase y lo crea/actualiza en la base local. Emite el JWT de la app.
 */
export const supabaseAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = supabaseAuthSchema.parse(req.body);

    const sb = supabaseAdmin();
    const { data: sbUser, error } = await sb.auth.getUser(data.accessToken);
    if (error || !sbUser?.user) {
      res.status(401).json({ error: 'Sesión de Supabase inválida o expirada' });
      return;
    }

    const supabaseUser = sbUser.user;
    const email = (supabaseUser.email || '').toLowerCase();
    if (!email) {
      res.status(400).json({ error: 'El usuario de Supabase no tiene email' });
      return;
    }

    const meta = (supabaseUser.user_metadata || {}) as Record<string, any>;
    const isAdminUser = ADMIN_EMAIL !== '' && email === ADMIN_EMAIL;

    let user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      const username = await uniqueUsername(deriveUsername(email));
      user = await prisma.user.create({
        data: {
          email,
          username,
          displayName: displayNameFor(meta, email),
          avatarUrl: typeof meta.avatarUrl === 'string' ? meta.avatarUrl : null,
          role: isAdminUser ? 'ADMIN' : 'USER',
        },
      });

      await prisma.notification.create({
        data: {
          userId: user.id,
          title: '¡Bienvenido a FutsalBet!',
          message: 'Tu cuenta fue creada. ¡Empieza a jugar al prode!',
          type: 'SYSTEM',
        },
      });
    } else {
      // Promover a admin si coincide el email configurado
      const updateData: { role?: 'ADMIN' | 'USER'; lastLoginAt?: Date; avatarUrl?: string } = {
        lastLoginAt: new Date(),
      };
      if (isAdminUser && user.role !== 'ADMIN') updateData.role = 'ADMIN';
      if (typeof meta.avatarUrl === 'string' && user.avatarUrl !== meta.avatarUrl) {
        updateData.avatarUrl = meta.avatarUrl;
      }
      await prisma.user.update({ where: { id: user.id }, data: updateData });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN as SignOptions['expiresIn'] }
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
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Registra un usuario pre-confirmado en Supabase Auth usando Service Role key,
 * sin enviar ningún correo de confirmación (evitando límites de rate limit de email).
 */
export const registerDirectly = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password } = registerSchema.parse(req.body);
    const normalizedEmail = email.toLowerCase();

    const sb = supabaseAdmin();
    // Crear usuario en Supabase Auth pre-confirmado
    const { data: sbData, error: sbError } = await sb.auth.admin.createUser({
      email: normalizedEmail,
      password,
      email_confirm: true,
    });

    if (sbError) {
      if (sbError.message.toLowerCase().includes('already registered') || sbError.status === 422) {
        res.status(400).json({ error: 'Este correo electrónico ya se encuentra registrado.' });
        return;
      }
      res.status(400).json({ error: sbError.message || 'Error al crear la cuenta en Supabase' });
      return;
    }

    const supabaseUser = sbData.user;
    if (!supabaseUser) {
      res.status(500).json({ error: 'No se pudo generar el usuario en Supabase' });
      return;
    }

    const isAdminUser = ADMIN_EMAIL !== '' && normalizedEmail === ADMIN_EMAIL;
    let user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

    if (!user) {
      const username = await uniqueUsername(deriveUsername(normalizedEmail));
      user = await prisma.user.create({
        data: {
          email: normalizedEmail,
          username,
          displayName: displayNameFor({}, normalizedEmail),
          role: isAdminUser ? 'ADMIN' : 'USER',
        },
      });

      await prisma.notification.create({
        data: {
          userId: user.id,
          title: '¡Bienvenido a FutsalBet!',
          message: 'Tu cuenta fue creada. ¡Empieza a jugar al prode!',
          type: 'SYSTEM',
        },
      });
    }

    res.status(201).json({
      message: 'Usuario registrado exitosamente',
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

export const getMe = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      include: {
        _count: {
          select: {
            notifications: { where: { isRead: false } },
            predictions: true,
          },
        },
      },
    });

    if (!user) {
      res.status(404).json({ error: 'Usuario no encontrado' });
      return;
    }

    res.json({
      id: user.id,
      email: user.email,
      username: user.username,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      role: user.role,
      createdAt: user.createdAt,
      stats: {
        predictions: user._count.predictions,
        unreadNotifications: user._count.notifications,
      },
    });
  } catch (error) {
    next(error);
  }
};