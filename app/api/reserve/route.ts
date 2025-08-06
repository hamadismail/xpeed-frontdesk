"use server";
import { connectDB } from "@/lib/mongoose";
import { Book } from "@/models/book.model";
import { Room, RoomStatus } from "@/models/room.model";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const body = await req.json();
    const { bookingInfo } = body;
    const { roomId, guest, stay, payment } = bookingInfo;

    // Validate required fields
    if (!roomId || !guest?.name || !guest?.phone) {
      return NextResponse.json(
        { message: "Missing required fields (roomId, name, or phone)" },
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

    const newBooking = await Book.create({
      guest,
      stay,
      payment,
      roomId,
    });

    // Mark room as booked
    room.roomStatus = RoomStatus.RESERVED;
    room.guestId = newBooking?._id;
    await room.save();

    return NextResponse.json(
      { message: "Room booked successfully", booking: newBooking },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error booking room:", error);
    return NextResponse.json(
      { message: "Server error while booking room" },
      { status: 500 }
    );
  }
}
