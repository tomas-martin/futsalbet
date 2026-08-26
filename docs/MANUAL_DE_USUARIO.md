# 📖 Manual de Usuario — FutsalBet

Bienvenido al **Manual de Usuario oficial de FutsalBet**, la plataforma recreativa de pronósticos deportivos (Prode) enfocada en el futsal de Mendoza (FEFUSA Mendoza).

---

> ⚠️ **IMPORTANTE: Plataforma 100% Recreativa de Prode**
> FutsalBet funciona exclusivamente como un **SISTEMA DE PRODE RECREATIVO**. No hay depósitos de dinero real, apuestas monetarias, cuotas con dinero ni transacciones bancarias o Mercado Pago. El único objetivo es pronosticar marcadores exactos, sumar puntos y competir con amigos y aficionados del futsal por la cima de la tabla de posiciones.

---

## 📋 Índice
1. [Guía para Jugadores (Usuarios)](#-guía-para-jugadores-usuarios)
   - [1. Registro e Inicio de Sesión](#1-registro-e-inicio-de-sesión)
   - [2. Cómo Funciona el Prode](#2-cómo-funciona-el-prode)
   - [3. Carga y Edición de Pronósticos](#3-carga-y-edición-de-pronósticos)
   - [4. Consultar Mis Pronósticos](#4-consultar-mis-pronósticos)
   - [5. Tabla de Posiciones y Leaderboard](#5-tabla-de-posiciones-y-leaderboard)
   - [6. Grupos Privados con Amigos](#6-grupos-privados-con-amigos)
   - [7. Favoritos y Partidos En Vivo](#7-favoritos-y-partidos-en-vivo)
2. [Guía para Administradores](#-guía-para-administradores)
   - [1. Acceso al Panel Admin](#1-acceso-al-panel-admin)
   - [2. Gestión de Partidos y Torneos](#2-gestión-de-partidos-y-torneos)
   - [3. Carga de Resultados y Cierre Automático](#3-carga-de-resultados-y-cierre-automático)
   - [4. Gestión de Usuarios y Auditoría](#4-gestión-de-usuarios-y-auditoría)
3. [Reglas de Puntuación y Preguntas Frecuentes](#-reglas-de-puntuación-y-preguntas-frecuentes)

---

## ⚽ Guía para Jugadores (Usuarios)

### 1. Registro e Inicio de Sesión
- Haz clic en **"Registrarse"** en la esquina superior derecha.
- Completa tu nombre completo, nombre de usuario (`username`), email y contraseña.
- Al registrarte correctamente, accederás de forma inmediata a la plataforma para empezar a jugar al Prode.

### 2. Cómo Funciona el Prode
- En FutsalBet pronosticas el **marcador exacto** (goles del equipo Local vs Visitante) para cada encuentro del torneo FEFUSA Mendoza.
- **Sistema de Puntuación:**
  - **6 Puntos:** Si aciertas el marcador exacto del partido (ej. pronosticaste 3-1 y terminó 3-1).
  - **3 Puntos:** Si aciertas el ganador o el empate, pero no el marcador exacto (ej. pronosticaste 2-0 y terminó 4-1).
  - **0 Puntos:** Si no acertaste el ganador ni el empate.

### 3. Carga y Edición de Pronósticos
1. Navega a la sección **"Prode"** o **"Partidos"**.
2. Ingresa la cantidad de goles esperada para el equipo Local y para el equipo Visitante en los encuentros programados.
3. Puedes hacer clic en **"Guardar Pronóstico"** en cada partido individualmente o en **"Guardar todos los pronósticos"** para enviar la fecha completa.
4. **Bloqueo Automático:** Puedes modificar tus marcadores las veces que quieras hasta la **hora exacta de inicio del partido**. Una vez que el partido comienza, el pronóstico se bloquea automáticamente.

### 4. Consultar Mis Pronósticos
- Accede a la sección **"Mis Pronósticos"** desde el menú principal.
- Podrás revisar tus pronósticos guardados clasificados por estado: **Pendientes**, **Finalizados** y el detalle de puntos obtenidos en cada encuentro.

### 5. Tabla de Posiciones y Leaderboard
- En **"Tabla General"** o **"Leaderboard"**, consulta el ranking global de usuarios ordenado por puntos totales acumulados en el Prode, aciertos exactos y porcentaje de efectividad.
- Demuestra tu conocimiento del futsal mendocino escalando posiciones fecha tras fecha.

### 6. Grupos Privados con Amigos
- En la sección **"Grupos Privados"**, puedes crear tu propia liga o grupo (ej. *"Amigos del Club"*, *"Prode la 5ta"*).
- Comparte el código único de acceso con tus amigos para que se unan.
- Cada grupo tiene su propia tabla de posiciones exclusiva calculada con los puntos del Prode de sus miembros.

### 7. Favoritos y Partidos En Vivo
- Marca tus equipos preferidos con la estrella en la sección **"Equipos"** para seguir su desempeño.
- Sigue los marcadores en vivo en la sección **"En Vivo"** durante los días de partido del torneo FEFUSA.

---

## 🛡️ Guía para Administradores

### 1. Acceso al Panel Admin
- Inicia sesión con credenciales de administrador (ej: `admin@futsalbet.com`).
- Haz clic en la insignia dorada **"Panel Admin"** en la barra superior o ve a `/admin/dashboard`.

### 2. Gestión de Partidos y Torneos
- En `/admin/partidos`, el administrador puede:
  - Crear nuevos enfrentamientos especificando torneo, fase/jornada, equipos, fecha, hora y estadio/cancha.
  - Actualizar el estado del encuentro (`SCHEDULED` - Programado, `LIVE` - En Vivo, `FINISHED` - Finalizado).

### 3. Carga de Resultados y Cierre Automático
1. Cuando un partido finaliza, ingresa a `/admin/partidos`.
2. Haz clic en **"Cargar Resultado"** e ingresa el marcador final real (ej: `Local: 4 - Visitante: 2`).
3. Al guardar el resultado, el backend ejecuta automáticamente la resolución (`BetSettlementService`):
   - Compara cada pronóstico enviado por los usuarios contra el resultado real.
   - Otorga **6 puntos** por acierto exacto o **3 puntos** por acertar la tendencia (ganador/empate).
   - Actualiza automáticamente la Tabla General y los Grupos Privados.
   - Envía notificaciones a los usuarios con los puntos obtenidos.

### 4. Gestión de Usuarios y Auditoría
- En `/admin/usuarios`, el administrador puede revisar la lista de participantes y gestionar roles (`USER` / `ADMIN`).
- En `/admin/logs`, consulta el historial de actividad administrativa y registros del sistema.

---

## ❓ Reglas de Puntuación y Preguntas Frecuentes

### Reglas de Cierre
- Los pronósticos sobre un partido se pueden realizar y modificar **hasta el momento exacto del inicio del partido**.
- Una vez iniciado el partido, los pronósticos quedan strictly **bloqueados**.

### Resumen de Puntuación
- **6 Puntos:** Acierto exacto del marcador.
- **3 Puntos:** Acierto de la tendencia (ganador o empate).
- **0 Puntos:** Pronóstico no acertado.

### ¿Se utiliza dinero real en FutsalBet?
- **No.** FutsalBet es una plataforma 100% recreativa de Prode para la comunidad del futsal mendocino. No hay dinero real, apuestas monetarias ni transacciones.
