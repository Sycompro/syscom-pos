# Análisis Forense: psventa.exe (Navasoft POS)
Este documento detalla la lógica interna descubierta mediante ingeniería inversa del sistema original psventa.exe para su réplica en el entorno web.

## 1. Arquitectura de Datos y Conexión
El sistema original psventa.exe (Visual FoxPro) actúa como orquestador central. No delega lógica compleja al servidor; en su lugar, envía comandos SQL directos y secuenciales.

*   **Bases de Datos Operativas**: `BdNava01` (Lencería), `BdNava05` (Gimnasio), etc.
*   **Identificación de Sede**: Se utiliza la tabla `tbl01pto`. Cada terminal tiene un `codpto` y un `codtie` (Código de Tienda).
*   **Mapeo de Almacén**: El `codtie` define la columna de stock en `prd0101` (ej: `001` -> `stk01`, `008` -> `stk08`).

## 2. Flujo Crítico de Venta (Secuencia Obligatoria)
Para mantener la integridad del ERP, la web debe seguir este orden exacto de operaciones:

1.  **Validación de Caja**: Consultar `dtl_restpos_apecaj`. Debe existir una sesión abierta (`estado = 0`) para el `codusu` y `codpto` actual. Se debe capturar el `idapecaj`.
2.  **Reserva de Correlativo**: Leer el número actual en `tbl01cor` para el `cdocu` (boleta/factura) y `codpto` seleccionado.
3.  **Inserción de Documentos**:
    *   `mst01fac`: Grabación de cabecera (obligatorio incluir `idapecaj`, `codpto`, `codusu`).
    *   `dtl01fac`: Grabación de ítems (detalles).
4.  **Actualización de Inventario (Doble Impacto)**:
    *   `psventa.exe` realiza un `UPDATE` manual a la columna del almacén específico (`stkXX`).
    *   **IMPORTANTE**: También realiza un `UPDATE` manual a la columna de stock total (`stoc`).
5.  **Cierre de Transacción**:
    *   Actualizar el correlativo en `tbl01cor` con el siguiente número.
    *   Si el pago es mixto o con tarjeta, insertar en `dtl_restpos_cobmixta`.

## 3. Lógica de Negocio y Reglas de Estado
*   **Anulaciones**: No se eliminan registros. Se realiza un `UPDATE` al campo `flag` en `mst01fac` con el carácter asterisco (`*`).
*   **Kardex Virtual**: Manejado automáticamente por el trigger `Trg_dtl01fac_Actu_Kdd_Virtual` en el SQL. No requiere intervención de la web más que la inserción en el detalle.
*   **Clientes Nuevos**: Deben asignarse campos por defecto para evitar errores en reportes ERP: `codgrp` (Grupo), `codven` (Vendedor) y `codzon` (Zona). El campo `coddocide` es vital para la validez de la Facturación Electrónica (DNI=1, RUC=6).

## 4. Estructura de Cobranza (`dtl_restpos_cobmixta`)
Permite desglosar el pago cuando el cliente usa múltiples medios:
*   `selpago = 1`: Efectivo.
*   `selpago = 4`: Tarjetas/Billeteras (requiere `codtar` de la tabla `tbl01tar`).

### Catálogo de Tarjetas (`tbl01tar`)
*   `01`: YAPE NÚMERO
*   `04`: YAPE QR
*   `02`: PLIN NÚMERO
*   `05`: PLIN QR
*   `03`: TARJETA (Visa/Mastercard)

## 5. Organización del Catálogo (UI)
El sistema agrupa los productos mediante:
*   **Familias (`tbl01fam`)**: Servicios, Productos.
*   **Sub-familias (`tbl01sbf`)**: Planes Gimnasio, Clases de Baile, etc. (Usar `nomsub` para las categorías de la interfaz).

---
> [!IMPORTANT]
> Cualquier discrepancia con este flujo resultará en descuadres en el arqueo de caja físico o en el inventario general del sistema Navasoft.
