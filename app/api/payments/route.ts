import { connectDB } from "@/lib/mongoose";
import { Book } from "@/models/book.model";
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
    const totalCount = await Book.countDocuments(query);

    // Get paginated results with only payment-related fields
    const guests = await Book.find(query)
      .select("guest payment roomId createdAt")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(itemsPerPage)
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
