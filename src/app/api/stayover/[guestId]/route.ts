"use server";

import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/src/lib/mongoose";
import { Book } from "@/src/models/book.model";
import { Payment } from "@/src/models/payment.model";
import { Types } from "mongoose";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ guestId: string }> }
): Promise<NextResponse> {
  try {
    await connectDB();
    const { guestId } = await params;

    // Check for valid ObjectId
    if (!Types.ObjectId.isValid(guestId)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    const book = await Book.findById(guestId)
      .select(
        "guest.name stay.arrival stay.departure payment.subtotal payment.paidAmount payment.dueAmount payment.roomPrice remarks"
      )
      .lean();

    if (!book) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    return NextResponse.json(book, { status: 200 });
  } catch (error) {
    console.error("Error fetching booking:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ guestId: string }> }
): Promise<NextResponse> {
  try {
    await connectDB();
    const { guestId } = await params;

    if (!guestId) {
      return NextResponse.json(
        { message: "Guest ID is required." },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { bookingInfo } = body;

    if (!bookingInfo?.stay || !bookingInfo?.payment) {
      return NextResponse.json(
        { message: "Invalid booking information." },
        { status: 400 }
      );
    }

    // Get the current document first
    const currentBooking = await Book.findById(guestId).populate("roomId");
    if (!currentBooking) {
      return NextResponse.json(
        { message: "Guest not found." },
        { status: 404 }
      );
    }

    const guestName = currentBooking.guest.name;
    // Define a type for roomId if not already defined
    type RoomType = { roomNo: string };
    const roomNo = (currentBooking.roomId as RoomType).roomNo;

    const updatedGuest = await Book.findByIdAndUpdate(
      guestId,
      {
        $set: {
          "stay.departure": bookingInfo.stay.departure,
          "payment.subtotal": bookingInfo.payment.subtotal,
          "payment.dueAmount": bookingInfo.payment.dueAmount,
        },
        $inc: {
          "payment.paidAmount": bookingInfo.payment.paidAmount,
        },
      },
      { new: true }
    );

    // Create a payment record
    await Payment.create({
      guestId: guestId,
      guestName,
      roomNo,
      paymentDate: new Date(),
      paymentMethod: bookingInfo.payment.paymentMethod,
      paidAmount: bookingInfo.payment.paidAmount,
    });

    return NextResponse.json(updatedGuest, { status: 200 });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error("Error updating guest:", error);
    return NextResponse.json(
      { message: "Internal server error.", error: error.message },
      { status: 500 }
    );
  }
}
