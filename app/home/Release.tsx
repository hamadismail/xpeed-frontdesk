"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { BedDouble, BedSingle, Crown, Hotel, LogOut } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import axios from "axios";
import { IRoom, RoomType } from "@/models/room.model";
import { IBook } from "@/models/book.model";

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

export default function CheckOut({ room }: { room: IRoom }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);

  const { data: singleGuest } = useQuery<IBook>({
    queryKey: ["books", room?.guestId],
    queryFn: () =>
      axios.get(`/api/stayover/${room?.guestId}`).then((res) => res.data),
  });

  const dueAmount = singleGuest?.payment?.dueAmount || 0;
  const hasDueAmount = dueAmount > 0;

  const { mutate: checkOutMutation, isPending } = useMutation({
    mutationFn: async () => {
      const res = await axios.patch(`/api/rooms/${room?._id}`);
      return res.data;
    },
    onSuccess: () => {
      toast.success("Guest checked out successfully!");
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
      setOpen(false);
      setAcknowledged(false);
    },
    onError: (error) => {
      toast.error("Checkout failed", {
        description: error?.message || "Something went wrong",
      });
    },
  });

  const handleCheckout = () => {
    if (hasDueAmount && !acknowledged) {
      toast.warning("Please acknowledge the due amount");
      return;
    }
    checkOutMutation();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="default" className="h-8 px-3 gap-1">
          <LogOut className="h-4 w-4" />
          <span>CheckOut</span>
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            {getRoomIcon(room.roomType)}
            <div>
              <DialogTitle className="text-xl font-bold">
                Check Out {room.roomNo}
              </DialogTitle>
              <DialogDescription className="capitalize">
                {room.roomType} • Floor {room.roomFloor}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Payment Summary Section */}
          <div className="border rounded-lg p-4 space-y-2">
            <h3 className="font-medium">Payment Summary</h3>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Charges:</span>
              <span>RM {singleGuest?.payment?.subtotal || "0.00"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Amount Paid:</span>
              <span>RM {singleGuest?.payment?.paidAmount || "0.00"}</span>
            </div>
            <div className="flex justify-between font-bold text-lg mt-2 pt-2 border-t">
              <span
                className={hasDueAmount ? "text-destructive" : "text-green-600"}
              >
                Due Amount:
              </span>
              <span
                className={hasDueAmount ? "text-destructive" : "text-green-600"}
              >
                RM {dueAmount.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Warning for Due Amount */}
          {hasDueAmount && (
            <Alert variant="destructive">
              <AlertTitle>Outstanding Balance</AlertTitle>
              <AlertDescription>
                This guest has an unpaid balance. Please confirm payment or
                acknowledge to proceed with checkout.
              </AlertDescription>
            </Alert>
          )}

          {/* Acknowledgment */}
          <div className="flex items-center gap-2">
            <Checkbox
              id="acknowledge"
              checked={acknowledged}
              onCheckedChange={(checked) => setAcknowledged(Boolean(checked))}
            />
            <label htmlFor="acknowledge" className="text-sm">
              {hasDueAmount
                ? "I acknowledge the outstanding balance and wish to proceed"
                : "I confirm there are no pending payments"}
            </label>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCheckout}
              disabled={isPending || (hasDueAmount && !acknowledged)}
              className="gap-1"
            >
              {isPending ? "Processing..." : "Confirm Checkout"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
