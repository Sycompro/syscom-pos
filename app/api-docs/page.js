'use client';

import React from 'react';
import SwaggerUI from 'swagger-ui-react';
import 'swagger-ui-react/swagger-ui.css';

export default function ApiDocs() {
  // En una implementación real, esto se generaría dinámicamente
  // Por ahora pondremos un esquema básico para mostrar que funciona
  const spec = {
    openapi: "3.0.0",
    info: {
      title: "Dato.Click ERP API",
      version: "1.0.0",
      description: "API Profesional para integración con Navasoft ERP"
    },
    paths: {
      "/api/sales/finalize": {
        post: {
          summary: "Finalizar una venta",
          tags: ["Ventas"],
          responses: {
            200: { description: "Venta creada exitosamente" },
            400: { description: "Datos inválidos" },
            500: { description: "Error interno" }
          }
        }
      },
      "/api/payment-methods": {
        get: {
          summary: "Obtener métodos de pago dinámicos",
          tags: ["Maestros"],
          responses: {
            200: { description: "Lista de métodos" }
          }
        }
      }
    }
  };

  return (
    <div style={{ background: '#fff', minHeight: '100vh' }}>
      <SwaggerUI spec={spec} />
    </div>
  );
}
