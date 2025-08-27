// app/api/products/route.ts
// import { getRooms } from '@/src/lib/db';
import { connectDB } from "@/src/lib/mongoose";
import { Room, RoomStatus } from "@/src/models/room.model";
import { Book } from "@/src/models/book.model";
import { NextResponse } from "next/server";

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
  const rooms = await Room.find({}, { createdAt: 0, updatedAt: 0 })
    .sort({ roomNo: 1 })
    .populate("guestId", "guest.name guest.status")
    .lean();

  function formatDateToYMD(date: Date) {
    return date.toLocaleDateString();
  }

  // For rooms that are OCCUPIED, check if they should be DUE_OUT
  const today = formatDateToYMD(new Date());
  // today.setHours(0, 0, 0, 0); // Set to start of day for comparison

  // Process rooms to update DUE_OUT status if needed
  const processedRooms = await Promise.all(
    rooms.map(async (room) => {
      // If room is occupied, check if guest should have checked out
      if (room.roomStatus === RoomStatus.OCCUPIED && room.guestId) {
        // Get the booking for this room
        const booking = await Book.findById(room.guestId);

        if (booking && booking.stay?.departure) {
          const departureDate = formatDateToYMD(
            new Date(booking.stay.departure)
          );
          // departureDate.setHours(0, 0, 0, 0);
          // console.log(today, "->", departureDate)

          // If departure date has passed, set room to DUE_OUT
          if (departureDate < today) {
            return { ...room, roomStatus: RoomStatus.DUE_OUT };
          }
        }
      }
      return room;
    })
  );

  // Filter by search term (if provided)
  const filteredRooms = search
    ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
      processedRooms.filter((room: any) =>
        room.roomNo?.toString().includes(search)
      )
    : processedRooms;

  return NextResponse.json(filteredRooms);
}
