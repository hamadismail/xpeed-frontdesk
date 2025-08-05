import { connectDB } from "@/lib/mongoose";
import { Book } from "@/models/book.model";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Number(searchParams.get("page")) || 1;
    const search = searchParams.get("search") || "";
    const country = searchParams.get("country") || "all";

    await connectDB();
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

    if (country && country !== "all") {
      query["guest.country"] = country;
    }

    // Get total count for pagination
    const totalCount = await Book.countDocuments(query);

    // Get paginated results using Mongoose
    const guests = await Book.find(query)
      .sort({ "stay.arrival": -1 })
      .skip(skip)
      .limit(itemsPerPage)
      .lean(); // Use lean() for better performance with plain JavaScript objects

    // Transform the data
    const transformedGuests = guests.map((guest) => ({
      _id: guest._id,
      guest: guest.guest,
      stay: {
        arrival: guest.stay.arrival,
        departure: guest.stay.departure,
        adults: guest.stay.adults,
        children: guest.stay.children,
      },
      payment: guest.payment,
      roomId: guest.roomId.toString(),
      createdAt: guest.createdAt,
      updatedAt: guest.updatedAt,
    }));

    return NextResponse.json({
      guests: transformedGuests,
      totalPages: Math.ceil(totalCount / itemsPerPage),
      hasMore: skip + itemsPerPage < totalCount,
    });
  } catch (error) {
    console.error("Error fetching guests:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
