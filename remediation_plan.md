# Plan de Remediación Post-Auditoría — REP Calisthenics
> **Estado:** ✅ Completado | 🗓 Fecha: 2026-03-17

---

## Fase 1: Reestructuración de Arquitectura — ✅ COMPLETADA

| Tarea | Estado | Archivo(s) |
|---|---|---|
| Extraer config de DB a módulo dedicado | ✅ | `backend/config/db.js` |
| Converter snake_case → camelCase automáticamente | ✅ | `backend/config/db.js` (helper `toCamel`) |
| Centralizar esquemas de validación Zod | ✅ | `backend/validators/schemas.js` |
| Extraer middleware de auth y autorización | ✅ | `backend/middleware/auth.js` |
| Modularizar ruta: Auth | ✅ | `backend/routes/auth.js` |
| Modularizar ruta: Users | ✅ | `backend/routes/users.js` |
| Modularizar ruta: Members | ✅ | `backend/routes/members.js` |
| Modularizar ruta: Inventory | ✅ | `backend/routes/inventory.js` |
| Modularizar ruta: Memberships | ✅ | `backend/routes/memberships.js` |
| Modularizar ruta: Transactions (POS) | ✅ | `backend/routes/transactions.js` |
| Modularizar ruta: Expenses | ✅ | `backend/routes/expenses.js` |
| Modularizar ruta: Payments | ✅ | `backend/routes/payments.js` |
| Modularizar ruta: Visits | ✅ | `backend/routes/visits.js` |
| Modularizar ruta: Appointments | ✅ | `backend/routes/appointments.js` |
| Modularizar ruta: Routines | ✅ | `backend/routes/routines.js` |
| Reescribir `index.js` como orquestador limpio | ✅ | `backend/index.js` |

---

## Fase 2: Seguridad Crítica — ✅ COMPLETADA

| Tarea | Estado | Detalle |
|---|---|---|
| Eliminar contraseña `Diabolical1502` de `init.sql` | ✅ | Reemplazado por comentario explicativo |
| Eliminar contraseña hardcodeada de `index.js` (initDB) | ✅ | Ahora usa `process.env.INITIAL_DEV_PASSWORD` |
| Eliminar endpoint `/api/users/reveal-passwords` | ✅ | Eliminado completamente de `users.js` |
| Sanitizar mensajes de error internos (no exponer detalles de DB) | ✅ | Todos los handlers usan `'Error interno del servidor'` |
| Eliminar debug de hash de contraseñas en respuesta de login | ✅ | Respuesta de error de login sanitizada |
| Agregar validación Zod a `POST /api/inventory` | ✅ | Usa `InventorySchema` |
| Agregar validación Zod a `POST/PUT /api/users` | ✅ | Usa `UserSchema` |

---

## Fase 3: Consistencia y Rendimiento — ✅ COMPLETADA

| Tarea | Estado | Detalle |
|---|---|---|
| Corregir bug `memberName` undefined en tabla de Pagos | ✅ | `payments.js` usa alias SQL `member_name as "memberName"` + helper `toCamel` global |
| Optimizar `Payments.jsx` con `Promise.all` | ✅ | Llamadas paralelas a `getPayments()` + `getMembers()` |
| Corregir texto erróneo "Cloud Firestore" en UI | ✅ | Cambiado a "PostgreSQL" |

---

## Fase 4: Documentación — ✅ COMPLETADA

| Tarea | Estado | Detalle |
|---|---|---|
| Crear `.env.example` con todas las variables | ✅ | `backend/.env.example` |
| Actualizar `.env` con nuevas variables | ✅ | Agregadas `INITIAL_ADMIN_PASSWORD` e `INITIAL_DEV_PASSWORD` |

---

## ⚠️ ACCIÓN REQUERIDA ANTES DEL DESPLIEGUE

> El equipo debe completar manualmente los siguientes pasos antes de hacer `git push` o conectar Dokploy:

1. **Completar el `.env` en el servidor de producción** con los valores reales:
   ```
   JWT_SECRET=<cadena aleatoria de 64+ caracteres>
   DATABASE_URL=<url real de producción>
   INITIAL_ADMIN_PASSWORD=<contraseña segura para admin>
   INITIAL_DEV_PASSWORD=<contraseña segura para developer>
   ```
   Generar el JWT_SECRET con:
   ```bash
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   ```

2. **Verificar que `.env` esté en `.gitignore`** (ya lo está, pero confirmar antes del push).

3. **Actualizar las contraseñas desde la UI** después del primer arranque exitoso, ya que las contraseñas iniciales del env solo se aplican una vez.

---

## Resumen de Archivos Modificados/Creados

```
backend/
├── config/
│   └── db.js           ← NUEVO: Pool de PG + helper camelCase
├── middleware/
│   └── auth.js         ← NUEVO: Middleware authenticateToken + authorize
├── validators/
│   └── schemas.js      ← NUEVO: Todos los esquemas Zod centralizados
├── routes/
│   ├── auth.js         ← REFACTORIZADO: Sin debug de hashes
│   ├── users.js        ← REFACTORIZADO: Sin reveal-passwords
│   ├── members.js      ← REFACTORIZADO
│   ├── inventory.js    ← REFACTORIZADO: + validación Zod
│   ├── memberships.js  ← REFACTORIZADO
│   ├── transactions.js ← REFACTORIZADO
│   ├── expenses.js     ← REFACTORIZADO
│   ├── payments.js     ← CORREGIDO: aliases SQL camelCase
│   ├── visits.js       ← REFACTORIZADO
│   ├── appointments.js ← REFACTORIZADO
│   └── routines.js     ← REFACTORIZADO
├── index.js            ← REESCRITO: Orquestador limpio (<280 líneas)
├── init.sql            ← CORREGIDO: Sin contraseñas hardcodeadas
└── .env.example        ← NUEVO: Documentación de variables

frontend/src/pages/
└── Payments.jsx        ← CORREGIDO: Promise.all + subtítulo correcto
```
