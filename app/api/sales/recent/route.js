import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const pool = await getConnection(session?.user?.company);
    
    // Fetching last 10 sales from mst01fac
    const result = await pool.request().query(`
      SELECT TOP 10 
        fecha as date, 
        cdocu as type, 
        ndocu as number, 
        nomcli as client, 
        totn as total, 
        mone as currency
      FROM mst01fac
      ORDER BY fecha DESC, FecReg DESC
    `);
    
    return NextResponse.json(result.recordset);
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
