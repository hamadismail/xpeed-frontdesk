import React from "react";
import { Card } from "../../ui/card";
import { IRoom, RoomStatus } from "@/src/models/room.model";
import { getRoomIcon } from "@/src/utils/getRoomIcon";
import RoomBadge from "@/src/utils/RoomBadge";
import { Clock, Home, User2 } from "lucide-react";
import { Button } from "../../ui/button";
import BookRoomDialog from "./bookroomdialog";
import StayOver from "./stayover";
import CheckOut from "./CheckOut";

type RoomCardProps = {
  roomStatus: RoomStatus;
  room: IRoom;
  guestName: string;
  guestStatus: string;
};

export default function RoomCard({
  roomStatus,
  room,
  guestName,
  guestStatus,
}: RoomCardProps) {
  return (
    <Card
      className={`flex flex-col justify-between p-4 transition-all hover:shadow-lg ${
        roomStatus === RoomStatus.AVAILABLE
          ? "border-green-200 dark:border-green-900"
          : roomStatus === "RESERVED"
          ? "border-yellow-200 dark:border-yellow-900"
          : "border-red-200 dark:border-red-900"
      }`}
    >
      {/* Card Heading */}
      <div className="flex justify-between items-start">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          {getRoomIcon(room.roomType)}
          {room.roomNo}
        </h3>
        <RoomBadge roomStatus={roomStatus} />
      </div>

      {/* Card Body */}
      <div className="flex flex-col text-sm gap-2">
        <div>
          <div className="flex items-center gap-1 text-muted-foreground">
            <Home className="h-4 w-4" />
            <span>Floor {room.roomFloor}</span>
          </div>
          <div className="flex items-center gap-1 text-muted-foreground">
            <span>Type:</span>
            <span className="font-medium">{room.roomType}</span>
          </div>
        </div>

        {/* Guest Information */}
        {(guestName || guestStatus) && (
          <div className="p-2 bg-muted rounded-md text-xs">
            <div className="flex items-center gap-2 font-medium">
              <User2 className="h-4 w-4" />
              <span>{guestName}</span>
            </div>
            <div className="text-xs mt-1">Status: {guestStatus}</div>
          </div>
        )}
      </div>

      {/* Button Container */}
      <div className="flex justify-around gap-2">
        {roomStatus === RoomStatus.AVAILABLE ? (
          <>
            <Button size="sm" variant="secondary" className="h-8 px-3 gap-1 ">
              <Clock className="h-4 w-4" />
              <span>Info</span>
            </Button>
            <BookRoomDialog room={room} />
          </>
        ) : roomStatus === RoomStatus.RESERVED ? (
          <>
            <Button size="sm" variant="secondary" className="h-8 px-3 gap-1 ">
              <Clock className="h-4 w-4" />
              <span>Cancel</span>
            </Button>
            <BookRoomDialog room={room} />
          </>
        ) : (
          <>
            <StayOver room={room} />
            <CheckOut room={room} />
          </>
        )}
      </div>
    </Card>
  );
}
