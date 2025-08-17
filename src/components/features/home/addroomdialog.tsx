"use client";

import { useState } from "react";
import { Button } from "@/src/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/src/components/ui/dialog";
import { Input } from "@/src/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { BedSingle, BedDouble, Crown, Hotel, Plus } from "lucide-react";
import { Label } from "@/src/components/ui/label";
import { toast } from "sonner";
import { createRoom } from "@/src/services/actions";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { RoomType } from "@/src/models/room.model";

type RoomData = {
  roomNo: string;
  roomType: RoomType;
  roomFloor: string;
};

export default function AddRoomDialog() {
  const [open, setOpen] = useState(false);
  // const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    roomNo: "",
    roomType: RoomType.DQUEEN,
    roomFloor: "1",
  });
  const queryClient = useQueryClient();

  const { mutate: createRoomMutate, isPending } = useMutation({
    mutationFn: (formData: RoomData) => createRoom(formData),
    onSuccess: (res) => {
      if (!res.success) {
        toast.error("Failed to add room", {
          description: res.error || "Something went wrong",
        });
        return;
      }
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
      toast.success("Room added successfully");
      setFormData({ roomNo: "", roomType: RoomType.SQUEEN, roomFloor: "1" });
      setOpen(false);
    },
    // onError: (error) => {},
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!/^\d{3}$/.test(formData.roomNo)) {
      toast.error("Room number must be 3 digits (e.g. 101)");
      return;
    }

    createRoomMutate(formData); // ✅ Fire mutation
  };

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Add Room
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Room</DialogTitle>
          <DialogDescription>
            Fill out the form to add a new room to the system
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="roomNo">Room Number</Label>
            <Input
              id="roomNo"
              value={formData.roomNo}
              onChange={(e) => handleChange("roomNo", e.target.value)}
              placeholder="e.g. 101"
              required
              pattern="\d{3}"
              title="Room number must be 3 digits (e.g. 101)"
            />
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <Label>Room Type</Label>
              <Select
                value={formData.roomType}
                onValueChange={(value: RoomType) =>
                  handleChange("roomType", value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select room type" />
                </SelectTrigger>
                <SelectContent>
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

            <div className="flex-1">
              <Label>Floor</Label>
              <Select
                value={formData.roomFloor}
                onValueChange={(value) => handleChange("roomFloor", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select floor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1st Floor</SelectItem>
                  <SelectItem value="2">2nd Floor</SelectItem>
                  <SelectItem value="3">3rd Floor</SelectItem>
                  <SelectItem value="4">4th Floor</SelectItem>
                  <SelectItem value="5">5th Floor</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Adding..." : "Add Room"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
