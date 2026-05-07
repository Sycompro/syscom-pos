import { PrismaClient } from '@prisma/client';

// Cache global para evitar crear múltiples instancias de Prisma
// y agotar el pool de conexiones.
const prismaClients = {};

/**
 * Crea o recupera una instancia de Prisma configurada para una base de datos específica.
 */
export const getPrismaClient = (dbName) => {
  // Si ya tenemos un cliente para esta DB, lo reutilizamos
  if (prismaClients[dbName]) {
    return prismaClients[dbName];
  }

  const server = process.env.DB_SERVER;
  const user = process.env.DB_USER;
  const password = process.env.DB_PASSWORD;
  
  // Construir la cadena de conexión con parámetros de optimización
  // Aumentamos el pool para evitar el error de "Timed out fetching a new connection"
  const url = `sqlserver://${server};database=${dbName};user=${user};password=${password};encrypt=false;trustServerCertificate=true;connectionLimit=10;connectionTimeout=30;poolTimeout=30;`;

  console.log(`[Prisma] Creando nueva instancia para ${dbName}`);

  const client = new PrismaClient({
    datasourceUrl: url,
  });

  // Guardar en cache
  prismaClients[dbName] = client;
  
  return client;
};
