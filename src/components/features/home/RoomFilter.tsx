import React from "react";
import { Label } from "../../ui/label";
import { Input } from "../../ui/input";
import {
  BedDouble,
  BedSingle,
  Calendar,
  CheckCircle,
  Clock,
  Crown,
  Hotel,
  Layers,
  ListChecks,
  User2,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../ui/select";
import { RoomStatus, RoomType } from "@/src/models/room.model";
import AddRoomDialog from "./addroomdialog";

type RoomFilterProps = {
  dateFilter: string;
  setDateFilter: React.Dispatch<React.SetStateAction<string>>;
  setFloorFilter: React.Dispatch<React.SetStateAction<string>>;
  setStatusFilter: React.Dispatch<React.SetStateAction<"all" | RoomStatus>>;
  setTypeFilter: React.Dispatch<React.SetStateAction<"all" | RoomType>>;
};

export default function RoomFilter({
  dateFilter,
  setDateFilter,
  setFloorFilter,
  setTypeFilter,
  setStatusFilter,
}: RoomFilterProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 p-4 bg-muted/50 rounded-lg">
      {/* Date Filter */}
      <div className="lg:col-span-1">
        <Label className="flex items-center gap-2 mb-2">
          <Calendar className="h-4 w-4" />
          Date
        </Label>
        <Input
          type="date"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="w-full"
        />
      </div>

      {/* Floor Filter */}
      <div className="lg:col-span-1">
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
            <SelectItem value="4">4th Floor</SelectItem>
            <SelectItem value="5">5th Floor</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Room Type Filter */}
      <div className="lg:col-span-1">
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
            {Object.entries(RoomType).map(([key, label]) => {
              // Optional: choose icon based on key
              let Icon;
              switch (key) {
                case "SQUEEN":
                case "DQUEEN":
                  Icon = Crown;
                  break;
                case "DTWIN":
                  Icon = BedDouble;
                  break;
                case "DTRIPPLE":
                  Icon = Hotel;
                  break;
                case "SFAMILLY":
                case "DFAMILLY":
                  Icon = BedSingle;
                  break;
                default:
                  Icon = null;
              }
              return (
                <SelectItem
                  key={key}
                  value={label}
                  className="flex items-center gap-2"
                >
                  {Icon && <Icon className="h-4 w-4" />} {label}
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>

      {/* Room Status Filter */}
      <div className="lg:col-span-1">
        <Label className="flex items-center gap-2 mb-2">
          <ListChecks className="h-4 w-4" />
          Room Status
        </Label>
        <Select
          onValueChange={(value: RoomStatus | "all" | RoomStatus.RESERVED) =>
            setStatusFilter(value)
          }
          defaultValue="all"
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem
              value={RoomStatus.AVAILABLE}
              className="flex items-center gap-2"
            >
              <CheckCircle className="h-4 w-4" /> Available
            </SelectItem>
            <SelectItem value="RESERVED" className="flex items-center gap-2">
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

      <div className="flex items-end lg:col-span-1">
        <AddRoomDialog />
      </div>
    </div>
  );
}
