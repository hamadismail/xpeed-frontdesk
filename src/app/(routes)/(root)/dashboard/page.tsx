"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import {
  Hotel,
  Calendar,
  Users,
  CreditCard,
  CheckCircle,
  Clock,
  TrendingUp,
  DollarSign,
} from "lucide-react";
import { IRoom, RoomStatus } from "@/src/models/room.model";
import { IBook } from "@/src/models/book.model";
import { IReservation } from "@/src/types";

export default function Dashboard() {
  const [dateFilter, setDateFilter] = useState<string>(
    new Date().toISOString().split("T")[0]
  );

  const { data: allRooms = [] } = useQuery<IRoom[]>({
    queryKey: ["rooms"],
    queryFn: () => axios.get("/api/rooms").then((res) => res.data),
  });

  const { data: allBookings = [] } = useQuery<IBook[]>({
    queryKey: ["book"],
    queryFn: () => axios.get("/api/book").then((res) => res.data),
  });

  const { data: allReservations = [] } = useQuery<IReservation[]>({
    queryKey: ["reserve"],
    queryFn: () => axios.get("/api/reserve").then((res) => res.data),
  });

  // Calculate statistics
  const occupiedCount = allRooms.filter(
    (room) => room.roomStatus === RoomStatus.OCCUPIED
  ).length;

  const reservedCount = allRooms.filter(
    (room) => room.roomStatus === RoomStatus.RESERVED
  ).length;

  const dueOutCount = allRooms.filter(
    (room) => room.roomStatus === RoomStatus.DUE_OUT
  ).length;

  const availableCount = allRooms.filter(
    (room) => room.roomStatus === RoomStatus.AVAILABLE
  ).length;

  const totalRevenue = allBookings.reduce(
    (sum, booking) => sum + (booking.payment.paidAmount || 0),
    0
  );

  const pendingCheckouts = allBookings.filter(
    (booking) =>
      booking.guest.status === "CheckedIn" &&
      new Date(booking.stay.departure) <= new Date()
  ).length;

  // Get upcoming arrivals
  const upcomingArrivals = allReservations
    .filter(
      (reservation) =>
        new Date(reservation.room.arrival) >= new Date() &&
        new Date(reservation.room.arrival) <=
          new Date(new Date().setDate(new Date().getDate() + 7))
    )
    .sort(
      (a, b) =>
        new Date(a.room.arrival).getTime() - new Date(b.room.arrival).getTime()
    )
    .slice(0, 5);

  // Get recent checkouts
  const recentCheckouts = allBookings
    .filter((booking) => booking.guest.status === "CheckedOut")
    .sort(
      (a, b) =>
        new Date().getTime() - new Date().getTime()
    )
    .slice(0, 5);

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome to Eco Hotel Management System
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Today:</span>
          <span className="font-medium">
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Occupied Rooms</CardTitle>
            <Hotel className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{occupiedCount}</div>
            <p className="text-xs text-muted-foreground">
              {((occupiedCount / allRooms.length) * 100).toFixed(1)}% occupancy
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reserved Rooms</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reservedCount}</div>
            <p className="text-xs text-muted-foreground">
              {reservedCount} upcoming reservations
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Due Out Today</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dueOutCount}</div>
            <p className="text-xs text-muted-foreground">
              {dueOutCount} guests to check out
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              RM {totalRevenue.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              +12.5% from last month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Arrivals */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Upcoming Arrivals (Next 7 Days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingArrivals.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                No upcoming arrivals
              </p>
            ) : (
              <div className="space-y-4">
                {upcomingArrivals.map((reservation) => (
                  <div
                    key={reservation._id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent"
                  >
                    <div>
                      <p className="font-medium">{reservation.guest.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Room {reservation.room.roomNo} •{" "}
                        {new Date(reservation.room.arrival).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge variant="secondary">
                      {Math.ceil(
                        (new Date(reservation.room.departure).getTime() -
                          new Date(reservation.room.arrival).getTime()) /
                          (1000 * 60 * 60 * 24)
                      )}{" "}
                      nights
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Checkouts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Recent Checkouts
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentCheckouts.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                No recent checkouts
              </p>
            ) : (
              <div className="space-y-4">
                {recentCheckouts.map((booking) => (
                  <div
                    key={booking._id || Math.random()}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent"
                  >
                    <div>
                      <p className="font-medium">{booking.guest.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Room {(booking.roomId as unknown as string) || "Unknown"} • Checked out{" "}
                        {new Date().toLocaleDateString()}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-green-600">
                      Paid
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button variant="outline" className="h-20 flex flex-col gap-2">
              <Hotel className="h-6 w-6" />
              <span>New Booking</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col gap-2">
              <Calendar className="h-6 w-6" />
              <span>New Reservation</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col gap-2">
              <CreditCard className="h-6 w-6" />
              <span>Process Payment</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col gap-2">
              <Users className="h-6 w-6" />
              <span>Guest List</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
