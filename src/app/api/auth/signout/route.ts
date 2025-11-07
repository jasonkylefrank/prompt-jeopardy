
// This file is no longer used and can be removed.
// Keeping it to avoid breaking changes during development.
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ message: "This endpoint is deprecated." }, { status: 410 });
}
