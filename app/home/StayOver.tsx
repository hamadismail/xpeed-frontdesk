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
  BedDouble,
  BedSingle,
  CalendarCheck,
  Crown,
  Hotel,
  ArrowLeft,
  ArrowRight,
  Check,
  Calendar,
} from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import axios from "axios";
import { IRoom, RoomType } from "@/models/room.model";
import { Calendar as DatePicker } from "@/components/ui/calendar";
import { format } from "date-fns";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { GUEST_STATUS, IBook, OTAS, PAYMENT_METHOD } from "@/models/book.model";

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

export default function StayOver({ room }: { room: IRoom }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(1);

  const { data: guest = [], isLoading: guestLoading } = useQuery<IBook[]>({
    queryKey: ["books"],
    queryFn: () =>
      axios.get(`/api/stayover/${room?.guestId}`).then((res) => res.data),
  });

  // Form State
  const [guestInfo, setGuestInfo] = useState({
    name: "",
    email: "",
    phone: "",
    country: "",
    passport: "",
    ic: "",
    otas: OTAS.DEFAULT,
    refId: "",
    status: GUEST_STATUS.CHECKED_IN,
  });

  const [stayInfo, setStayInfo] = useState({
    arrival: undefined as Date | undefined,
    departure: undefined as Date | undefined,
    adults: 1,
    children: 1,
  });

  const [paymentInfo, setPaymentInfo] = useState({
    roomPrice: "",
    sst: "",
    tourismTax: "",
    discount: "",
    paidAmount: "",
    paymentMethod: PAYMENT_METHOD.CASH,
    remarks: "",
  });

  const { mutate: bookRoom, isPending } = useMutation({
    mutationFn: async () => {
      const res = await axios.post("/api/book", {
        bookingInfo: {
          guest: { ...guestInfo },
          stay: { ...stayInfo },
          payment: {
            ...paymentInfo,
            subtotal: calculateTotal(),
            dueAmount: calculateDue(),
          },
          roomId: room?._id,
        },
      });
      return res.data;
    },
    onSuccess: () => {
      toast.success("Room booked successfully!");
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
      resetForm();
      setOpen(false);
    },
    onError: (error) => {
      toast.error("Booking failed", {
        description: error?.message || "Something went wrong",
      });
    },
  });

  const resetForm = () => {
    setGuestInfo({
      name: "",
      email: "",
      phone: "",
      country: "",
      passport: "",
      ic: "",
      otas: OTAS.DEFAULT,
      refId: "",
      status: GUEST_STATUS.CHECKED_IN,
    });
    setStayInfo({
      arrival: undefined,
      departure: undefined,
      adults: 1,
      children: 0,
    });
    setPaymentInfo({
      roomPrice: "",
      sst: "",
      tourismTax: "",
      discount: "",
      paidAmount: "",
      paymentMethod: PAYMENT_METHOD.CASH,
      remarks: "",
    });
    setStep(1);
  };

  const calculateNights = () => {
    if (stayInfo.arrival && stayInfo.departure) {
      const diffTime = Math.abs(
        stayInfo.departure.getTime() - stayInfo.arrival.getTime()
      );
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;
    }
    return 0;
  };

  const calculateTotal = () => {
    let nights = calculateNights();
    const roomPrice = parseFloat(paymentInfo.roomPrice) || 0;
    const sst = parseFloat(paymentInfo.sst) || 0;
    const tourismTax = parseFloat(paymentInfo.tourismTax) || 0;
    const discount = parseFloat(paymentInfo.discount) || 0;

    if (nights < 1) {
      nights = 1;
    }

    return roomPrice * nights + sst + tourismTax - discount;
  };

  const calculateDue = () => {
    return calculateTotal() - parseFloat(paymentInfo.paidAmount);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="secondary" className="h-8 px-3 gap-1 ">
          <BedDouble className="h-4 w-4" />
          <span>Stayover</span>
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            {getRoomIcon(room.roomType)}
            <div>
              <DialogTitle className="text-xl font-bold">
                Stay Over {room.roomNo}
              </DialogTitle>
              <DialogDescription className="capitalize">
                {room.roomType} • Floor {room.roomFloor}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>New Check Out Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !stayInfo.departure && "text-muted-foreground"
                    )}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {stayInfo.departure ? (
                      format(stayInfo.departure, "PPP")
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 max-h-[280px] overflow-auto">
                  <DatePicker
                    mode="single"
                    selected={stayInfo.departure}
                    onSelect={(date) =>
                      setStayInfo({ ...stayInfo, departure: date })
                    }
                    disabled={{
                      before: stayInfo.arrival || new Date(),
                    }}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {stayInfo.arrival && stayInfo.departure && (
            <div className="bg-muted/50 p-3 rounded-lg">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Duration:</span>
                <span className="font-medium">{calculateNights()} nights</span>
              </div>
            </div>
          )}
        </div>

        <div className="grid gap-4 overflow-scroll max-h-[350px]">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Room Price *</Label>
              <Input
                type="number"
                value={paymentInfo.roomPrice}
                onChange={(e) =>
                  setPaymentInfo({
                    ...paymentInfo,
                    roomPrice: e.target.value,
                  })
                }
                placeholder="200.00"
              />
            </div>

            <div className="space-y-2">
              <Label>SST (%)</Label>
              <Input
                type="number"
                value={paymentInfo.sst}
                onChange={(e) =>
                  setPaymentInfo({ ...paymentInfo, sst: e.target.value })
                }
                placeholder="6"
              />
            </div>

            <div className="space-y-2">
              <Label>Tourism Tax (per night)</Label>
              <Input
                type="number"
                value={paymentInfo.tourismTax}
                onChange={(e) =>
                  setPaymentInfo({
                    ...paymentInfo,
                    tourismTax: e.target.value,
                  })
                }
                placeholder="10.00"
              />
            </div>

            <div className="space-y-2">
              <Label>Discount</Label>
              <Input
                type="number"
                value={paymentInfo.discount}
                onChange={(e) =>
                  setPaymentInfo({ ...paymentInfo, discount: e.target.value })
                }
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <Label>Paid Amount *</Label>
              <Input
                type="number"
                value={paymentInfo.paidAmount}
                onChange={(e) =>
                  setPaymentInfo({
                    ...paymentInfo,
                    paidAmount: e.target.value,
                  })
                }
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <Label>Remarks *</Label>
              <Input
                type="text"
                value={paymentInfo.remarks}
                onChange={(e) =>
                  setPaymentInfo({
                    ...paymentInfo,
                    remarks: e.target.value,
                  })
                }
                placeholder="Type remarks"
              />
            </div>
          </div>

          <div className="bg-muted/50 p-3 rounded-lg">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Room Price:</span>
              <span className="font-medium">
                RM{" "}
                {(parseFloat(paymentInfo.roomPrice) || 0) * calculateNights()}
              </span>
            </div>
            {paymentInfo.sst && (
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">SST:</span>
                <span className="font-medium">RM {paymentInfo.sst}</span>
              </div>
            )}
            {paymentInfo.tourismTax && (
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">
                  Tourism Tax:
                </span>
                <span className="font-medium">
                  RM{" "}
                  {(parseFloat(paymentInfo.tourismTax) || 0) *
                    calculateNights()}
                </span>
              </div>
            )}
            {paymentInfo.discount && (
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Discount:</span>
                <span className="font-medium text-red-500">
                  - RM {paymentInfo.discount}
                </span>
              </div>
            )}
            <div className="flex justify-between mt-2 pt-2 border-t">
              <span className="text-sm font-medium">Subtotal:</span>
              <span className="font-bold">RM {calculateTotal()}</span>
            </div>
            <div className="flex justify-between mt-2 pt-2 border-t">
              <span className="text-sm font-medium">Total Paid:</span>
              <span className="font-bold">RM {paymentInfo.paidAmount}</span>
            </div>
            <div className="flex justify-between mt-2 pt-2 border-t text-red-500">
              <span className="text-sm font-medium">Due Amount:</span>
              <span className="font-bold">RM {calculateDue() || 0}</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
