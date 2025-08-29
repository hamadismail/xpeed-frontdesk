"use client";

import React, { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { z } from "zod";
import {
  ArrowLeft,
  ArrowRight,
  CalendarIcon,
  Check,
} from "lucide-react";
import { cn } from "@/src/lib/utils";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/src/components/ui/form";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/src/components/ui/popover";
import { addDays, format } from "date-fns";
import { Calendar } from "@/src/components/ui/calendar";
import ReservationInvoive from "@/src/components/layout/ReservationInvoive";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { IRoom, RoomType } from "@/src/models/room.model";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { OTAS, GUEST_STATUS, IBook } from "@/src/models/book.model";
import { IReservation } from "@/src/types";
import LoadingSpiner from "@/src/utils/LoadingSpiner";

const formSchema = z.object({
  // Guest Info
  reservationNo: z.string().optional(),
  ota: z.string().optional(),
  name: z.string().min(1, "Please enter the guest full name."),
  phone: z.string().min(1, "Please type guest phone number"),
  email: z.string().optional(),
  passport: z.string().optional(),
  nationality: z.string().optional(),

  // Booking Info
  roomType: z.nativeEnum(RoomType).nullable(),
  roomNo: z.string().min(1, "Room no. is required"),
  numOfGuest: z.string().optional(),
  arrivalDate: z.date(),
  departureDate: z.date(),
  roomDetails: z.string().optional(),
  otherGuest: z.string().optional(),

  // Payment Info
  bookingFee: z.string().min(1, "Booking fee is required"),
  sst: z.string().optional(),
  tourismTax: z.string().optional(),
  discount: z.string().optional(),
});

export default function Reservation() {
  const [step, setStep] = useState(1);
  const queryClient = useQueryClient();

  const { data: allRooms = [], isLoading: roomsLoading } = useQuery<IRoom[]>({
    queryKey: ["rooms"],
    queryFn: () => axios.get("/api/rooms").then((res) => res.data),
  });

  const { data: allBookings = [], isLoading: bookingsLoading } = useQuery<
    IBook[]
  >({
    queryKey: ["book"],
    queryFn: () => axios.get("/api/book").then((res) => res.data),
  });

  const { data: allReservations = [], isLoading: reservationsLoading } =
    useQuery<IReservation[]>({
      queryKey: ["reserve"],
      queryFn: () => axios.get("/api/reserve").then((res) => res.data),
    });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      reservationNo: "",
      ota: "",
      name: "",
      phone: "",
      email: "",
      passport: "",
      nationality: "",
      roomType: null,
      roomNo: "",
      numOfGuest: "",
      arrivalDate: new Date(),
      departureDate: addDays(new Date(), 1),
      roomDetails: "",
      otherGuest: "",
      bookingFee: "0",
      sst: "",
      tourismTax: "",
      discount: "",
    },
  });

  const arrivalDate = form.watch("arrivalDate");
  const departureDate = form.watch("departureDate");
  const selectedRoomType = form.watch("roomType");

  const availableRooms = useMemo(() => {
    if (!arrivalDate || !departureDate || !allRooms.length) return [];

    const selectedInterval = { start: arrivalDate, end: departureDate };

    return allRooms.filter((room) => {
      // Check for an overlapping booking (checked-in guest)
      const isOccupied = allBookings.some((booking) => {
        const bookingStart = new Date(booking.stay.arrival);
        const bookingEnd = new Date(booking.stay.departure);
        // Ensure roomId is comparable
        const bookingRoomId =
          typeof booking.roomId === 'object' && booking.roomId !== null && '_id' in booking.roomId
            ? ((booking.roomId as unknown) as { _id: string })._id.toString()
            : booking.roomId?.toString();


        return (
          bookingRoomId === room._id?.toString() &&
          booking.guest.status === GUEST_STATUS.CHECKED_IN &&
          selectedInterval.start < bookingEnd &&
          selectedInterval.end > bookingStart
        );
      });

      // Check for an overlapping reservation
      const isReserved = allReservations.some((reservation) => {
        const reservationStart = new Date(reservation.room.arrival);
        const reservationEnd = new Date(reservation.room.departure);
        return (
          reservation.room.roomNo === room.roomNo &&
          selectedInterval.start <= reservationEnd &&
          selectedInterval.end >= reservationStart
        );
      });

      return !isOccupied && !isReserved;
    });
  }, [arrivalDate, departureDate, allRooms, allBookings, allReservations]);

  const availableRoomsByType = useMemo(() => {
    const roomsByType: Record<string, IRoom[]> = {};
    availableRooms.forEach((room) => {
      if (!roomsByType[room.roomType]) {
        roomsByType[room.roomType] = [];
      }
      roomsByType[room.roomType].push(room);
    });
    return roomsByType;
  }, [availableRooms]);

  const { mutate: reserveRoom, isPending } = useMutation({
    mutationFn: async (data: z.infer<typeof formSchema>) => {
      const payload = {
        guest: {
          reservationNo: data.reservationNo,
          ota: data.ota,
          name: data.name,
          email: data.email,
          phone: data.phone,
          nationality: data.nationality,
          passport: data.passport,
        },
        room: {
          roomNo: data.roomNo,
          numOfGuest: data.numOfGuest,
          arrival: data.arrivalDate,
          departure: data.departureDate,
          roomDetails: data.roomDetails,
          otherGuest: data.otherGuest,
        },
        payment: {
          bookingFee: data.bookingFee,
          sst: data.sst,
          tourismTax: data.tourismTax,
          fnfDiscount: data.discount,
        },
        reservationDate: new Date().toISOString(),
      };
      const res = await axios.post("/api/reserve", { payload });

      if (res?.data?.success) {
        toast.success("Room reserved successfully!");
        queryClient.invalidateQueries({ queryKey: ["reserve", "rooms"] });
        setStep(1);
        form.reset();
      } else {
        toast.error("Reservation failed", {
          description: res?.data?.message || "Something went wrong",
        });
      }
    },
  });

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    reserveRoom(data);
  };

  const handleNext = async () => {
    let fieldsToValidate: (keyof z.infer<typeof formSchema>)[] = [];

    if (step === 1) fieldsToValidate = ["name", "phone"];
    else if (step === 2)
      fieldsToValidate = ["arrivalDate", "departureDate", "roomType", "roomNo"];
    else if (step === 3) fieldsToValidate = ["bookingFee"];

    const isStepValid = await form.trigger(fieldsToValidate);
    if (!isStepValid) {
      toast.error("Please fill all required fields correctly.");
      return;
    }
    setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  if (roomsLoading || bookingsLoading || reservationsLoading) {
    return <LoadingSpiner />;
  }

  return (
    <div>
      <div className="w-full max-w-4xl px-4 mx-auto">
        <div className="text-center text-xl font-bold mt-4 mb-8">
          Reserve The Room
        </div>

        {/* Progress Steps */}
        <div className="flex justify-between mb-8 w-1/2 mx-auto">
          {[1, 2, 3, 4].map((stepNumber) => (
            <div key={stepNumber} className="flex flex-col items-center">
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center",
                  step === stepNumber
                    ? "bg-primary text-primary-foreground"
                    : step > stepNumber
                    ? "bg-green-100 text-green-800"
                    : "bg-muted",
                  step > stepNumber && "border-2 border-green-500"
                )}
              >
                {step > stepNumber ? <Check className="h-4 w-4" /> : stepNumber}
              </div>
              <span className="text-xs mt-1 text-muted-foreground">
                {stepNumber === 1 && "Guest"}
                {stepNumber === 2 && "Room"}
                {stepNumber === 3 && "Payment"}
                {stepNumber === 4 && "Confirm"}
              </span>
            </div>
          ))}
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {step === 1 && (
              <div className="grid gap-4">
                <div className="grid sm:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="reservationNo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Reservation No.</FormLabel>
                        <FormControl>
                          <Input placeholder="Optional" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="ota"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>OTA</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select OTA/Reference" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Object.values(OTAS).map((ota) => (
                              <SelectItem key={ota} value={ota}>
                                {ota}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name*</FormLabel>
                        <FormControl>
                          <Input placeholder="Guest full name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone*</FormLabel>
                        <FormControl>
                          <Input placeholder="Guest phone number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input placeholder="guest@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="passport"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>IC/Passport</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="IC or Passport number"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="nationality"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nationality</FormLabel>
                        <FormControl>
                          <Input placeholder="Guest nationality" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="flex justify-end gap-2 mt-4">
                  <Button type="button" onClick={handleNext} className="gap-1">
                    Next <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <FormField
                  control={form.control}
                  name="arrivalDate" // Control both dates with one component
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Stay Duration</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {arrivalDate && departureDate ? (
                                <>
                                  {format(arrivalDate, "LLL dd, yyyy")} -{" "}
                                  {format(departureDate, "LLL dd, yyyy")}
                                </>
                              ) : (
                                <span>Select your stay dates</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="range"
                            defaultMonth={arrivalDate}
                            selected={{
                              from: arrivalDate,
                              to: departureDate,
                            }}
                            onSelect={(range) => {
                              form.setValue("arrivalDate", range?.from as Date);
                              form.setValue("departureDate", range?.to as Date);
                            }}
                            disabled={(date) => {
                              const today = new Date();
                              today.setHours(0, 0, 0, 0);
                              return date < today;
                            }}
                            numberOfMonths={2}
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-4">
                  <h3 className="text-md font-medium">
                    Available Room Categories
                  </h3>
                  <FormField
                    control={form.control}
                    name="roomType"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormControl>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {Object.keys(availableRoomsByType).map((type) => (
                              <Button
                                key={type}
                                variant={
                                  field.value === type ? "default" : "outline"
                                }
                                onClick={() => field.onChange(type as RoomType)}
                                className="h-auto py-3 flex flex-col"
                              >
                                <span>{type}</span>
                                <span className="text-xs text-muted-foreground">
                                  ({availableRoomsByType[type].length}{" "}
                                  available)
                                </span>
                              </Button>
                            ))}
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {selectedRoomType && (
                  <div className="space-y-4">
                    <h3 className="text-md font-medium">
                      Select an Available Room
                    </h3>
                    <FormField
                      control={form.control}
                      name="roomNo"
                      render={({ field }) => (
                        <FormItem>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a room number" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {availableRoomsByType[selectedRoomType]?.map(
                                (room) => (
                                  <SelectItem
                                    key={room._id?.toString()}
                                    value={room.roomNo}
                                  >
                                    {room.roomNo}
                                  </SelectItem>
                                )
                              )}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                <div className="flex justify-end gap-2 mt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleBack}
                    className="gap-1"
                  >
                    <ArrowLeft className="h-4 w-4" /> Back
                  </Button>
                  <Button type="button" onClick={handleNext} className="gap-1">
                    Next <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="grid gap-4">
                <div className="grid sm:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="bookingFee"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Booking Fee</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="sst"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>SST (optional)</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="tourismTax"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tourism Tax (optional)</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="discount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Discount (optional)</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="flex justify-end gap-2 mt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleBack}
                    className="gap-1"
                  >
                    <ArrowLeft className="h-4 w-4" /> Back
                  </Button>
                  <Button type="button" onClick={handleNext} className="gap-1">
                    Next <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="grid gap-6 overflow-auto max-h-80">
                <ReservationInvoive
                  bookingInfo={{
                    guest: {
                      reservationNo: form.getValues("reservationNo") ?? "",
                      ota: form.getValues("ota") ?? "",
                      name: form.getValues("name"),
                      email: form.getValues("email") ?? "",
                      phone: form.getValues("phone"),
                      nationality: form.getValues("nationality") ?? "",
                      passport: form.getValues("passport") ?? "",
                    },
                    room: {
                      roomNo: form.getValues("roomNo"),
                      numOfGuest: form.getValues("numOfGuest") ?? "",
                      arrival: form.getValues("arrivalDate"),
                      departure: form.getValues("departureDate"),
                      roomDetails: form.getValues("roomDetails") ?? "",
                      otherGuest: form.getValues("otherGuest") ?? "",
                    },
                    payment: {
                      bookingFee: parseFloat(form.getValues("bookingFee")),
                      sst: parseFloat(form.getValues("sst") || "0"),
                      tourismTax: parseFloat(
                        form.getValues("tourismTax") || "0"
                      ),
                      fnfDiscount: parseFloat(
                        form.getValues("discount") || "0"
                      ),
                      totalAmount:
                        parseFloat(form.getValues("bookingFee")) +
                        parseFloat(form.getValues("sst") || "0") +
                        parseFloat(form.getValues("tourismTax") || "0") -
                        parseFloat(form.getValues("discount") || "0"),
                    },
                    reservationDate: new Date().toLocaleString(),
                  }}
                  onConfirmBooking={form.handleSubmit(onSubmit)}
                  onBack={handleBack}
                  isPending={isPending}
                />
              </div>
            )}
          </form>
        </Form>
      </div>
    </div>
  );
}
