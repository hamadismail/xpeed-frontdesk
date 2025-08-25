import { connectDB } from "@/src/lib/mongoose";
import { Book } from "@/src/models/book.model";
import { Room, RoomStatus } from "@/src/models/room.model";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    await connectDB();

    // Find all rooms that are currently occupied
    const occupiedRooms = await Room.find({ roomStatus: RoomStatus.OCCUPIED });

    // Get today's date
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let updatedCount = 0;

    // Check each occupied room
    for (const room of occupiedRooms) {
      // Find the guest staying in this room
      const booking = await Book.findById(room.guestId);

      if (booking) {
        // Get the departure date
        const departureDate = new Date(booking.stay.departure);
        departureDate.setHours(0, 0, 0, 0);

        // If departure date has passed, set room to DUE_OUT
        if (departureDate < today) {
          room.roomStatus = RoomStatus.DUE_OUT;
          await room.save();
          updatedCount++;
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Updated ${updatedCount} rooms to DUE_OUT status`,
      updatedCount,
    });
  } catch (error) {
    console.error("Error updating due out rooms:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update due out rooms" },
      { status: 500 }
    );
  }
}
