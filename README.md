# FutsalBet — Plataforma Recreativa de Pronósticos de Futsal

[![Puntos Virtuales](https://img.shields.io/badge/Plataforma-Recreativa-7a5af8.svg)](https://futsalbet.com)
[![Licencia](https://img.shields.io/badge/Licencia-MIT-green.svg)](LICENSE)

Plataforma completa de pronósticos deportivos y apuestas recreativas enfocada en el futsal de **Mendoza, Argentina** (FEFUSA Mendoza).

> ⚠️ **IMPORTANTE:** Esta plataforma utiliza **EXCLUSIVAMENTE PUNTOS VIRTUALES**. No contiene dinero real, ni Mercado Pago, ni tarjetas de crédito, ni transferencias bancarias, ni depósitos, ni retiros. Es un sistema 100% recreativo.

---

## 🚀 Guía de Inicio Rápido (Docker Compose)

Puedes levantar todo el stack (PostgreSQL + Backend Express + Frontend React + Nginx) en local ejecutando un único comando:

```bash
docker compose up --build
```

- **Frontend:** [http://localhost:5173](http://localhost:5173) (o port 80 en contenedor)
- **Backend API:** [http://localhost:3000](http://localhost:3000)
- **PostgreSQL:** `localhost:5432`

---

## 👤 Credenciales de Acceso Demo

### 1. Usuario Administrador
- **Email:** `admin@futsalbet.com`
- **Contraseña:** `Admin123!`
- **Rol:** `ADMIN`

### 2. Usuario Normal de Prueba
- **Email:** `usuario@futsalbet.com`
- **Contraseña:** `User123!`
- **Rol:** `USER` (Comienza con **1000 PUNTOS VIRTUALES**)

---

## 🛠️ Guía Paso a Paso de Uso

### 1. Cómo cargar torneos y equipos
Accede con el usuario **ADMIN** y dirígete al menú `/admin`. En el panel de control puedes gestionar torneos y equipos, o utilizar el importador idempotente en `/importer`.

### 2. Cómo cargar y actualizar partidos
1. En `/admin/partidos`, haz clic en **"Crear Partido"** o selecciona un partido de la lista.
2. Puedes modificar la fecha, hora, equipos y estado (`SCHEDULED`, `LIVE`, `FINISHED`).

### 3. Cómo modificar cuotas virtuales
1. Ingresa a `/admin/cuotas`.
2. Selecciona un partido próximo de la lista desplegable.
3. Edita la cuota deseada (ej: cambiar cuota de Godoy Cruz de `1.80` a `2.10`).
4. Al guardar, el cambio queda registrado en la tabla `AuditLog`.

### 4. Cómo realizar un pronóstico (Apuesta recreativa)
1. Inicia sesión como **Usuario Normal** (`usuario@futsalbet.com`).
2. Navega por los partidos y haz clic en la cuota de tu elección (Ganador, Doble Oportunidad, Más/Menos goles, etc.).
3. Se abrirá la **Boleta de Pronósticos** (BetSlip) a la derecha.
4. Si seleccionas opciones de múltiples partidos, las cuotas se multiplicarán automáticamente en una **Apuesta Combinada**.
5. Ingresa el monto de puntos virtuales a apostar y haz clic en **"CONFIRMAR PRONÓSTICO"**.

### 5. Cómo resolver una apuesta automáticamente
1. Ingresa como **ADMIN** a `/admin/partidos`.
2. Busca un partido programado o en vivo y haz clic en **"Cargar Resultado"**.
3. Ingresa el resultado final (ej: `4 - 2`).
4. El backend ejecutará el `BetSettlementService`, determinará las apuestas ganadas/perdidas/anuladas, acreditará los puntos a los ganadores y enviará notificaciones.

---

## 🔌 Módulo de Importación Desacoplado (`/importer`)

El módulo de importación está completamente separado en `/importer` y utiliza una interfaz desacoplada `DataSourceAdapter`.

### ¿Cómo conectar una fuente de datos deportiva autorizada?

1. Implementa la interfaz `DataSourceAdapter` en `/importer/src/adapters/TuProveedorAdapter.ts`:

```typescript
import { DataSourceAdapter, ExternalMatch, ExternalTeam, ExternalTournament, ExternalStanding } from './DataSourceAdapter';

export class TuProveedorAdapter implements DataSourceAdapter {
  sourceName = 'ProveedorAutorizado';

  async fetchTournaments(): Promise<ExternalTournament[]> {
    // consumo de API autorizada con tu API KEY
  }
  // ... implementar fetchTeams, fetchMatches, fetchStandings
}
```

2. Ejecuta el script de importación idempotente:

```bash
cd importer && npm start
```

*Nota: La importación es 100% idempotente mediante `upsert` por `externalId`, evitando duplicados.*

---

## 🏗️ Arquitectura del Proyecto

```
futsalbet/
├── backend/               # API Express + Node.js + TypeScript + Prisma
│   ├── prisma/            # Schema y migraciones de PostgreSQL
│   ├── src/
│   │   ├── config/        # Configuración de base de datos
│   │   ├── controllers/   # Controladores REST
│   │   ├── middlewares/   # Auth JWT, manejo de errores
│   │   ├── routes/        # Definición de endpoints
│   │   ├── services/      # BetSettlementService (resolución automática)
│   │   ├── validators/    # Schemas Zod
│   │   └── utils/         # Cron jobs
│   └── tests/             # Tests unitarios
├── frontend/              # App React + TypeScript + Vite + Tailwind CSS
│   ├── src/
│   │   ├── api/           # Cliente Axios con interceptores JWT
│   │   ├── components/    # Header, Navbar, BetSlip, OddsButton, etc.
│   │   ├── context/       # AuthContext y BetSlipContext
│   │   ├── pages/         # Páginas de usuario y panel Admin
│   └── nginx.conf         # Servidor web en producción
├── importer/              # Importador desacoplado idempotente
├── docker-compose.yml     # Orquestación completa
└── .env.example
```

---

## 📦 Despliegue en la Nube

### Frontend (Vercel)
1. Conecta el repositorio a Vercel.
2. Configura la variable de entorno `VITE_API_URL=https://tu-backend.onrender.com`.

### Backend (Render / Railway)
1. Crea un servicio Web Service apuntando a `/backend`.
2. Configura las variables:
   - `DATABASE_URL=postgresql://...`
   - `JWT_SECRET=super_secret_key`

### Base de Datos (Neon / Supabase / Railway)
1. Instancia una BD PostgreSQL 15+.
2. Ejecuta `npx prisma migrate deploy` y `npx prisma db seed`.

---

## 📄 Licencia

Este proyecto se distribuye bajo la licencia MIT con fines educativos y recreativos.
# futsalbet
