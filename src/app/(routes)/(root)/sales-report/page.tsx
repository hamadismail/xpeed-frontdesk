'use client'

import { SalesTable } from "@/src/components/features/sales-report/sales-table";

export default function SalesReportPage() {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Sales Report</h1>
      <SalesTable />
    </div>
  );
}
