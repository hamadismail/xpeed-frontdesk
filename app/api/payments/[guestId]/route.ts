import { connectDB } from "@/lib/mongoose";
import { Book } from "@/models/book.model";
import { NextRequest, NextResponse } from "next/server";

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
    const { payment } = body;

    if (!payment) {
      return NextResponse.json(
        { message: "Invalid booking information." },
        { status: 400 }
      );
    }

    // Get the current document first
    const currentBooking = await Book.findById(guestId);
    if (!currentBooking) {
      return NextResponse.json(
        { message: "Guest not found." },
        { status: 404 }
      );
    }

    const updatedGuest = await Book.findByIdAndUpdate(
      guestId,
      {
        $set: {
          "payment.paidAmount": payment.paidAmount,
          "payment.dueAmount": payment.dueAmount,
        },
      },
      { new: true }
    );

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
