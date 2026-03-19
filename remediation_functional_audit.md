# Plan de Acción: Corrección de Auditoría Funcional (v2.0)

Este documento detalla los pasos técnicos para corregir las discrepancias funcionales y fallos de lógica de negocio detectados en la auditoría del sistema REP Calisthenics.

## 1. Seguridad y Control de Acceso (RBAC)
**Problema:** El middleware `authorize` no está aplicado en el backend, permitiendo que cualquier usuario autenticado vea finanzas.

- [x] **Acción 1.1:** Modificar `backend/index.js` para aplicar `authorize(['admin', 'developer'])` en las rutas de `/api/payments`, `/api/expenses` y `/api/transactions`.
- [x] **Acción 1.2:** Aplicar `authorize(['admin', 'developer'])` en el router de usuarios (`/api/users`).

## 2. Integridad de Punto de Venta (POS) y Gestión de Caja
**Problema:** La caja está simulada en el frontend y el backend no valida stock ni recalcula totales.

- [x] **Acción 2.1 (DB):** Crear tabla `cash_registers` en `backend/init.sql` (id, status, opening_balance, closing_balance, opening_time, closing_time, cashier_id).
- [x] **Acción 2.2 (Backend):** Crear rutas para `POST /api/cash-register/open` y `POST /api/cash-register/close`.
- [x] **Acción 2.3 (Backend - Transactions):** 
    - Validar stock real en la base de datos antes de descontar.
    - Recalcular el `total_amount` en el servidor usando los precios de la DB.
    - Calcular la fecha de vencimiento (`expiration_date`) dinámicamente según el plan del miembro.
- [x] **Acción 2.4 (Frontend):** Conectar `POS.jsx` con el estado real de la caja en el backend.

## 3. Automatización de Retención e Inteligencia de Negocio
**Problema:** El módulo de retención es solo visual; no hay ejecución de servidor.

- [ ] **Acción 3.1 (Backend):** Implementar una función en `backend/index.js` que se ejecute diariamente para identificar miembros "en riesgo" (sin visitas en >15 días) y generar entradas en un nuevo log de contacto.
- [ ] **Acción 3.2 (Backend):** Crear endpoint `POST /api/retention/notify` para activar el envío de recordatorios (simulado o integrado con API externa).

## 4. Estructura de Datos y Consistencia
- [ ] **Acción 4.1:** Unificar los estados de miembro (`Activo`/`Vencido` vs `active`/`expired`) en toda la base de datos y código.

---
**Prioridad de Ejecución:**
1. Seguridad (RBAC)
2. Integridad de Transacciones (Stock y Precios)
3. Gestión de Caja Real
4. Automatización de Retención
