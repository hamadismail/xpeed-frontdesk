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
import { CalendarCheck } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import axios from "axios";

type Props = {
  roomId: string;
};

export default function BookRoomDialog({ roomId }: Props) {
  const queryClient = useQueryClient();

  const [open, setOpen] = useState(false);
  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");

  const { mutate: bookRoom, isPending } = useMutation({
    mutationFn: async () => {
      const res = await axios.post("/api/guest", {
        roomId,
        guestName,
        guestPhone,
      });
      return res.data;
    },
    onSuccess: () => {
      toast.success("Room booked successfully");
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
      setOpen(false);
      setGuestName("");
      setGuestPhone("");
    },
    onError: (error) => {
      toast.error("Booking Failed", {
        description: error?.message || "Something went wrong",
      });
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="h-8 px-3">
          <CalendarCheck className="h-4 w-4 mr-1" />
          Book
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Book This Room</DialogTitle>
          <DialogDescription>
            Fill out the form to add a new room to the system
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <Input
            placeholder="Guest Name"
            value={guestName}
            onChange={(e) => setGuestName(e.target.value)}
          />
          <Input
            placeholder="Guest Phone"
            value={guestPhone}
            onChange={(e) => setGuestPhone(e.target.value)}
          />
          <Button
            className="w-full"
            onClick={() => bookRoom()}
            disabled={isPending}
          >
            {isPending ? "Booking..." : "Confirm Booking"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
