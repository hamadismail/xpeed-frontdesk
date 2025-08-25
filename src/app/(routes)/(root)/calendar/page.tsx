"use client";

import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios, { AxiosError } from "axios";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isToday,
  isSameMonth,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
  // isSameDay,
  // parseISO,
} from "date-fns";
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  // Plus,
  Hotel,
  Clock,
  User,
  CheckCircle,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { Badge } from "@/src/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  // DialogTrigger,
} from "@/src/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Textarea } from "@/src/components/ui/textarea";
import { toast } from "sonner";
import { IRoom, RoomStatus } from "@/src/models/room.model";
import { IQuickBooking, IReservation } from "@/src/types";
import { OTAS, GUEST_STATUS } from "@/src/models/book.model";

interface CalendarBooking {
  _id: string;
  guest: {
    name: string;
    phone: string;
    status?: GUEST_STATUS | "Due Out";
  };
  stay?: {
    arrival: Date;
    departure: Date;
  };
  room?: {
    arrival: Date;
    departure: Date;
    roomNo?: string;
  };
  roomId?: string;
  roomNo?: string;
}

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isBookingDialogOpen, setIsBookingDialogOpen] = useState(false);
  const [bookingType, setBookingType] = useState<"reservation" | "booking">(
    "reservation"
  );

  const queryClient = useQueryClient();

  // Fetch all rooms
  const { data: rooms = [] } = useQuery<IRoom[]>({
    queryKey: ["rooms"],
    queryFn: () => axios.get("/api/rooms").then((res) => res.data),
  });

  // Fetch all reservations
  const { data: reservations = [] } = useQuery<IReservation[]>({
    queryKey: ["reservations"],
    queryFn: () => axios.get("/api/reserve").then((res) => res.data),
  });

  // Fetch all bookings
  const { data: bookings = [] } = useQuery<CalendarBooking[]>({
    queryKey: ["bookings"],
    queryFn: () => axios.get("/api/book").then((res) => res.data),
  });

  // Calendar logic
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  const calendarDays = eachDayOfInterval({
    start: calendarStart,
    end: calendarEnd,
  });

  // Process bookings for calendar display
  const processedBookings = useMemo(() => {
    const bookingMap: { [key: string]: CalendarBooking[] } = {};

    // Process reservations
    reservations.forEach((reservation) => {
      if (reservation.room?.arrival && reservation.room?.departure) {
        const arrival = new Date(reservation.room.arrival);
        const departure = new Date(reservation.room.departure);

        const currentDay = new Date(arrival);
        while (currentDay <= departure) {
          const dayKey = format(currentDay, "yyyy-MM-dd");
          if (!bookingMap[dayKey]) bookingMap[dayKey] = [];

          bookingMap[dayKey].push({
            _id: reservation._id || `res-${Math.random()}`,
            guest: {
              name: reservation.guest.name,
              phone: reservation.guest.phone,
              status: GUEST_STATUS.RESERVED,
            },
            room: {
              arrival,
              departure,
              roomNo: reservation.room.roomNo,
            },
            roomNo: reservation.room.roomNo,
          });

          currentDay.setDate(currentDay.getDate() + 1);
        }
      }
    });

    // Process bookings
    bookings.forEach((booking) => {
      if (booking.stay?.arrival && booking.stay?.departure) {
        const arrival = new Date(booking.stay.arrival);
        const departure = new Date(booking.stay.departure);

        const currentDay = new Date(arrival);
        while (currentDay <= departure) {
          const dayKey = format(currentDay, "yyyy-MM-dd");
          if (!bookingMap[dayKey]) bookingMap[dayKey] = [];

          // Find room number from rooms array
          const room = rooms.find((r) => r._id?.toString() === booking.roomId);

          // Check if this is a due out booking (departure date)
          const isDueOut =
            currentDay.toDateString() === departure.toDateString();
          const guestStatus = isDueOut ? "Due Out" : booking.guest.status;

          bookingMap[dayKey].push({
            _id: booking._id,
            guest: {
              name: booking.guest.name,
              phone: booking.guest.phone,
              status: guestStatus,
            },
            stay: {
              arrival,
              departure,
            },
            roomId: booking.roomId,
            roomNo: room?.roomNo || "Unknown",
          });

          currentDay.setDate(currentDay.getDate() + 1);
        }
      }
    });

    return bookingMap;
  }, [reservations, bookings, rooms]);

  // Quick booking form state
  const [quickBookingForm, setQuickBookingForm] = useState({
    guestName: "",
    guestPhone: "",
    roomId: "",
    arrival: "",
    departure: "",
    adults: 1,
    ota: OTAS.WALKING_GUEST,
    notes: "",
  });

  // Quick booking mutation
  const quickBookingMutation = useMutation({
    mutationFn: async (bookingData: IQuickBooking) => {
      if (bookingType === "reservation") {
        const payload = {
          guest: {
            name: bookingData.guestName,
            phone: bookingData.guestPhone,
            ota: bookingData.ota,
            status: GUEST_STATUS.RESERVED,
          },
          room: {
            roomNo: rooms.find((r) => r._id?.toString() === bookingData.roomId)
              ?.roomNo,
            arrival: new Date(bookingData.arrival),
            departure: new Date(bookingData.departure),
            roomDetails: bookingData.notes,
          },
          payment: {
            bookingFee: 0,
            sst: 0,
            tourismTax: 0,
            fnfDiscount: 0,
          },
          reservationDate: new Date().toISOString(),
        };
        return axios.post("/api/reserve", { payload });
      } else {
        const bookingInfo = {
          guest: {
            name: bookingData.guestName,
            phone: bookingData.guestPhone,
            refId: `WG-${Date.now()}`,
            otas: bookingData.ota,
            status: GUEST_STATUS.CHECKED_IN,
          },
          stay: {
            arrival: new Date(bookingData.arrival),
            departure: new Date(bookingData.departure),
            adults: bookingData.adults,
            children: 0,
          },
          payment: {
            roomPrice: 100,
            subtotal: 100,
            paidAmount: 0,
            dueAmount: 100,
            paymentMethod: "Cash",
            remarks: bookingData.notes || "Quick booking from calendar",
          },
          roomId: bookingData.roomId,
        };
        return axios.post("/api/book", { bookingInfo });
      }
    },
    onSuccess: () => {
      toast.success(
        `${
          bookingType === "reservation" ? "Reservation" : "Booking"
        } created successfully!`
      );
      queryClient.invalidateQueries({ queryKey: ["reservations"] });
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
      setIsBookingDialogOpen(false);
      setQuickBookingForm({
        guestName: "",
        guestPhone: "",
        roomId: "",
        arrival: "",
        departure: "",
        adults: 1,
        ota: OTAS.WALKING_GUEST,
        notes: "",
      });
    },
    onError: (error: AxiosError<{ message: string }>) => {
      toast.error("Failed to create booking", {
        description: error.response?.data?.message || "Something went wrong",
      });
    },
  });

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    setQuickBookingForm((prev) => ({
      ...prev,
      arrival: format(date, "yyyy-MM-dd"),
      departure: format(
        new Date(date.getTime() + 24 * 60 * 60 * 1000),
        "yyyy-MM-dd"
      ),
    }));
    setIsBookingDialogOpen(true);
  };

  const availableRooms = rooms.filter(
    (room) =>
      room.roomStatus !== RoomStatus.OCCUPIED &&
      room.roomStatus !== RoomStatus.DUE_OUT
  );

  const occupaidRooms = rooms.filter(
    (room) =>
      room.roomStatus === RoomStatus.OCCUPIED ||
      room.roomStatus === RoomStatus.DUE_OUT
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Calendar className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Reservation Calendar</h1>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentDate(subMonths(currentDate, 1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <div className="px-4 py-2 text-lg font-semibold min-w-[200px] text-center">
            {format(currentDate, "MMMM yyyy")}
          </div>

          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentDate(addMonths(currentDate, 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>

          <Button onClick={() => setCurrentDate(new Date())} variant="outline">
            Today
          </Button>
        </div>
      </div>

      {/* Calendar Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Hotel className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Total Rooms</p>
                <p className="text-2xl font-bold">{rooms.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Available</p>
                <p className="text-2xl font-bold">{availableRooms.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange-500" />
              <div>
                <p className="text-sm text-muted-foreground">Reservations</p>
                <p className="text-2xl font-bold">{reservations.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-red-500" />
              <div>
                <p className="text-sm text-muted-foreground">Occupied</p>
                <p className="text-2xl font-bold">{occupaidRooms.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Calendar Grid */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly View</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Days of week header */}
          <div className="grid grid-cols-7 gap-1 mb-4">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div
                key={day}
                className="p-2 text-center font-semibold text-muted-foreground"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar days */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day) => {
              const dayKey = format(day, "yyyy-MM-dd");
              const dayBookings = processedBookings[dayKey] || [];
              const isCurrentMonth = isSameMonth(day, currentDate);
              const isTodayDate = isToday(day);

              return (
                <div
                  key={dayKey}
                  className={`
                    min-h-[120px] p-2 border border-border rounded-lg cursor-pointer hover:bg-accent/50 transition-colors
                    ${!isCurrentMonth ? "opacity-50" : ""}
                    ${isTodayDate ? "bg-primary/10 border-primary" : ""}
                  `}
                  onClick={() => handleDateClick(day)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span
                      className={`text-sm font-medium ${
                        isTodayDate ? "text-primary" : ""
                      }`}
                    >
                      {format(day, "d")}
                    </span>
                    {dayBookings.length > 0 && (
                      <Badge variant="secondary" className="text-xs px-1 py-0">
                        {dayBookings.length}
                      </Badge>
                    )}
                  </div>

                  <div className="space-y-1">
                    {dayBookings.slice(0, 3).map((booking, index) => (
                      <div
                        key={`${booking._id}-${index}`}
                        className={`text-xs p-1 rounded truncate ${
                          booking.guest.status === GUEST_STATUS.RESERVED
                            ? "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400"
                            : booking.guest.status === GUEST_STATUS.CHECKED_IN
                            ? "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
                            : "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400"
                        }`}
                        title={`${booking.guest.name} - Room ${booking.roomNo}`}
                      >
                        {booking.roomNo}: {booking.guest.name}
                      </div>
                    ))}
                    {dayBookings.length > 3 && (
                      <div className="text-xs text-muted-foreground">
                        +{dayBookings.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Quick Booking Dialog */}
      <Dialog open={isBookingDialogOpen} onOpenChange={setIsBookingDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              Quick {bookingType === "reservation" ? "Reservation" : "Booking"}
              {selectedDate && ` - ${format(selectedDate, "MMM dd, yyyy")}`}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex gap-2">
              <Button
                variant={bookingType === "reservation" ? "default" : "outline"}
                size="sm"
                onClick={() => setBookingType("reservation")}
                className="flex-1"
              >
                Reservation
              </Button>
              <Button
                variant={bookingType === "booking" ? "default" : "outline"}
                size="sm"
                onClick={() => setBookingType("booking")}
                className="flex-1"
              >
                Booking
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="guestName">Guest Name *</Label>
                <Input
                  id="guestName"
                  value={quickBookingForm.guestName}
                  onChange={(e) =>
                    setQuickBookingForm((prev) => ({
                      ...prev,
                      guestName: e.target.value,
                    }))
                  }
                  placeholder="Enter guest name"
                />
              </div>

              <div>
                <Label htmlFor="guestPhone">Phone *</Label>
                <Input
                  id="guestPhone"
                  value={quickBookingForm.guestPhone}
                  onChange={(e) =>
                    setQuickBookingForm((prev) => ({
                      ...prev,
                      guestPhone: e.target.value,
                    }))
                  }
                  placeholder="Enter phone number"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="room">Room *</Label>
              <Select
                value={quickBookingForm.roomId}
                onValueChange={(value) =>
                  setQuickBookingForm((prev) => ({ ...prev, roomId: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a room" />
                </SelectTrigger>
                <SelectContent>
                  {availableRooms.map((room) => (
                    <SelectItem
                      key={room._id?.toString()}
                      value={room._id?.toString() || ""}
                    >
                      {room.roomNo} - {room.roomType}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="arrival">Arrival Date *</Label>
                <Input
                  id="arrival"
                  type="date"
                  value={quickBookingForm.arrival}
                  onChange={(e) =>
                    setQuickBookingForm((prev) => ({
                      ...prev,
                      arrival: e.target.value,
                    }))
                  }
                />
              </div>

              <div>
                <Label htmlFor="departure">Departure Date *</Label>
                <Input
                  id="departure"
                  type="date"
                  value={quickBookingForm.departure}
                  onChange={(e) =>
                    setQuickBookingForm((prev) => ({
                      ...prev,
                      departure: e.target.value,
                    }))
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="adults">Adults</Label>
                <Input
                  id="adults"
                  type="number"
                  min="1"
                  value={quickBookingForm.adults}
                  onChange={(e) =>
                    setQuickBookingForm((prev) => ({
                      ...prev,
                      adults: parseInt(e.target.value) || 1,
                    }))
                  }
                />
              </div>

              <div>
                <Label htmlFor="ota">Source</Label>
                <Select
                  value={quickBookingForm.ota}
                  onValueChange={(value: OTAS) =>
                    setQuickBookingForm((prev) => ({ ...prev, ota: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(OTAS).map((ota) => (
                      <SelectItem key={ota} value={ota}>
                        {ota}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={quickBookingForm.notes}
                onChange={(e) =>
                  setQuickBookingForm((prev) => ({
                    ...prev,
                    notes: e.target.value,
                  }))
                }
                placeholder="Additional notes..."
                rows={3}
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setIsBookingDialogOpen(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={() => quickBookingMutation.mutate(quickBookingForm)}
                disabled={
                  !quickBookingForm.guestName ||
                  !quickBookingForm.guestPhone ||
                  !quickBookingForm.roomId ||
                  quickBookingMutation.isPending
                }
                className="flex-1"
              >
                {quickBookingMutation.isPending
                  ? "Creating..."
                  : `Create ${
                      bookingType === "reservation" ? "Reservation" : "Booking"
                    }`}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
