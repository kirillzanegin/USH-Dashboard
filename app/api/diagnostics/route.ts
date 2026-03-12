import { NextResponse } from 'next/server';
import { runDiagnostics } from '@/services/diagnostics/checks';

export async function GET() {
  try {
    const result = await runDiagnostics();
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in /api/diagnostics:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
