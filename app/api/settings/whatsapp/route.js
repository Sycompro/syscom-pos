import { NextResponse } from 'next/server';
import sql from 'mssql';
import { getConnection } from '@/lib/db';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// Crear tabla si no existe en la base de datos de la empresa
async function ensureTable(pool) {
    await pool.request().query(`
        IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='tbl_pos_settings' AND xtype='U')
        BEGIN
            CREATE TABLE tbl_pos_settings (
                id INT PRIMARY KEY DEFAULT 1,
                whatsapp_url VARCHAR(255),
                whatsapp_token VARCHAR(255),
                company_logo_url VARCHAR(MAX),
                custom_name VARCHAR(255),
                business_type VARCHAR(50) DEFAULT 'gym',
                CHECK (id = 1)
            );
            INSERT INTO tbl_pos_settings (id, whatsapp_url, whatsapp_token, company_logo_url, custom_name, business_type) 
            VALUES (1, '', '', '', '', 'gym');
        END
        ELSE
        BEGIN
            -- Asegurar que existen las columnas si la tabla ya existía de antes
            IF NOT EXISTS (SELECT * FROM syscolumns WHERE id = OBJECT_ID('tbl_pos_settings') AND name = 'company_logo_url')
            ALTER TABLE tbl_pos_settings ADD company_logo_url VARCHAR(MAX);
            
            IF NOT EXISTS (SELECT * FROM syscolumns WHERE id = OBJECT_ID('tbl_pos_settings') AND name = 'custom_name')
            ALTER TABLE tbl_pos_settings ADD custom_name VARCHAR(255);

            IF NOT EXISTS (SELECT * FROM syscolumns WHERE id = OBJECT_ID('tbl_pos_settings') AND name = 'business_type')
            ALTER TABLE tbl_pos_settings ADD business_type VARCHAR(50);
        END

        IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='tbl_whatsapp_logs' AND xtype='U')
        CREATE TABLE tbl_whatsapp_logs (
            id INT IDENTITY(1,1) PRIMARY KEY,
            phone VARCHAR(20),
            message NVARCHAR(MAX),
            status VARCHAR(50),
            created_at DATETIME DEFAULT GETDATE()
        );
    `);
}

export async function GET(request) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    try {
        const dbName = session.user.company;
        const pool = await getConnection(dbName);
        await ensureTable(pool);
        
        const { searchParams } = new URL(request.url);
        const type = searchParams.get('type');

        if (type === 'logs') {
            let result = await pool.request().query('SELECT TOP 50 * FROM tbl_whatsapp_logs ORDER BY created_at DESC');
            return NextResponse.json(result.recordset);
        }

        let result = await pool.request().query('SELECT whatsapp_url, whatsapp_token, company_logo_url, custom_name, business_type FROM tbl_pos_settings WHERE id=1');
        return NextResponse.json(result.recordset[0] || { whatsapp_url: '', whatsapp_token: '', company_logo_url: '', custom_name: '', business_type: 'gym' });
    } catch (error) {
        console.error('Error loading settings:', error);
        return NextResponse.json({ error: 'Error al procesar solicitud' }, { status: 500 });
    }
}

export async function POST(request) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    try {
        const body = await request.json();
        const { whatsapp_url, whatsapp_token, company_logo_url } = body;
        
        const dbName = session.user.company;
        const pool = await getConnection(dbName);
        await ensureTable(pool);

        await pool.request()
            .input('url', sql.VarChar(255), whatsapp_url || '')
            .input('token', sql.VarChar(255), whatsapp_token || '')
            .input('logo', sql.VarChar(sql.MAX), company_logo_url || '')
            .query(`
                UPDATE tbl_pos_settings 
                SET whatsapp_url = @url, 
                    whatsapp_token = @token, 
                    company_logo_url = @logo 
                WHERE id=1
            `);
            
        return NextResponse.json({ success: true, message: 'Configuración guardada exitosamente en ' + dbName });
    } catch (error) {
        console.error('Error saving settings:', error);
        return NextResponse.json({ success: false, error: 'Error al guardar ajustes: ' + error.message }, { status: 500 });
    }
}
