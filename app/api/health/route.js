import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Retornamos un estado 200 OK para indicarle a Railway que el servidor está listo
    return NextResponse.json(
      { 
        status: 'UP', 
        timestamp: new Date().toISOString(),
        service: 'syscom-pos'
      }, 
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { status: 'DOWN', error: error.message }, 
      { status: 500 }
    );
  }
}
