import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { getConnection } from "@/lib/db";
import sql from "mssql";

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    CredentialsProvider({
      id: "credentials",
      name: "ERP Credentials",
      credentials: {
        code: { label: "Código Empresa", type: "text" },
        username: { label: "Usuario", type: "text" },
        password: { label: "Contraseña", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.code || !credentials?.username || !credentials?.password) {
          throw new Error("Faltan credenciales");
        }

        try {
          // 1. Determinar base de datos
          let dbName = null;
          try {
              const masterPool = await getConnection('BdNava01');
              const empresaResult = await masterPool.request()
                .input('code', credentials.code)
                .query("SELECT Base FROM confemp01 WHERE Codigo = @code AND Estado = 1");

              if (empresaResult.recordset.length > 0) {
                dbName = empresaResult.recordset[0].Base.trim();
              }
          } catch (e) {
              console.warn("[Auth] Fallback a código directo");
          }

          if (!dbName) {
            const cleanCode = credentials.code.trim().padStart(2, '0');
            dbName = `BdNava${cleanCode}`;
          }

          console.log(`[Auth] Validando en ${dbName} para usuario: ${credentials.username}`);
          const empresaPool = await getConnection(dbName);
          
          // 2. Autenticación ERP con comparación ASCII (Más robusto contra encoding)
          try {
             // Generamos los códigos ASCII esperados (Shift +105)
             const expectedCodes = credentials.password.split('').map(c => c.charCodeAt(0) + 105);
             
             // Construimos la condición SQL para comparar caracter por caracter
             // NOTA: Usamos ASCII() en SQL que devuelve el valor de 0-255
             // Si el código es > 255 (Unicode), usamos el valor base.
             const asciiConditions = expectedCodes.map((code, i) => {
                // En SQL Server, ASCII() de caracteres extendidos puede variar según colación,
                // pero UNICODE() es constante para los caracteres de Navasoft.
                return `UNICODE(SUBSTRING(Clave, ${i + 1}, 1)) = ${code}`;
             }).join(' AND ');

             const query = `
                SELECT Usuario, Nombres + ' ' + Apellidos as FullName 
                FROM TBL_USUARIO 
                WHERE Usuario = @usuario 
                AND (${asciiConditions}) 
                AND LEN(RTRIM(Clave)) = ${expectedCodes.length}
                AND Estado = 1
             `;

             const erpResult = await empresaPool.request()
                .input('usuario', credentials.username)
                .query(query);
             
             if (erpResult.recordset.length > 0) {
                const user = erpResult.recordset[0];
                console.log(`[Auth] ¡ÉXITO! Usuario ${user.Usuario} autenticado en ${dbName}`);
                return {
                  id: user.Usuario,
                  name: user.FullName?.trim() || user.Usuario,
                  username: user.Usuario,
                  company: dbName,
                  schema: 'ERP'
                };
             }
          } catch (e) {
             console.error("[Auth] Error en esquema ERP:", e.message);
          }

          // 3. Fallback: Esquema POS (Sede en plano)
          try {
             const posResult = await empresaPool.request()
                .input('usuario', credentials.username)
                .input('clave', credentials.password)
                .query(`
                  SELECT S.SedeId, S.Direccion AS SedeName, E.RazonSocial, E.Ruc, E.EmpresaId
                  FROM Sede AS S
                  INNER JOIN Empresa AS E ON S.EmpresaId = E.EmpresaId
                  WHERE S.Usuario = @usuario AND S.Clave = @clave
                `);
             
             if (posResult.recordset.length > 0) {
                const seat = posResult.recordset[0];
                return {
                  id: String(seat.SedeId),
                  name: seat.RazonSocial?.trim() || 'Sede POS',
                  username: credentials.username,
                  company: dbName,
                  empresaId: seat.EmpresaId,
                  sedeId: seat.SedeId,
                  sedeName: seat.SedeName?.trim(),
                  ruc: seat.Ruc?.trim(),
                  schema: 'POS'
                };
             }
          } catch (e) {}

          return null;
        } catch (err) {
          console.error("[Auth] Error Crítico:", err.message);
          return null;
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.company = user.company;
        token.username = user.username;
        token.empresaId = user.empresaId;
        token.sedeId = user.sedeId;
        token.sedeName = user.sedeName;
        token.ruc = user.ruc;
        token.schema = user.schema;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.company = token.company;
        session.user.username = token.username;
        session.user.empresaId = token.empresaId;
        session.user.sedeId = token.sedeId;
        session.user.sedeName = token.sedeName;
        session.user.ruc = token.ruc;
        session.user.schema = token.schema;
      }
      return session;
    }
  },
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET,
  pages: { signIn: '/auth/signin' }
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
