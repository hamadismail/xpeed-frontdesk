"use server";
import { connectDB } from "@/src/lib/mongoose";
import { Book } from "@/src/models/book.model";
import { Room, RoomStatus } from "@/src/models/room.model";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  try {
    await connectDB();

    // Get all bookings and populate room information
    const bookings = await Book.find().sort({ createdAt: -1 }).lean();

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

    // Check if room is already booked or reserved for the requested dates
    // const { arrival, departure } = stay;
    // const arrivalDate = new Date(arrival);
    // const departureDate = new Date(departure);

    // Check for existing bookings that overlap with requested dates
    // const existingBookings = await Book.find({
    //   roomId: roomId,
    //   $or: [
    //     {
    //       "stay.arrival": { $lte: departureDate },
    //       "stay.departure": { $gte: arrivalDate }
    //     }
    //   ]
    // });

    // if (existingBookings.length > 0) {
    //   return NextResponse.json(
    //     { message: "Room already booked for the selected dates" },
    //     { status: 409 }
    //   );
    // }

    // Check for existing reservations that overlap with requested dates
    // const { Reservation } = await import("@/src/models/reservation.model");
    // const existingReservations = await Reservation.find({
    //   "room.roomNo": room.roomNo,
    //   $or: [
    //     {
    //       $and: [
    //         { "room.arrival": { $lt: departureDate } },
    //         { "room.departure": { $gt: arrivalDate } }
    //       ]
    //     }
    //   ]
    // });

    // if (existingReservations.length > 0) {
    //   return NextResponse.json(
    //     { message: "Room already reserved for the selected dates" },
    //     { status: 409 }
    //   );
    // }

    // Additional validation for room status
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

