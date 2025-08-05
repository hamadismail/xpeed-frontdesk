"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BedSingle, BedDouble, Crown, Hotel, Plus } from "lucide-react";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { createRoom } from "../roomActions/actions";
import { useMutation, useQueryClient } from "@tanstack/react-query";

type RoomType = "Single" | "Twin" | "Queen" | "Suite";

// type RoomData = Pick<Room, "roomNo" | "roomType" | "roomFloor">;
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
    roomType: "Single" as RoomType,
    roomFloor: "1",
  });
  const queryClient = useQueryClient();

  const { mutate: createRoomMutate, isPending } = useMutation({
    mutationFn: (formData: RoomData) => createRoom(formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rooms"] }); // 🔁 Re-fetch room list
      toast.success("Room added successfully");
      setFormData({ roomNo: "", roomType: "Single", roomFloor: "1" });
      setOpen(false);
    },
    onError: (error) => {
      toast.error("Failed to add room", {
        description: error?.message || "Something went wrong",
      });
    },
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
                  <SelectItem
                    value="Single"
                    className="flex items-center gap-2"
                  >
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
