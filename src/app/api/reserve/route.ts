"use server";
import { connectDB } from "@/src/lib/mongoose";
import { Reservation } from "@/src/models/reservation.model";
import { Room, RoomStatus } from "@/src/models/room.model";
import { Book } from "@/src/models/book.model";
import { startSession } from "mongoose";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const session = await startSession();
  session.startTransaction();

  try {
    await connectDB();

    const body = await req.json();
    const { payload } = body;
    const { roomNo, arrival, departure } = payload.room;

    // Check if room is already reserved or booked for the requested dates
    const arrivalDate = new Date(arrival);
    const departureDate = new Date(departure);

    // Check for existing reservations that overlap with requested dates
    const existingReservations = await Reservation.find({
      "room.roomNo": roomNo,
      $or: [
        {
          "room.arrival": { $lte: departureDate },
          "room.departure": { $gte: arrivalDate }
        }
      ]
    });

    if (existingReservations.length > 0) {
      await session.abortTransaction();
      session.endSession();
      return NextResponse.json(
        { message: "Room already reserved for the selected dates" },
        { status: 409 }
      );
    }

    // Check for existing bookings that overlap with requested dates
    const roomData = await Room.findOne({ roomNo });
    if (roomData) {
      const existingBookings = await Book.find({
        roomId: roomData._id,
        $or: [
          {
            "stay.arrival": { $lte: departureDate },
            "stay.departure": { $gte: arrivalDate }
          }
        ]
      });

      if (existingBookings.length > 0) {
        await session.abortTransaction();
        session.endSession();
        return NextResponse.json(
          { message: "Room already booked for the selected dates" },
          { status: 409 }
        );
      }
    }

    // Create reservation inside transaction
    const newReservation = await Reservation.create([payload], { session });

    // Find and update room inside transaction
    const room = await Room.findOne({ roomNo }).session(session);
    if (!room) {
      throw new Error("Room not found");
    }

    // room.roomStatus = RoomStatus.RESERVED;
    // await room.save({ session });

    // Commit transaction
    await session.commitTransaction();
    session.endSession();

    return NextResponse.json({
      success: true,
      message: "Room reserved successfully",
      booking: newReservation[0], // because create with array returns []
      status: 201,
    });
  } catch (error) {
    // Rollback transaction
    await session.abortTransaction();
    session.endSession();

    return NextResponse.json({
      success: false,
      message: "Server error while reserving room",
      status: 500,
      error: (error as Error).message,
    });
  }
}

export async function GET(request: Request) {
  // Extract `search` query parameter
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search")?.toLowerCase() || "";

  await connectDB();
  // Get all reservation
  const reservation = await Reservation.find().sort({ _id: -1 });

  // Filter by search term (if provided)
  const filteredReservation = search
    ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
      reservation.filter((res: any) => res.room.roomNo?.toString() === search)
    : reservation;

  return NextResponse.json(filteredReservation);
}

export async function DELETE(req: NextRequest) {
  try {
    await connectDB();
    const { reservationId } = await req.json();

    if (!reservationId) {
      return NextResponse.json(
        { success: false, error: "Reservation ID is required" },
        { status: 400 }
      );
    }

    const deletedReservation = await Reservation.findByIdAndDelete(reservationId);

    if (!deletedReservation) {
      return NextResponse.json(
        { success: false, error: "Reservation not found" },
        { status: 404 }
      );
    }
    
    // Also update the room status to AVAILABLE
    await Room.findOneAndUpdate(
      { roomNo: deletedReservation.room.roomNo },
      { roomStatus: RoomStatus.AVAILABLE, guestId: null }
    );

    return NextResponse.json({
      success: true,
      data: deletedReservation,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: (error as Error).message,
      },
      { status: 500 }
    );
  }
}

