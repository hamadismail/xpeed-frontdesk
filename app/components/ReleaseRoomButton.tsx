"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RotateCcw } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { releaseRoom } from "../roomActions/actions";

interface ReleaseRoomButtonProps {
  roomId: string;
}

export default function ReleaseRoomButton({ roomId }: ReleaseRoomButtonProps) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const { mutate: releaseRoomMutation, isPending } = useMutation({
    mutationFn: async (roomId: string) => releaseRoom(roomId),
    onSuccess: () => {
      toast.success("Room released successfully");
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
      setOpen(false);
    },
    onError: () => {
      toast.error("Failed to release room");
    },
  });

  const handleConfirm = () => {
    releaseRoomMutation(roomId);
    setOpen(false);
  };

  return (
    <>
      <Button
        variant="secondary"
        size="sm"
        className="h-8 px-3 gap-1"
        onClick={() => setOpen(true)}
      >
        <RotateCcw className="h-4 w-4" />
        Release
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Are you sure you want to release this room?
            </DialogTitle>
          </DialogHeader>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            {isPending ? (
              "Loading..."
            ) : (
              <Button variant="destructive" onClick={handleConfirm}>
                Confirm
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
