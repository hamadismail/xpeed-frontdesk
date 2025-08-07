"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BedSingle,
  BedDouble,
  Hotel,
  Crown,
  Home,
  Layers,
  Circle,
  CheckCircle,
  XCircle,
  Clock,
  User2,
  ListChecks,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import AddRoomDialog from "./components/AddRoomDialog";
import BookRoomDialog from "./components/BookRoomDialog";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { IRoom, RoomStatus, RoomType } from "@/models/room.model";
import ReservedCheckIn from "./home/ReservedCheckIn";
import ReserveRoom from "./home/ReserveRoom";
import StayOver from "./home/StayOver";
import CheckOut from "./home/CheckOut";
import Release from "./home/Release";

const getRoomIcon = (type: RoomType) => {
  switch (type) {
    case "Single":
      return <BedSingle className="h-5 w-5" />;
    case "Twin":
      return <BedDouble className="h-5 w-5" />;
    case "Queen":
      return <Crown className="h-5 w-5" />;
    case "Suite":
      return <Hotel className="h-5 w-5" />;
    default:
      return <BedSingle className="h-5 w-5" />;
  }
};

export default function AllRooms() {
  const [floorFilter, setFloorFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState<RoomType | "all">("all");
  const [statusFilter, setStatusFilter] = useState<RoomStatus | "all">("all");

  const { data: allRooms = [], isLoading } = useQuery<IRoom[]>({
    queryKey: ["rooms"],
    queryFn: () => axios.get("/api/rooms").then((res) => res.data),
  });

  const filteredRooms = allRooms.filter((room) => {
    return (
      (floorFilter === "all" || room.roomFloor.toString() === floorFilter) &&
      (typeFilter === "all" || room.roomType === typeFilter) &&
      (statusFilter === "all" || room.roomStatus === statusFilter)
    );
  });

  const occupiedCount = allRooms.filter(
    (room) => room.roomStatus === RoomStatus.OCCUPIED
  ).length;

  const reservedCount = allRooms.filter(
    (room) => room.roomStatus === RoomStatus.RESERVED
  ).length;

  const availableCount = allRooms.length - (occupiedCount + reservedCount);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="relative">
          {/* Animated spinner */}
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>

          {/* Hotel icon that rotates opposite direction */}
          <Hotel className="absolute inset-0 m-auto h-8 w-8 text-primary animate-spin-reverse" />
        </div>

        <p className="text-lg font-medium text-muted-foreground">
          Loading rooms...
        </p>

        {/* Optional progress dots */}
        <div className="flex gap-1 mt-2">
          <div
            className="w-2 h-2 rounded-full bg-primary animate-bounce"
            style={{ animationDelay: "0ms" }}
          />
          <div
            className="w-2 h-2 rounded-full bg-primary animate-bounce"
            style={{ animationDelay: "150ms" }}
          />
          <div
            className="w-2 h-2 rounded-full bg-primary animate-bounce"
            style={{ animationDelay: "300ms" }}
          />
        </div>
      </div>
    );
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
        <div className="flex gap-6">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-red-500">
              <XCircle className="h-4 w-4" />
              <span className="font-medium">Occupied:</span>
            </div>
            <Badge variant="destructive" className="px-3 py-1">
              {occupiedCount}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-yellow-600">
              <Clock className="h-4 w-4" />
              <span className="font-medium">Reserved:</span>
            </div>
            <Badge className="px-3 py-1 bg-yellow-600 hover:bg-yellow-700">
              {reservedCount}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-green-500">
              <CheckCircle className="h-4 w-4" />
              <span className="font-medium">Available:</span>
            </div>
            <Badge className="px-3 py-1 bg-green-600 hover:bg-green-700">
              {availableCount}
            </Badge>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 p-4 bg-muted/50 rounded-lg">
        <div className="flex-1">
          <Label className="flex items-center gap-2 mb-2">
            <Layers className="h-4 w-4" />
            Floor
          </Label>
          <Select
            onValueChange={(value) => setFloorFilter(value)}
            defaultValue="all"
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="All Floors" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Floors</SelectItem>
              <SelectItem value="1">1st Floor</SelectItem>
              <SelectItem value="2">2nd Floor</SelectItem>
              <SelectItem value="3">3rd Floor</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1">
          <Label className="flex items-center gap-2 mb-2">
            <BedSingle className="h-4 w-4" />
            Room Type
          </Label>
          <Select
            onValueChange={(value: RoomType | "all") => setTypeFilter(value)}
            defaultValue="all"
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="Single" className="flex items-center gap-2">
                <BedSingle className="h-4 w-4" /> Single
              </SelectItem>
              <SelectItem value="Twin" className="flex items-center gap-2">
                <BedDouble className="h-4 w-4" /> Twin
              </SelectItem>
              <SelectItem value="Queen" className="flex items-center gap-2">
                <Crown className="h-4 w-4" /> Queen
              </SelectItem>
              <SelectItem value="Suite" className="flex items-center gap-2">
                <Hotel className="h-4 w-4" /> Suite
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1">
          <Label className="flex items-center gap-2 mb-2">
            <ListChecks className="h-4 w-4" />
            Room Status
          </Label>
          <Select
            onValueChange={(value: RoomStatus | "all") =>
              setStatusFilter(value)
            }
            defaultValue="all"
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem
                value={RoomStatus.AVAILABLE}
                className="flex items-center gap-2"
              >
                <CheckCircle className="h-4 w-4" /> Available
              </SelectItem>
              <SelectItem
                value={RoomStatus.RESERVED}
                className="flex items-center gap-2"
              >
                <Clock className="h-4 w-4" /> Reserved
              </SelectItem>
              <SelectItem
                value={RoomStatus.OCCUPIED}
                className="flex items-center gap-2"
              >
                <User2 className="h-4 w-4" /> Occupied
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-end">
          <AddRoomDialog />
        </div>
      </div>

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
            }}
          >
            Clear Filters
          </Button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredRooms.map((room) => (
            <Card
              key={room._id?.toString()}
              className={`p-4 transition-all hover:shadow-lg ${
                room.roomStatus === RoomStatus.AVAILABLE
                  ? "border-green-200 dark:border-green-900"
                  : room.roomStatus === RoomStatus.RESERVED
                  ? "border-yellow-200 dark:border-yellow-800"
                  : "border-red-200 dark:border-red-900"
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  {getRoomIcon(room.roomType)}
                  {room.roomNo}
                </h3>
                <Badge
                  variant={
                    room.roomStatus === RoomStatus.AVAILABLE
                      ? "default"
                      : room.roomStatus === RoomStatus.RESERVED
                      ? "outline"
                      : "destructive"
                  }
                  className={`flex items-center gap-1 ${
                    room.roomStatus === RoomStatus.RESERVED
                      ? "bg-yellow-100 text-yellow-800 border-yellow-300"
                      : room.roomStatus === RoomStatus.AVAILABLE
                      ? "bg-green-100 text-green-800 border-green-300"
                      : ""
                  }`}
                >
                  <Circle className="h-2 w-2 fill-current" />
                  {room.roomStatus.charAt(0).toUpperCase() +
                    room.roomStatus.slice(1)}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-2 mb-4 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Home className="h-4 w-4" />
                  <span>Floor {room.roomFloor}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <span>Type:</span>
                  <span className="font-medium">{room.roomType}</span>
                </div>
              </div>

              {/* Button Container */}
              <div className="flex justify-around gap-2">
                {room.roomStatus === RoomStatus.AVAILABLE ? (
                  <>
                    <ReserveRoom room={room} />
                    <BookRoomDialog room={room} />
                  </>
                ) : room.roomStatus === RoomStatus.RESERVED ? (
                  <>
                    <Release room={room} />
                    <ReservedCheckIn room={room} />
                  </>
                ) : (
                  <>
                    <StayOver room={room} />
                    <CheckOut room={room} />
                  </>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
