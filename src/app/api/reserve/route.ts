"use server";
import { connectDB } from "@/src/lib/mongoose";
import { Reservation } from "@/src/models/reservation.model";
import { Room, RoomStatus } from "@/src/models/room.model";
import { startSession } from "mongoose";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const session = await startSession();
  session.startTransaction();

  try {
    await connectDB();

    const body = await req.json();
    const { payload } = body;
    const { roomNo } = payload.room;

    // Create reservation inside transaction
    const newReservation = await Reservation.create([payload], { session });

    // Find and update room inside transaction
    const roomData = await Room.findOne({ roomNo }).session(session);
    if (!roomData) {
      throw new Error("Room not found");
    }

    roomData.roomStatus = RoomStatus.RESERVED;
    await roomData.save({ session });

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
