import { Circle } from "lucide-react";
import React from "react";
import { RoomStatus } from "../models/room.model";
import { Badge } from "../components/ui/badge";

type RoomBadgeProps = {
  roomStatus: RoomStatus;
};

export default function RoomBadge({ roomStatus }: RoomBadgeProps) {
  return (
    <Badge
      variant={
        roomStatus === RoomStatus.AVAILABLE
          ? "default"
          : roomStatus === RoomStatus.RESERVED
          ? "secondary"
          : "destructive"
      }
      className={`flex items-center gap-1 ${
        roomStatus === RoomStatus.AVAILABLE
          ? "bg-green-100 text-green-800 border-green-300"
          : roomStatus === RoomStatus.RESERVED
          ? "bg-yellow-100 text-yellow-800 border-yellow-300"
          : ""
      }`}
    >
      <Circle className="h-2 w-2 fill-current" />
      {roomStatus === RoomStatus.OCCUPIED
        ? "OCCUPIED"
        : roomStatus === RoomStatus.RESERVED
        ? "RESERVED"
        : "AVAILABLE"}
    </Badge>
  );
}
