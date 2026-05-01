import { NextResponse } from 'next/server';
import swaggerSpec from '@/lib/swagger/config';

export async function GET() {
  try {
    return NextResponse.json(swaggerSpec);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to load API specification' },
      { status: 500 }
    );
  }
}

export async function POST() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}
