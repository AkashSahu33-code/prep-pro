import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  // Image generation has been disabled as per user request.
  // We return a simple error that won't crash the frontend.
  return NextResponse.json({ error: 'Image generation is currently disabled.' }, { status: 400 });
}
