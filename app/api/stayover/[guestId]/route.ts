"use server";

import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import { Book } from "@/models/book.model";
import { Types } from "mongoose";

export async function GET(
  req: NextRequest,
  { params }: { params: { guestId: string } }
) {
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
  req: Request,
  { params }: { params: { guestId: string } }
) {
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

    if (!bookingInfo || !bookingInfo.stay || !bookingInfo.payment) {
      return NextResponse.json(
        { message: "Invalid booking information." },
        { status: 400 }
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updatePayload: any = {};

    if (bookingInfo?.stay) {
      for (const key in bookingInfo.stay) {
        updatePayload[`stay.${key}`] = bookingInfo.stay[key];
      }
    }

    if (bookingInfo?.payment) {
      for (const key in bookingInfo.payment) {
        updatePayload[`payment.${key}`] = bookingInfo.payment[key];
      }
    }

    const updatedGuest = await Book.findByIdAndUpdate(
      guestId,
      {
        $set: updatePayload,
      },
      { new: true }
    );

    if (!updatedGuest) {
      return NextResponse.json(
        { message: "Guest not found." },
        { status: 404 }
      );
    }

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
