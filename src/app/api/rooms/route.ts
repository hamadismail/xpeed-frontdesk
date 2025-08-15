// app/api/products/route.ts
// import { getRooms } from '@/src/lib/db';
import { connectDB } from '@/src/lib/mongoose';
import { Room } from '@/src/models/room.model';
import { NextResponse } from 'next/server';

// export async function GET() {
//   const rooms = await getRooms();
//   return NextResponse.json(rooms);
// }

export async function GET(request: Request) {
  // Extract `search` query parameter
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search")?.toLowerCase() || "";

  await connectDB();
  // Get all rooms
  const rooms = await Room.find().sort({ roomNo: 1 }).lean();

  // Filter by search term (if provided)
  const filteredRooms = search
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ? rooms.filter((room: any) =>
        room.roomNo?.toString().includes(search)
      )
    : rooms;

  return NextResponse.json(filteredRooms);
}
