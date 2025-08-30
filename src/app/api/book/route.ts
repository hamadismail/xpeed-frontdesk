"use server";
import { connectDB } from "@/src/lib/mongoose";
import { Book } from "@/src/models/book.model";
import { Payment } from "@/src/models/payment.model";
import { Room, RoomStatus } from "@/src/models/room.model";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  try {
    await connectDB();

    // Get all bookings and populate room information
    const bookings = await Book.find({}, { createdAt: 0, updatedAt: 0 })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json(bookings);
  } catch (error) {
    console.error("Error fetching bookings:", error);
    return NextResponse.json(
      { message: "Server error while fetching bookings" },
      { status: 500 }
    );
  }
}

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

    if (room.roomStatus === RoomStatus.OCCUPIED) {
      return NextResponse.json(
        { message: "Room not available for booking" },
        { status: 409 }
      );
    }

    const newBooking = await Book.create({
      guest,
      stay,
      payment,
      roomId,
    });

    // Create a payment record
    await Payment.create({
      guestId: newBooking._id,
      paymentDate: stay.arrival,
      paymentMethod: payment.paymentMethod,
      paidAmount: payment.paidAmount,
    });

    // Mark room as booked
    room.roomStatus = RoomStatus.OCCUPIED;
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
