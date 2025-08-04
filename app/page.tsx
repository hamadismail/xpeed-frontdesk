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
  Info,
  CalendarCheck,
  RotateCcw,
  Home,
  Layers,
  Circle,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type RoomType = "Single" | "Twin" | "Queen" | "Suite";

type Room = {
  id: number;
  name: string;
  floor: number;
  type: RoomType;
  status: "available" | "occupied";
};

const allRooms: Room[] = [
  { id: 1, name: "Room 101", floor: 1, type: "Single", status: "available" },
  { id: 2, name: "Room 102", floor: 1, type: "Queen", status: "occupied" },
  { id: 3, name: "Room 201", floor: 2, type: "Twin", status: "available" },
  { id: 4, name: "Room 202", floor: 2, type: "Single", status: "occupied" },
  { id: 5, name: "Room 301", floor: 3, type: "Suite", status: "available" },
  { id: 6, name: "Room 302", floor: 3, type: "Queen", status: "occupied" },
];

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

  const filteredRooms = allRooms.filter((room) => {
    return (
      (floorFilter === "all" || room.floor.toString() === floorFilter) &&
      (typeFilter === "all" || room.type === typeFilter)
    );
  });

  const occupiedCount = allRooms.filter(
    (room) => room.status === "occupied"
  ).length;
  const availableCount = allRooms.length - occupiedCount;

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
            }}
          >
            Clear Filters
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredRooms.map((room) => (
            <Card
              key={room.id}
              className={`p-4 transition-all hover:shadow-lg ${
                room.status === "available"
                  ? "border-green-200 dark:border-green-900"
                  : "border-red-200 dark:border-red-900"
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  {getRoomIcon(room.type)}
                  {room.name}
                </h3>
                <Badge
                  variant={
                    room.status === "available" ? "default" : "destructive"
                  }
                  className="flex items-center gap-1"
                >
                  <Circle className="h-2 w-2 fill-current" />
                  {room.status.charAt(0).toUpperCase() + room.status.slice(1)}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-2 mb-4 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Home className="h-4 w-4" />
                  <span>Floor {room.floor}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <span>Type:</span>
                  <span className="font-medium">{room.type}</span>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" className="h-8 px-3">
                  <Info className="h-4 w-4 mr-1" />
                  Info
                </Button>
                {room.status === "available" ? (
                  <Button size="sm" className="h-8 px-3">
                    <CalendarCheck className="h-4 w-4 mr-1" />
                    Book
                  </Button>
                ) : (
                  <Button variant="secondary" size="sm" className="h-8 px-3">
                    <RotateCcw className="h-4 w-4 mr-1" />
                    Release
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
