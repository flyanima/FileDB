"use client"

import { useCompany } from "@/lib/company-context"
import { DataGrid } from "@/components/ui/data-grid"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function InvoicesPage() {
  const { selectedCompany } = useCompany()

  if (!selectedCompany) {
    return <div className="p-8 text-center text-muted-foreground">Please select a company.</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">Invoices</h2>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Invoice Records</CardTitle>
        </CardHeader>
        <CardContent>
          <DataGrid
            tableName="invoices"
            companyId={selectedCompany.id}
            columns={[
              { key: "invoice_code", label: "Code", editable: true },
              { key: "invoice_number", label: "Number", editable: true },
              { key: "total_amount_tax_included", label: "Total Amount", editable: true, type: "number" },
              { key: "verification_status", label: "Status", editable: true },
              { key: "created_at", label: "Created At", editable: false },
            ]}
          />
        </CardContent>
      </Card>
    </div>
  )
}
