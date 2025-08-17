"use server";
import { connectDB } from "@/src/lib/mongoose";
import { Reservation } from "@/src/models/reservation.model";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const body = await req.json();
    const { payload } = body;

    const newReservation = await Reservation.create(payload);

    return NextResponse.json({
      message: "Room reservers successfully",
      booking: newReservation,
      status: 201,
    });
  } catch (error) {
    return NextResponse.json({
      message: "Server error while reserving room",
      status: 500,
      error,
    });
  }
}
