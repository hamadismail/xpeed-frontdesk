// app/api/products/route.ts
import { getRooms } from '@/src/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  const rooms = await getRooms();
  return NextResponse.json(rooms);
}
