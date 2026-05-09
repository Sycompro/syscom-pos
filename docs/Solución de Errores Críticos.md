# 🛠️ Historial de Errores Solucionados

Registro detallado de problemas técnicos resueltos en la integración.

## 📅 2026-05-07

### 1. Error de Almacén Inexistente (08)
- **Problema**: El sistema intentaba insertar ventas en el Almacén `08`, el cual no existe en la base de datos de pruebas (`BdNava03`).
- **Causa**: Había un mapa estático en el código que forzaba la Sede 03 al Almacén 08.
- **Solución**: Se implementó la función dinámica `getWarehouseForSede` que consulta la tabla `tbl01Alm` en tiempo real.
- **Archivo modificado**: `nava-sale-service.js`.

### 2. Invalid column name 'codusu' en mst01cob
- **Problema**: Error crítico al intentar finalizar la cobranza.
- **Causa**: La tabla `mst01cob` en `BdNava03` no tiene la columna `codusu`. El código intentaba insertarla por suposición.
- **Solución**: Se eliminó el campo `codusu` de la inserción en `mst01cob` y `dtl01cob`. La trazabilidad se mantiene mediante `idapecaj`.
- **Hallazgo**: Las tablas de cobranza en esta versión de Navasoft son más ligeras que las de facturación.

### 3. Error: Parameter 'nplan' already declared
- **Problema**: La venta fallaba con un error de parámetros duplicados al insertar en `mst01cob`.
- **Causa**: Error de sintaxis en el código donde se declaraban dos veces los inputs `.input('nplan')` y `.input('codcaj')`.
- **Solución**: Se eliminaron las líneas duplicadas en el servicio de ventas.
- **Lección**: Revisar siempre los bloques de código después de realizar limpiezas masivas de columnas.

---
[[Index|⬅️ Volver al Índice]]
