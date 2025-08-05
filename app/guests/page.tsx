"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Search,
  Filter,
  Eye,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";

interface Guest {
  _id: string;
  guest: {
    name: string;
    email: string;
    phone: string;
    country: string;
    passport: string;
  };
  stay: {
    arrival: Date;
    departure: Date;
    adults: number;
    children: number;
  };
  payment: {
    roomPrice: number;
    subtotal: number;
    paidAmount: number;
    dueAmount: number;
    paymentMethod: string;
  };
  roomId: string;
  createdAt: Date;
  updatedAt: Date;
}

const fetchGuests = async (
  page: number,
  search: string,
  countryFilter: string
) => {
  const { data } = await axios.get("/api/guests", {
    params: {
      page,
      search,
      country: countryFilter,
    },
  });
  return data;
};

export default function GuestTable() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [countryFilter, setCountryFilter] = useState("all");
  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["guests", page, search, countryFilter],
    queryFn: () => fetchGuests(page, search, countryFilter),
    // keepPreviousData: true
  });

  const handleViewGuest = (guest: Guest) => {
    setSelectedGuest(guest);
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Guest Management</h1>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
          <Input
            placeholder="Search guests..."
            className="pl-9"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-500" />
          <Select
            value={countryFilter}
            onValueChange={(value) => {
              setCountryFilter(value);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by country" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Countries</SelectItem>
              <SelectItem value="Bangladesh">Bangladesh</SelectItem>
              <SelectItem value="Malaysia">Malaysia</SelectItem>
              <SelectItem value="Singapore">Singapore</SelectItem>
              <SelectItem value="India">India</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Country</TableHead>
              <TableHead>Arrival</TableHead>
              <TableHead>Departure</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array(5)
                .fill(0)
                .map((_, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <Skeleton className="h-4 w-[120px]" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-[180px]" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-[120px]" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-[100px]" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-[100px]" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-[100px]" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-8 w-[60px]" />
                    </TableCell>
                  </TableRow>
                ))
            ) : isError ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-red-500">
                  Failed to load guests
                </TableCell>
              </TableRow>
            ) : data?.guests?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center">
                  No guests found
                </TableCell>
              </TableRow>
            ) : (
              data?.guests?.map((guest: Guest) => (
                <TableRow key={guest._id}>
                  <TableCell className="font-medium">
                    {guest.guest.name}
                  </TableCell>
                  <TableCell>{guest.guest.email}</TableCell>
                  <TableCell>{guest.guest.phone}</TableCell>
                  <TableCell>{guest.guest.country}</TableCell>
                  <TableCell>
                    {format(new Date(guest.stay.arrival), "MMM dd, yyyy")}
                  </TableCell>
                  <TableCell>
                    {format(new Date(guest.stay.departure), "MMM dd, yyyy")}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewGuest(guest)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between px-2">
        <div className="text-sm text-muted-foreground">
          Page {page} of {data?.totalPages || 1}
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(1)}
            disabled={page === 1 || isLoading}
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1 || isLoading}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(Math.min(data?.totalPages || 1, page + 1))}
            disabled={page === data?.totalPages || isLoading || !data?.hasMore}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(data?.totalPages || 1)}
            disabled={page === data?.totalPages || isLoading || !data?.hasMore}
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Guest Details</DialogTitle>
          </DialogHeader>
          {selectedGuest && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <h3 className="font-semibold">Personal Information</h3>
                <p>
                  <span className="text-muted-foreground">Name:</span>{" "}
                  {selectedGuest.guest.name}
                </p>
                <p>
                  <span className="text-muted-foreground">Email:</span>{" "}
                  {selectedGuest.guest.email}
                </p>
                <p>
                  <span className="text-muted-foreground">Phone:</span>{" "}
                  {selectedGuest.guest.phone}
                </p>
                <p>
                  <span className="text-muted-foreground">Country:</span>{" "}
                  {selectedGuest.guest.country}
                </p>
                <p>
                  <span className="text-muted-foreground">Passport:</span>{" "}
                  {selectedGuest.guest.passport || "N/A"}
                </p>
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold">Stay Information</h3>
                <p>
                  <span className="text-muted-foreground">Arrival:</span>{" "}
                  {format(new Date(selectedGuest.stay.arrival), "MMM dd, yyyy")}
                </p>
                <p>
                  <span className="text-muted-foreground">Departure:</span>{" "}
                  {format(
                    new Date(selectedGuest.stay.departure),
                    "MMM dd, yyyy"
                  )}
                </p>
                <p>
                  <span className="text-muted-foreground">Adults:</span>{" "}
                  {selectedGuest.stay.adults}
                </p>
                <p>
                  <span className="text-muted-foreground">Children:</span>{" "}
                  {selectedGuest.stay.children}
                </p>
                <p>
                  <span className="text-muted-foreground">Room ID:</span>{" "}
                  {selectedGuest.roomId}
                </p>
              </div>
              <div className="col-span-2 space-y-2 border-t pt-4">
                <h3 className="font-semibold">Payment Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p>
                      <span className="text-muted-foreground">Room Price:</span>{" "}
                      ${selectedGuest.payment.roomPrice}
                    </p>
                    <p>
                      <span className="text-muted-foreground">Subtotal:</span> $
                      {selectedGuest.payment.subtotal}
                    </p>
                  </div>
                  <div>
                    <p>
                      <span className="text-muted-foreground">
                        Paid Amount:
                      </span>{" "}
                      ${selectedGuest.payment.paidAmount}
                    </p>
                    <p>
                      <span className="text-muted-foreground">Due Amount:</span>{" "}
                      ${selectedGuest.payment.dueAmount}
                    </p>
                    <p>
                      <span className="text-muted-foreground">
                        Payment Method:
                      </span>{" "}
                      {selectedGuest.payment.paymentMethod}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
