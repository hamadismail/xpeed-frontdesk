"use client";

import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import {
  format,
  addDays,
  subDays,
  eachDayOfInterval,
  isWithinInterval,
  differenceInDays,
  startOfWeek,
  max,
  min,
} from "date-fns";
import {
  ChevronLeft,
  ChevronRight,
  BedDouble,
  CalendarDays,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { IBook, GUEST_STATUS } from "@/src/models/book.model";
import { IReservation } from "@/src/types";
import { IRoom } from "@/src/models/room.model";
import LoadingSpiner from "@/src/utils/LoadingSpiner";
import { cn } from "@/src/lib/utils";

const VIEW_DAYS = 14; // Show 14 days at a time

export default function StayViewPage() {
  const [startDate, setStartDate] = useState(startOfWeek(new Date()));

  const { data: allRooms = [], isLoading: roomsLoading } = useQuery<IRoom[]>({
    queryKey: ["rooms"],
    queryFn: () => axios.get("/api/rooms").then((res) => res.data),
  });

  const { data: allBookings = [], isLoading: bookingsLoading } = useQuery<
    IBook[]
  >({
    queryKey: ["book"],
    queryFn: () => axios.get("/api/book").then((res) => res.data),
  });

  const { data: allReservations = [], isLoading: reservationsLoading } =
    useQuery<IReservation[]>({
      queryKey: ["reserve"],
      queryFn: () => axios.get("/api/reserve").then((res) => res.data),
    });

  const endDate = addDays(startDate, VIEW_DAYS - 1);
  const dateRange = eachDayOfInterval({ start: startDate, end: endDate });

  const handleNext = () => setStartDate(addDays(startDate, VIEW_DAYS));
  const handlePrev = () => setStartDate(subDays(startDate, VIEW_DAYS));
  const handleToday = () => setStartDate(startOfWeek(new Date()));

  const sortedRooms = useMemo(() => {
    return [...allRooms].sort((a, b) => a.roomNo.localeCompare(b.roomNo));
  }, [allRooms]);

  const getBookingStatus = (booking: IBook) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const departureDate = new Date(booking.stay.departure);
    departureDate.setHours(0, 0, 0, 0);

    if (departureDate.getTime() === today.getTime()) {
      return GUEST_STATUS.CHECKED_OUT; // Or a specific "Due Out" status if you prefer
    }
    return booking.guest.status;
  };

  if (roomsLoading || bookingsLoading || reservationsLoading) {
    return <LoadingSpiner />;
  }

  return (
    <div className="p-4 sm:p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between mb-4 bg-white p-4 rounded-lg shadow-sm">
        <div className="flex items-center gap-3 mb-4 sm:mb-0">
          <CalendarDays className="h-8 w-8 text-primary" />
          <h1 className="text-2xl font-bold text-gray-800">Stay View</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={handlePrev}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" onClick={handleToday}>
            Today
          </Button>
          <Button variant="outline" size="icon" onClick={handleNext}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <div className="hidden md:block ml-4 font-semibold text-gray-600">
            {format(startDate, "MMM dd, yyyy")} -{" "}
            {format(endDate, "MMM dd, yyyy")}
          </div>
        </div>
      </div>

      {/* Timeline Grid */}
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <div
          className="inline-grid min-w-full"
          style={{
            gridTemplateColumns: `minmax(120px, 1.5fr) repeat(${VIEW_DAYS}, minmax(60px, 1fr))`,
          }}
        >
          {/* Date Header */}
          <div className="sticky top-0 z-10 bg-gray-100 p-2 border-b border-r border-gray-200 font-semibold text-sm text-gray-600 flex items-center justify-center">
            Room
          </div>
          {dateRange.map((date) => (
            <div
              key={date.toString()}
              className="sticky top-0 z-10 bg-gray-100 p-2 border-b border-gray-200 text-center"
            >
              <div className="text-xs text-gray-500">{format(date, "E")}</div>
              <div className="text-lg font-semibold text-gray-700">
                {format(date, "d")}
              </div>
            </div>
          ))}

          {/* Room Rows and Bookings */}
          {sortedRooms.map((room) => (
            <React.Fragment key={room._id?.toString()}>
              {/* Room Info Cell */}
              <div className="sticky left-0 bg-white p-2 border-r border-b border-gray-200 font-semibold text-sm text-gray-700 flex flex-col justify-center">
                <div className="flex items-center gap-2">
                  <BedDouble className="h-4 w-4 text-primary" />
                  <span>{room.roomNo}</span>
                </div>
                <div className="text-xs text-gray-500 font-normal truncate">
                  {room.roomType}
                </div>
              </div>

              {/* Timeline Cells */}
              <div
                className="col-start-2 col-span-full grid relative"
                style={{
                  gridTemplateColumns: `repeat(${VIEW_DAYS}, minmax(60px, 1fr))`,
                }}
              >
                {/* Grid lines */}
                {dateRange.map((date, dateIndex) => (
                  <div
                    key={date.toString()}
                    className={cn(
                      "border-r border-b border-gray-200",
                      (dateIndex + 1) % 7 === 0 && "border-r-gray-400"
                    )}
                  />
                ))}

                {/* Render Bookings */}
                {allBookings
                  .filter((booking) => {
                    const bookingRoomId =
                      typeof booking.roomId === "object" &&
                      booking.roomId !== null
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        ? (booking.roomId as any)._id.toString()
                        : booking.roomId;
                    return bookingRoomId === room._id?.toString();
                  })
                  .map((booking) => {
                    const bookingStart = new Date(booking.stay.arrival);
                    const bookingEnd = new Date(booking.stay.departure);

                    if (
                      !isWithinInterval(bookingStart, {
                        start: subDays(startDate, 31),
                        end: addDays(endDate, 31),
                      })
                    )
                      return null;

                    const visibleStart = max([bookingStart, startDate]);
                    const visibleEnd = min([bookingEnd, endDate]);

                    if (visibleStart > visibleEnd) return null;

                    const startDayIndex = differenceInDays(
                      visibleStart,
                      startDate
                    );
                    const duration =
                      differenceInDays(visibleEnd, visibleStart) + 1;
                    const status = getBookingStatus(booking);

                    const statusClasses = {
                      [GUEST_STATUS.CHECKED_IN]:
                        "bg-blue-500 hover:bg-blue-600",
                      [GUEST_STATUS.CHECKED_OUT]: "bg-red-500 hover:bg-red-600",
                      [GUEST_STATUS.RESERVED]:
                        "bg-amber-400 hover:bg-amber-500",
                      [GUEST_STATUS.CANCEL]: "bg-gray-400 hover:bg-gray-500",
                    };

                    return (
                      <div
                        key={booking._id}
                        className={cn(
                          "absolute h-full p-2 rounded-md text-white text-xs font-semibold flex items-center justify-center cursor-pointer transition-all duration-200 ease-in-out transform hover:scale-105 z-10",
                          statusClasses[status] || "bg-gray-500"
                        )}
                        style={{
                          gridColumnStart: startDayIndex + 1,
                          gridColumnEnd: `span ${duration}`,
                        }}
                        title={`${booking.guest.name} (${format(
                          bookingStart,
                          "MMM d"
                        )} - ${format(bookingEnd, "MMM d")})`}
                      >
                        <div className="flex flex-col items-center justify-center h-full text-center">
                          <p className="truncate font-semibold">{booking.guest.name}</p>
                          <p className="text-xs opacity-80 truncate">
                            {format(bookingStart, "MMM d")} - {format(bookingEnd, "MMM d")}
                          </p>
                        </div>
                      </div>
                    );
                  })}

                {/* Render Reservations */}
                {allReservations
                  .filter((res) => res.room.roomNo === room.roomNo)
                  .map((reservation) => {
                    const resStart = new Date(reservation.room.arrival);
                    const resEnd = new Date(reservation.room.departure);

                    if (
                      !isWithinInterval(resStart, {
                        start: subDays(startDate, 31),
                        end: addDays(endDate, 31),
                      })
                    )
                      return null;

                    const visibleStart = max([resStart, startDate]);
                    const visibleEnd = min([resEnd, endDate]);

                    if (visibleStart > visibleEnd) return null;

                    const startDayIndex = differenceInDays(
                      visibleStart,
                      startDate
                    );
                    const duration =
                      differenceInDays(visibleEnd, visibleStart) + 1;

                    return (
                      <div
                        key={reservation._id}
                        className="absolute h-full p-2 rounded-md text-white text-xs font-semibold flex items-center justify-center cursor-pointer transition-all duration-200 ease-in-out transform hover:scale-105 z-10 bg-amber-400 hover:bg-amber-500 border-2 border-dashed border-white/50"
                        style={{
                          gridColumnStart: startDayIndex + 1,
                          gridColumnEnd: `span ${duration}`,
                        }}
                        title={`${reservation.guest.name} (${format(
                          resStart,
                          "MMM d"
                        )} - ${format(resEnd, "MMM d")})`}
                      >
                        <div className="flex flex-col items-center justify-center h-full text-center">
                          <p className="truncate font-semibold">{reservation.guest.name}</p>
                          <p className="text-xs opacity-80 truncate">
                            {format(resStart, "MMM d")} - {format(resEnd, "MMM d")}
                          </p>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}
