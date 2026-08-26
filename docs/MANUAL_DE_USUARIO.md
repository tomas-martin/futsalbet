# 📖 Manual de Usuario — FutsalBet

Bienvenido al **Manual de Usuario oficial de FutsalBet**, la plataforma recreativa de pronósticos y apuestas deportivas enfocada en el futsal de Mendoza (FEFUSA Mendoza).

---

> ⚠️ **IMPORTANTE: Plataforma 100% Recreativa**
> FutsalBet funciona exclusivamente con **PUNTOS VIRTUALES**. No hay depósitos de dinero real, transacciones bancarias, Mercado Pago ni tarjetas. El objetivo es competir con amigos y aficionados del futsal por la cima de la tabla de posiciones.

---

## 📋 Índice
1. [Guía para Jugadores (Usuarios)](#-guía-para-jugadores-usuarios)
   - [1. Registro e Inicio de Sesión](#1-registro-e-inicio-de-sesión)
   - [2. Puntos Virtuales Iniciales](#2-puntos-virtuales-iniciales)
   - [3. Cómo Realizar Pronósticos (Boleta / BetSlip)](#3-cómo-realizar-pronósticos-boleta--betslip)
   - [4. Apuestas Combinadas](#4-apuestas-combinadas)
   - [5. Consultar Mis Pronósticos](#5-consultar-mis-pronósticos)
   - [6. Tabla de Posiciones y Leaderboard](#6-tabla-de-posiciones-y-leaderboard)
   - [7. Grupos Privados con Amigos](#7-grupos-privados-con-amigos)
   - [8. Favoritos y Partidos En Vivo](#8-favoritos-y-partidos-en-vivo)
2. [Guía para Administradores](#-guía-para-administradores)
   - [1. Acceso al Panel Admin](#1-acceso-al-panel-admin)
   - [2. Gestión de Partidos y Torneos](#2-gestión-de-partidos-y-torneos)
   - [3. Modificación de Cuotas Virtuales](#3-modificación-de-cuotas-virtuales)
   - [4. Carga de Resultados y Resolución Automática](#4-carga-de-resultados-y-resolución-automática)
   - [5. Gestión de Usuarios y Auditoría](#5-gestión-de-usuarios-y-auditoría)
3. [Reglas de Puntuación y Preguntas Frecuentes](#-reglas-de-puntuación-y-preguntas-frecuentes)

---

## ⚽ Guía para Jugadores (Usuarios)

### 1. Registro e Inicio de Sesión
- Haz clic en **"Registrarse"** en la esquina superior derecha.
- Completa tu nombre completo, nombre de usuario (`username`), email y contraseña.
- Al registrarte correctamente, serás redirigido al inicio con sesión iniciada.

### 2. Puntos Virtuales Iniciales
- Todos los usuarios nuevos reciben **1.000 PUNTOS VIRTUALES** al momento del registro.
- Tu saldo de puntos se muestra siempre en la parte superior derecha de la pantalla y en tu perfil.

### 3. Cómo Realizar Pronósticos (Boleta / BetSlip)
1. Navega a la sección **"Partidos"** o **"Prode"**.
2. Selecciona tu pronóstico para un partido (Ganador Local, Empate o Ganador Visitante, o cuotas de mercado si están activas).
3. Tu selección se agregará a la **Boleta de Pronósticos (BetSlip)** ubicada en el lateral derecho (o botón flotante en móvil).
4. Ingresa el monto de puntos virtuales que deseas apostar.
5. Haz clic en **"CONFIRMAR PRONÓSTICO"**.

### 4. Apuestas Combinadas
- Si seleccionas 2 o más opciones de partidos **diferentes**, la boleta armará automáticamente una **Apuesta Combinada**.
- Las cuotas de cada partido se multiplicarán entre sí, ofreciendo una cuota total mayor.
- Para ganar una apuesta combinada, debes acertar **todos** los pronósticos incluidos.

### 5. Consultar Mis Pronósticos
- Accede a la sección **"Mis Pronósticos"** desde el menú de usuario.
- Verás tus apuestas clasificadas por estado: **Pendientes**, **Ganadas**, **Perdidas** o **Anuladas**.
- Podrás revisar los detalles del partido, cuotas jugadas y la ganancia o puntos obtenidos.

### 6. Tabla de Posiciones y Leaderboard
- En **"Tabla General"** o **"Leaderboard"**, consulta el ranking global de usuarios ordenado por puntos acumulados y porcentaje de aciertos.
- Demuestra tu conocimiento en el futsal mendocino escalando posiciones cada fecha.

### 7. Grupos Privados con Amigos
- En la sección **"Grupos Privados"**, puedes crear tu propio grupo (ej. *"Amigos del Club"*, *"Prode la 5ta"*).
- Comparte el código único de acceso con tus amigos para que se unan.
- Cada grupo tiene su propia tabla de posiciones exclusiva entre sus miembros.

### 8. Favoritos y Partidos En Vivo
- Marca tus equipos preferidos con la estrella en la sección **"Equipos"** para recibir notificaciones directas.
- Sigue los resultados al instante en la sección **"En Vivo"** durante los días de fecha del torneo FEFUSA.

---

## 🛡️ Guía para Administradores

### 1. Acceso al Panel Admin
- Inicia sesión con credenciales de administrador (ej: `admin@futsalbet.com`).
- Haz clic en la insignia dorada **"Panel Admin"** en la barra superior o ve a `/admin/dashboard`.

### 2. Gestión de Partidos y Torneos
- En `/admin/partidos`, puedes crear nuevos enfrentamientos indicando:
  - Torneo y Fase / Jornada.
  - Equipo Local y Equipo Visitante.
  - Fecha, hora y cancha/estadio.
  - Estado del partido (`SCHEDULED`, `LIVE`, `FINISHED`).

### 3. Modificación de Cuotas Virtuales
- En `/admin/predictions` o `/admin/partidos`, puedes ajustar manualmente las cuotas de un partido próximo.
- Cada cambio queda asentado en el sistema de auditoría (`AuditLog`) para garantizar transparencia.

### 4. Carga de Resultados y Resolución Automática
1. Cuando un partido finaliza, ingresa a `/admin/partidos`.
2. Haz clic en **"Cargar Resultado"** e ingresa el marcador final (ej: `Local: 4 - Visitante: 2`).
3. Al guardar el resultado, el backend ejecuta automáticamente el motor de resolución `BetSettlementService`:
   - Evalúa todas las apuestas pendientes que involucran ese partido.
   - Paga los puntos virtuales a las apuestas ganadas.
   - Marca las apuestas no acertadas como perdidas.
   - Envía notificaciones a los usuarios con los resultados.

### 5. Gestión de Usuarios y Auditoría
- En `/admin/usuarios`, el administrador puede ver la lista de usuarios, sus saldos, estado de cuenta y ajustar permisos de rol (`USER` / `ADMIN`).
- En `/admin/logs`, consulta el historial de actividad administrativa y logs del sistema.

---

## ❓ Reglas de Puntuación y Preguntas Frecuentes

### Reglas de Cierre
- Los pronósticos sobre un partido se pueden realizar y modificar **hasta el momento exacto del inicio fijado del partido**.
- Una vez que el partido cambia a estado `LIVE` o llega su horario, los pronósticos quedan estrictamente **bloqueados**.

### Puntuación en el Prode Tradicional
- **6 Puntos:** Acierto exacto del marcador (ej. dijiste 3-1 y el partido terminó 3-1).
- **3 Puntos:** Acierto de la tendencia (ganador o empate), pero sin acertar el resultado exacto.
- **0 Puntos:** Pronóstico no acertado.

### ¿Se puede retirar el saldo o cambiarlo por dinero?
- **No.** FutsalBet es un juego 100% recreativo y de entretenimiento. Los puntos virtuales no tienen valor monetario real.
