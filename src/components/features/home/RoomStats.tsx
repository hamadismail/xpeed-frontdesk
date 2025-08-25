import { CheckCircle, Clock, XCircle } from "lucide-react";
import React from "react";
import { Badge } from "../../ui/badge";

type RoomStatsProps = {
  availableCount: number;
  reservedCount: number;
  occupiedCount: number;
  dueOutCount?: number;
};

export default function RoomStats({
  availableCount,
  reservedCount,
  occupiedCount,
  dueOutCount = 0,
}: RoomStatsProps) {
  return (
    <div className="flex flex-wrap gap-6">
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
        <div className="flex items-center gap-1 text-yellow-500">
          <Clock className="h-4 w-4" />
          <span className="font-medium">Reserved:</span>
        </div>
        <Badge
          variant="secondary"
          className="px-3 py-1 bg-yellow-100 text-yellow-800 border-yellow-300"
        >
          {reservedCount}
        </Badge>
      </div>
      {dueOutCount > 0 && (
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-blue-500">
            <Clock className="h-4 w-4" />
            <span className="font-medium">Due Out:</span>
          </div>
          <Badge
            variant="secondary"
            className="px-3 py-1 bg-blue-100 text-blue-800 border-blue-300"
          >
            {dueOutCount}
          </Badge>
        </div>
      )}
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
  );
}
