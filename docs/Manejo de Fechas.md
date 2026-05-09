# 🕒 Manejo de Fechas y Horarios (Paridad ERP)

Para asegurar la paridad total con el ERP Navasoft, el Web POS sigue una convención estricta de fechas.

## 📅 Fecha Contable (`fecha`, `fven`)
- **Regla**: Debe ser siempre la medianoche (**12:00:00 AM**).
- **Implementación**: Se envía desde el backend como un objeto `sql.Date` basado en la zona horaria `America/Lima`.
- **Propósito**: Evitar duplicidad de registros en reportes diarios y arqueos de caja que filtran por `YYYY-MM-DD`.

## ⏱️ Fecha de Registro (`FecReg`, `fecreg`)
- **Regla**: Debe contener la estampa de tiempo exacta del sistema.
- **Implementación**: Se utiliza la función `GETDATE()` de SQL Server directamente en el `INSERT`.
- **Propósito**: Auditoría técnica y seguimiento del momento exacto de la transacción.

## 🌎 Zona Horaria
- **Problema detectado**: Railway opera en UTC, lo que causaba que las ventas después de las 7:00 PM (Perú) se registraran con el día siguiente.
- **Solución**: Se utiliza `Intl.DateTimeFormat` con `timeZone: 'America/Lima'` para forzar la fecha correcta antes de enviarla a la base de datos.

---
[[Index|⬅️ Volver al Índice]]
