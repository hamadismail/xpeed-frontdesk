import { connectDB } from "@/src/lib/mongoose";
import "@/src/models";
import { Book, GUEST_STATUS } from "@/src/models/book.model";
import { Payment } from "@/src/models/payment.model";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const page = Number(searchParams.get("page")) || 1;
    const search = searchParams.get("search") || "";

    const itemsPerPage = 10;
    const skip = (page - 1) * itemsPerPage;

    // Build the query
    const query: Record<string, unknown> = {};

    if (search) {
      query["$or"] = [
        { "guest.name": { $regex: search, $options: "i" } },
        { "guest.email": { $regex: search, $options: "i" } },
        { "guest.phone": { $regex: search, $options: "i" } },
      ];
    }

    // Get total count for pagination
    const totalCount = await Book.countDocuments({
      ...query,
      "guest.status": GUEST_STATUS.CHECKED_IN,
    });

    // Get paginated results with only payment-related fields
    const guests = await Book.find({
      ...query,
      "guest.status": GUEST_STATUS.CHECKED_IN,
    })
      .select("guest payment roomId")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(itemsPerPage)
      .populate({ path: "roomId", model: "Room", select: "roomNo -_id" })
      .lean();

    return NextResponse.json({
      payments: guests,
      totalPages: Math.ceil(totalCount / itemsPerPage),
      hasMore: skip + itemsPerPage < totalCount,
    });
  } catch (error) {
    console.error("Error fetching payments:", error);
    return NextResponse.json({ message: "Internal server error" });
  }
}

export async function POST(request: Request) {
  try {
    await connectDB();
    const body = await request.json();
    const { guestId, paymentDate, paymentMethod, paidAmount, paymentType } = body;

    const newPayment = new Payment({
      guestId,
      paymentDate,
      paymentMethod,
      paidAmount,
      paymentType,
    });

    await newPayment.save();

    // Update the guest's paid amount
    await Book.findByIdAndUpdate(guestId, {
      $inc: { "payment.paidAmount": paidAmount },
    });

    return NextResponse.json(
      { message: "Payment created successfully" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating payment:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
