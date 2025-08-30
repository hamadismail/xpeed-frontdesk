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
  DialogFooter,
} from "@/src/components/ui/dialog";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import axios from "axios";
import { Clock } from "lucide-react";

export default function CancelReservationButton({
  reservationId,
}: {
  reservationId: string;
}) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const { mutate: cancelReservationMutation, isPending } = useMutation({
    mutationFn: async () => {
      const res = await axios.delete(`/api/reserve`, {
        data: { reservationId },
      });
      return res.data;
    },
    onSuccess: () => {
      toast.success("Reservation cancelled successfully!");
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
      queryClient.invalidateQueries({ queryKey: ["reserve"] });
      setOpen(false);
    },
    onError: (error) => {
      toast.error("Failed to cancel reservation", {
        description: error?.message || "Something went wrong",
      });
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="secondary" className="h-8 px-3 gap-1">
          <Clock className="h-4 w-4" />
          <span>Cancel</span>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cancel Reservation?</DialogTitle>
          <DialogDescription>
            This will cancel the reservation for this room. This action cannot
            be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Back
          </Button>
          <Button
            onClick={() => cancelReservationMutation()}
            disabled={isPending}
          >
            {isPending ? "Cancelling..." : "Confirm"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
