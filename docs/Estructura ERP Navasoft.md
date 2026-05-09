# 📊 Estructura ERP Navasoft

Este documento detalla las tablas del ERP Navasoft utilizadas por el Web POS y los hallazgos de las auditorías de columnas.

## 📄 Tablas de Ventas
- **[[mst01fac]]**: Cabecera de facturación. Contiene el usuario (`codusu`) y la sede (`Codpto`).
- **[[dtl01fac]]**: Detalle de productos vendidos. *Nota: No tiene columna `codusu`.*
- **[[tbl01cor]]**: Correlativos y numeración por sede.

## 💰 Tablas de Cobranza
- **[[mst01cob]]**: Maestro de cobros. 
	- ⚠️ *Hallazgo crítico*: En `BdNava03` **NO existe** la columna `codusu`. Se eliminó de la sincronización para evitar errores.
- **[[dtl01cob]]**: Desglose de pagos (Efectivo/Tarjeta).
- **[[dtl_restpos_cobmixta]]**: Registro de pagos con múltiples métodos.

## 📦 Tablas de Almacén y Maestros
- **[[tbl01Alm]]**: Mapeo de sedes vs almacenes.
- **[[prd0101]]**: Maestro de productos y stock.
- **[[tbl01fdp]]**: Formas de pago (Efectivo, Tarjeta, Banco).

---
[[Index|⬅️ Volver al Índice]]
