import { connectDB } from "@/src/lib/mongoose";
import { Book } from "@/src/models/book.model";
import { Room, RoomStatus } from "@/src/models/room.model";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ bookId: string }> }
): Promise<NextResponse> {
  try {
    await connectDB();
    const { bookId } = await params;

    if (!bookId) {
      return NextResponse.json(
        { message: "Guest ID is required." },
        { status: 400 }
      );
    }

    const guest = await Book.findById(bookId);

    if (!guest) {
      return NextResponse.json(
        { message: "Guest not found." },
        { status: 404 }
      );
    }

    return NextResponse.json(guest, { status: 200 });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error("Error fetching guest:", error);
    return NextResponse.json(
      { message: "Internal server error.", error: error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ bookId: string }> }
): Promise<NextResponse> {
  try {
    await connectDB();
    const { bookId } = await params;

    const body = await req.json();
    const { bookingInfo } = body;

    if (!bookingInfo) {
      return NextResponse.json(
        { message: "Booking info is required" },
        { status: 400 }
      );
    }

    const room = await Room.findById(bookingInfo?.roomId);
    if (!room) {
      return NextResponse.json({ message: "Room not found" }, { status: 404 });
    }

    const updatedBooking = await Book.findByIdAndUpdate(
      bookId,
      {
        $set: {
          guest: bookingInfo.guest,
          stay: bookingInfo.stay,
          payment: bookingInfo.payment,
          roomId: bookingInfo.roomId,
        },
      },
      { new: true }
    );

    // Mark room as booked
    room.roomStatus = RoomStatus.OCCUPIED;
    await room.save();

    if (!updatedBooking) {
      return NextResponse.json(
        { message: "Booking not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(updatedBooking, { status: 200 });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error("PATCH error:", error);
    return NextResponse.json(
      { message: "Internal server error", error: error.message },
      { status: 500 }
    );
  }
}
