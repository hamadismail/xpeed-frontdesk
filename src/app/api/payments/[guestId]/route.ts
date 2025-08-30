"use server";

import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/src/lib/mongoose";
import { Book } from "@/src/models/book.model";
import { Payment } from "@/src/models/payment.model";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { guestId: string } }
): Promise<NextResponse> {
  try {
    await connectDB();
    const { guestId } = params;

    if (!guestId) {
      return NextResponse.json(
        { message: "Guest ID is required." },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { payment } = body;

    if (!payment?.paidAmount) {
      return NextResponse.json(
        { message: "Invalid payment information." },
        { status: 400 }
      );
    }

    const updatedGuest = await Book.findByIdAndUpdate(
      guestId,
      {
        $set: {
          "payment.dueAmount": payment.dueAmount,
        },
        $inc: {
          "payment.paidAmount": payment.paidAmount,
        },
      },
      { new: true }
    );

    // Create a payment record
    await Payment.create({
      guestId: guestId,
      paymentDate: new Date(),
      paymentMethod: payment.paymentMethod,
      paidAmount: payment.paidAmount,
    });

    return NextResponse.json(updatedGuest, { status: 200 });
  } catch (error: unknown) {
    console.error("Error updating payment:", error);
    return NextResponse.json(
      {
        message: "Internal server error.",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
