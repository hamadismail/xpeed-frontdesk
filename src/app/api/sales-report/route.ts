import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/src/lib/mongoose";
import { Payment } from "@/src/models/payment.model";
import { Book } from "@/src/models/book.model";

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const search = searchParams.get("search") || "";
    const date = searchParams.get("date");
    const paymentMethod = searchParams.get("paymentMethod");

    const query: Record<string, unknown> = {};

    if (search) {
      const guests = await Book.find({ "guest.name": { $regex: search, $options: "i" } }).select("_id");
      const guestIds = guests.map(guest => guest._id);
      query.guestId = { $in: guestIds };
    }

    if (date) {
      const selectedDate = new Date(date);
      const nextDay = new Date(selectedDate);
      nextDay.setDate(selectedDate.getDate() + 1);
      query.paymentDate = { $gte: selectedDate, $lt: nextDay };
    }

    if (paymentMethod) {
      query.paymentMethod = paymentMethod;
    }

    const payments = await Payment.find(query)
      .populate("guestId", "guest.name")
      .sort({ paymentDate: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await Payment.countDocuments(query);

    return NextResponse.json({
      data: payments,
      total,
      page,
      limit,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Failed to fetch payments" },
      { status: 500 }
    );
  }
}
