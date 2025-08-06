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
    const { guestId } = params;

    // Check for valid ObjectId
    if (!Types.ObjectId.isValid(guestId)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    const book = await Book.findById(guestId)
      .select(
        "guest.name stay.arrival stay.departure subtotal payment.paidAmount payment.dueAmount payment.paymentMethod remarks"
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
