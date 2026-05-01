# Documentación Técnica: Análisis e Integración Web POS SyscomPro

## 1. Resumen de Arquitectura ERP
El sistema actual **SyscomPro** es una solución híbrida compuesta por:
*   **Backend de Datos**: Microsoft SQL Server (Instancia `WIN-MD1JESOHA7L`, IP ZeroTier `192.168.194.169`).
*   **Frontend de Escritorio**: Aplicaciones desarrolladas en Visual FoxPro (`ps.exe` para Administración y `psventa.exe` para Punto de Venta).
*   **Integración Web**: Base de datos `BdSyscomMovil` y procedimientos almacenados con prefijo `_Web` listos para consumo externo.

---

## 2. Mapeo de Base de Datos (Core POS)

### 2.1 Tablas Maestras de Ventas
| Tabla | Descripción | Campo Clave |
| :--- | :--- | :--- |
| `mst01fac` | Cabecera de Ventas (Factura, Boleta, Nota de Venta) | `ndocu`, `idapecaj` |
| `dtl01fac` | Detalle de productos vendidos | `ndocu`, `codart` |
| `mst01ped` | Pedidos/Cotizaciones (Ventas por Mayor) | `nrodoc` |
| `tbl01pto` | Definición de Puntos de Venta (Terminales) | `codpto` |
| `tbl01doc` | Maestro de Tipos de Documento | `cdocu` |
| `tbl01cor` | Gestión de Correlativos y Numeración | `cdocu`, `codpto` |

### 2.2 Tipos de Documentos de Venta (`cdocu`)
Identificamos los códigos que usa el POS para clasificar las ventas:
*   **`01`**: FACTURA
*   **`03`**: BOLETA VENTA
*   **`65`**: **NOTA DE VENTA** (Documento interno/no fiscal)

### 2.3 Gestión de Correlativos (Numeración)
El sistema **no genera números automáticos** (Identity) en SQL. El proceso es:
1.  **Lectura**: Se consulta `tbl01cor` filtrando por `cdocu` y `codpto`.
2.  **Incremento**: La aplicación (`psventa.exe`) toma el valor de `nroini`, incrementa el correlativo y lo asigna al documento.
3.  **Update**: Se debe actualizar `tbl01cor.nroini` inmediatamente después de la venta para evitar duplicados.

### 2.2 Gestión de Caja (Apertura y Cierre)
La lógica de caja está centralizada en la sesión de usuario activa:
*   **`dtl_restpos_apecaj`**: Almacena las aperturas de caja.
    *   `idapecaj`: ID único de sesión (vínculo vital).
    *   `fecape`: Fecha de apertura.
    *   `apesol`: Monto inicial en soles.
    *   `estado`: `0` = Abierta, `1` = Cerrada.
    *   `feccie`: Fecha de cierre.

---

## 3. Flujo Lógico del Punto de Venta (POS Workflow)

### Paso 1: Apertura de Caja
El POS verifica si el usuario tiene una sesión abierta para el `codpto` seleccionado. Si no, se genera un nuevo `idapecaj` insertando en `dtl_restpos_apecaj`.

### Paso 2: Proceso de Venta
Al procesar un pago, el sistema realiza lo siguiente:
1.  Genera correlativo en `mst01fac`.
2.  Inserta la cabecera vinculando el `idapecaj` actual.
3.  Registra el detalle en `dtl01fac`.
4.  Identifica la forma de pago (`selpago`):
    *   `1`: Efectivo S/
    *   `2`: Efectivo $
    *   `3`: Tarjeta
    *   `4`: Pago Mixto (usa tabla `dtl_restpos_cobmixta`)

### Paso 3: Cierre de Caja
Se ejecuta el procedimiento `sp_ticket_impRep_XZ`, el cual consolida todas las ventas del `idapecaj` actual, genera el reporte de arqueo y actualiza el estado de la sesión a "Cerrada".

---

## 4. Estrategia para Web POS (Dato.click)

Para la implementación de la nueva interfaz web, seguiremos estas directrices técnicas:

### A. Autenticación y Seguridad
*   Uso de `NextAuth.js` con Google OAuth para acceso administrativo.
*   Middleware de protección para asegurar que solo personal autorizado pueda abrir caja.

### B. Interfaz de Usuario (UI/UX)
*   **Diseño**: "Vivid Glass Premium" (Glastomorfismo, gradientes dinámicos).
*   **Optimización**: Diseño Mobile-First para uso en tablets y celulares en tienda.

### C. Integración de Datos
1.  **Consulta de Stock**: Uso de la tabla `prd0101`. El stock se gestiona por almacén en los campos `stk01` a `stk12`.
2.  **Sincronización de Stock**: El ERP requiere que la aplicación reste el stock manualmente (`UPDATE prd0101 SET stkXX = stkXX - cant`). No existen triggers de descuento automático.
3.  **Sincronización de Ventas**: Las ventas se insertarán directamente en `mst01fac` y `dtl01fac` vinculadas al `idapecaj`.
4.  **Facturación Electrónica**: Aprovechar la integración existente del ERP con el módulo de SUNAT.

---

## 5. Próximos Pasos de Desarrollo
1.  **Prototipo de Venta**: Crear una API en Next.js que realice una inserción de prueba en `mst01fac` y descuente stock.
2.  **Selector de Sede**: Implementar el cambio de base de datos dinámico (`BdNava01`, `BdNava02`, etc.) basado en la sede seleccionada.
3.  **Módulo de Caja**: Pantalla de apertura con ingreso de saldo inicial.

> [!IMPORTANT]
> Se ha confirmado que toda la información crítica reside en `C:\Proline`. Se mantendrá una política de **solo lectura** para la investigación y **transacciones atómicas** para la implementación del POS para garantizar la integridad de los datos históricos.
