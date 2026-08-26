# FutsalBet — Plataforma Recreativa de Prode de Futsal

[![Prode Recreativo](https://img.shields.io/badge/Plataforma-Prode--Recreativo-7a5af8.svg)](https://futsalbet.com)
[![Licencia](https://img.shields.io/badge/Licencia-MIT-green.svg)](LICENSE)

Plataforma completa de pronósticos deportivos (Prode) enfocada en el futsal de **Mendoza, Argentina** (FEFUSA Mendoza).

> ⚠️ **IMPORTANTE:** Esta plataforma es un **SISTEMA DE PRODE 100% RECREATIVO**. No contiene dinero real, ni Mercado Pago, ni apuestas monetarias, ni tarjetas de crédito, ni transferencias bancarias. El único fin es pronosticar marcadores exactos y competir en la tabla de posiciones con amigos y aficionados.

---

## 🚀 Guía de Inicio Rápido (Docker Compose)

Puedes levantar todo el stack (PostgreSQL + Backend Express + Frontend React + Nginx) en local ejecutando un único comando:

```bash
docker compose up --build
```

- **Frontend:** [http://localhost:5173](http://localhost:5173) (o puerto 80 en contenedor)
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
- **Rol:** `USER`

---

## 🛠️ Guía Paso a Paso de Uso

### 1. Cómo cargar torneos y equipos
Accede con el usuario **ADMIN** y dirígete al menú `/admin`. En el panel de control puedes gestionar torneos y equipos, o utilizar el importador idempotente en `/importer`.

### 2. Cómo cargar y actualizar partidos
1. En `/admin/partidos`, haz clic en **"Crear Partido"** o selecciona un partido de la lista.
2. Puedes modificar la fecha, hora, equipos y estado (`SCHEDULED`, `LIVE`, `FINISHED`).

### 3. Cómo realizar un pronóstico en el Prode
1. Inicia sesión como **Usuario Normal** (`usuario@futsalbet.com`).
2. Navega a la sección **Prode** o **Partidos**.
3. Ingresa la cantidad de goles para el equipo Local y el equipo Visitante en los partidos programados.
4. Haz clic en **"Guardar Pronóstico"** en un partido o en **"Guardar todos los pronósticos"**.
5. Puedes modificar tus predicciones hasta el momento exacto del inicio del partido.

### 4. Reglas de Puntuación
- **6 Puntos:** Acierto exacto del marcador (ej: dijiste 3-1 y el partido terminó 3-1).
- **3 Puntos:** Acierto del ganador o empate (ej: dijiste 2-0 y el partido terminó 4-1).
- **0 Puntos:** Pronóstico no acertado.

### 5. Cómo resolver partidos automáticamente (ADMIN)
1. Ingresa como **ADMIN** a `/admin/partidos`.
2. Busca un partido finalizado y haz clic en **"Cargar Resultado"**.
3. Ingresa el marcador final (ej: `4 - 2`).
4. El backend ejecutará el `BetSettlementService`, evaluará cada pronóstico registrado, otorgará los puntos correspondientes (6 o 3 pts), actualizará la Tabla General y los Grupos Privados, y enviará notificaciones.

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
│   │   ├── services/      # BetSettlementService (resolución automática del Prode)
│   │   ├── validators/    # Schemas Zod
│   │   └── utils/         # Cron jobs
│   └── tests/             # Tests unitarios
├── frontend/              # App React + TypeScript + Vite + Tailwind CSS
│   ├── src/
│   │   ├── api/           # Cliente Axios con interceptores JWT
│   │   ├── components/    # Header, Navbar, etc.
│   │   ├── context/       # AuthContext
│   │   ├── pages/         # Prode, Tabla, Grupos, Manual, Panel Admin
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

### Backend (Render / Railway / Vercel)
1. Crea un servicio Web Service apuntando a `/backend`.
2. Configura las variables de entorno del backend:
   - `DATABASE_URL=postgresql://...`
   - `JWT_SECRET=super_secret_key`
   - `JWT_EXPIRES_IN=7d`
   - `CRON_SECRET=futsalbet_cron_secret_2026`

### Base de Datos (Neon / Supabase / Railway)
1. Instancia una BD PostgreSQL 15+.
2. Ejecuta `npx prisma migrate deploy` y `npx prisma db seed`.

---

## 📄 Licencia

Este proyecto se distribuye bajo la licencia MIT con fines educativos y recreativos.
