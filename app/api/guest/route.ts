import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import { Room } from "@/models/room.model";
import { Guest } from "@/models/guest.model";

// POST /api/guest
export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const { roomId, guestName, guestPhone } = await req.json();

    if (!roomId || !guestName || !guestPhone) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    const room = await Room.findById(roomId);

    if (!room) {
      return NextResponse.json({ message: "Room not found" }, { status: 404 });
    }

    if (room.isBooked) {
      return NextResponse.json(
        { message: "Room already booked" },
        { status: 409 }
      );
    }

    // Create guest record
    const guest = await Guest.create({
      name: guestName,
      phone: guestPhone,
      room: roomId,
      checkInDate: new Date(),
    });

    // Update room status
    room.isBooked = true;
    await room.save();

    return NextResponse.json(
      { message: "Room booked", guest },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error booking guest:", error);
    return NextResponse.json(
      { message: "Server error while booking room" },
      { status: 500 }
    );
  }
}
