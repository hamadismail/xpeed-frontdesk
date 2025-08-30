"use client";

import { useState } from "react";
import { Hotel } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { IRoom, RoomStatus, RoomType } from "@/src/models/room.model";
import { Button } from "@/src/components/ui/button";
import LoadingSpiner from "@/src/utils/LoadingSpiner";
import { GUEST_STATUS, IBook } from "@/src/models/book.model";
import { IReservation } from "@/src/types";
import RoomCard from "@/src/components/features/home/RoomCard";
import RoomFilter from "@/src/components/features/home/RoomFilter";
import RoomStats from "@/src/components/features/home/RoomStats";

export default function AllRooms() {
  const [floorFilter, setFloorFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState<RoomType | "all">("all");
  const [statusFilter, setStatusFilter] = useState<RoomStatus | "all">("all");
  const [dateFilter, setDateFilter] = useState<string>(
    new Date().toISOString().split("T")[0]
  );

  const { data: allRooms = [], isLoading } = useQuery<IRoom[]>({
    queryKey: ["rooms"],
    queryFn: () => axios.get("/api/rooms").then((res) => res.data),
  });

  const { data: allBookings = [], isLoading: bookLoading } = useQuery<IBook[]>({
    queryKey: ["book"],
    queryFn: () => axios.get("/api/book").then((res) => res.data),
  });

  const { data: allReservations = [], isLoading: reserveLoading } = useQuery<
    IReservation[]
  >({
    queryKey: ["reserve"],
    queryFn: () => axios.get("/api/reserve").then((res) => res.data),
  });

  // Filter rooms based on selected date
  const filteredRooms = allRooms.filter((room) => {
    const selected = new Date(dateFilter).setHours(0, 0, 0, 0);

    // Check if room is booked on selected date
    const isBooked = allBookings.some((booking) => {
      const arrival = new Date(booking.stay.arrival).setHours(0, 0, 0, 0);
      const departure = new Date(booking.stay.departure).setHours(0, 0, 0, 0);
      return (
        booking.roomId === room._id?.toString() &&
        arrival <= selected &&
        departure > selected
      );
    });

    // Check if room is reserved on selected date
    const isReserved = allReservations.some((reservation) => {
      const arrival = new Date(reservation.room.arrival).setHours(0, 0, 0, 0);
      const departure = new Date(reservation.room.departure).setHours(0, 0, 0, 0);
      return (
        reservation.room.roomNo === room.roomNo &&
        arrival <= selected &&
        departure > selected
      );
    });

    // Apply additional filters
    return (
      (floorFilter === "all" || room.roomFloor.toString() === floorFilter) &&
      (typeFilter === "all" || room.roomType === typeFilter) &&
      (statusFilter === "all" ||
        (statusFilter === RoomStatus.AVAILABLE &&
          room.roomStatus !== RoomStatus.DUE_OUT &&
          !isReserved &&
          !isBooked) ||
        (statusFilter === RoomStatus.OCCUPIED && isBooked) ||
        (statusFilter === RoomStatus.RESERVED && isReserved) ||
        (statusFilter === RoomStatus.DUE_OUT &&
          room.roomStatus === RoomStatus.DUE_OUT) ||
        (statusFilter === RoomStatus.DIRTY &&
          room.roomStatus === RoomStatus.DIRTY))
    );
  });

  // Room Info
  const roomInfo = (room: IRoom) => {
    const selected = new Date(dateFilter).setHours(0, 0, 0, 0);

    // Find booking for this room on selected date
    const booking = allBookings.find((b) => {
      const arrival = new Date(b.stay.arrival).setHours(0, 0, 0, 0);
      const departure = new Date(b.stay.departure).setHours(0, 0, 0, 0);
      return (
        b.roomId === room._id?.toString() &&
        arrival <= selected &&
        departure > selected
      );
    });

    // Find reservation for this room on selected date
    const reservation = allReservations.find((r) => {
      const arrival = new Date(r.room.arrival).setHours(0, 0, 0, 0);
      const departure = new Date(r.room.departure).setHours(0, 0, 0, 0);
      return (
        r.room.roomNo === room.roomNo &&
        arrival <= selected &&
        departure > selected
      );
    });

    // Determine room status for selected date
    let roomStatus = room.roomStatus;
    let guestName = "";
    let guestStatus = "";
    let arrival = new Date();
    let departure = new Date();

    if (room.roomStatus === RoomStatus.DIRTY) {
      roomStatus = RoomStatus.DIRTY;
    } else if (room.roomStatus === RoomStatus.DUE_OUT) {
      roomStatus = RoomStatus.DUE_OUT;
      const dueOutBooking = allBookings.find(
        (b) => b.roomId === room._id?.toString()
      );
      if (dueOutBooking) {
        guestName = dueOutBooking.guest.name;
        guestStatus = "Due Out";
        arrival = dueOutBooking.stay.arrival;
        departure = dueOutBooking.stay.departure;
      }
    } else if (booking) {
      roomStatus = RoomStatus.OCCUPIED;
      guestName = booking.guest.name;
      guestStatus = GUEST_STATUS.CHECKED_IN;
      arrival = booking.stay.arrival;
      departure = booking.stay.departure;
    } else if (reservation) {
      roomStatus = RoomStatus.RESERVED;
      guestName = reservation.guest.name;
      guestStatus = GUEST_STATUS.RESERVED;
      arrival = reservation.room.arrival;
      departure = reservation.room.departure;
    }

    return { roomStatus, guestName, guestStatus, arrival, departure };
  };

  // Count rooms by status for the selected date
  const selected = new Date(dateFilter).setHours(0, 0, 0, 0);

  const occupiedCount = allBookings.filter((book) => {
    const arrival = new Date(book.stay.arrival).setHours(0, 0, 0, 0);
    const departure = new Date(book.stay.departure).setHours(0, 0, 0, 0);
    return arrival <= selected && departure > selected;
  }).length;

  const reservedCount = allReservations.filter((reservation) => {
    const arrival = new Date(reservation.room.arrival).setHours(0, 0, 0, 0);
    const departure = new Date(reservation.room.departure).setHours(0, 0, 0, 0);
    return arrival <= selected && departure > selected;
  }).length;

  const dueOutCount = allRooms.filter(
    (room) => room.roomStatus === RoomStatus.DUE_OUT
  ).length;

  const dirtyCount = allRooms.filter(
    (room) => room.roomStatus === RoomStatus.DIRTY
  ).length;

  const availableCount =
    allRooms.length - occupiedCount - reservedCount - dueOutCount - dirtyCount;

  if (isLoading || reserveLoading || bookLoading) {
    return <LoadingSpiner />;
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header with title and stats */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Hotel className="h-8 w-8 text-primary" />
          <h2 className="text-2xl font-bold">Room Management</h2>
        </div>

        {/* Stats */}
        <RoomStats
          availableCount={availableCount}
          reservedCount={reservedCount}
          occupiedCount={occupiedCount}
          dueOutCount={dueOutCount}
        />
      </div>

      {/* Filters */}
      <RoomFilter
        dateFilter={dateFilter}
        setDateFilter={setDateFilter}
        setFloorFilter={setFloorFilter}
        setTypeFilter={setTypeFilter}
        setStatusFilter={setStatusFilter}
      />

      {/* Rooms Grid */}
      {filteredRooms.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 gap-4 text-muted-foreground">
          <Hotel className="h-12 w-12" />
          <p className="text-lg">No rooms found with selected filters</p>
          <Button
            variant="outline"
            onClick={() => {
              setFloorFilter("all");
              setTypeFilter("all");
              setStatusFilter("all");
              setDateFilter(new Date().toISOString().split("T")[0]);
            }}
          >
            Clear Filters
          </Button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredRooms.map((room) => {
            const { roomStatus, guestName, guestStatus, arrival, departure } =
              roomInfo(room);
            return (
              <RoomCard
                key={room._id?.toString()}
                roomStatus={roomStatus}
                room={room}
                guestName={guestName}
                guestStatus={guestStatus}
                arrival={arrival}
                departure={departure}
                allReservations={allReservations}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
