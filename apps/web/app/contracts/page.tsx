"use client"

import { useCompany } from "@/lib/company-context"
import { DataGrid } from "@/components/ui/data-grid"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function ContractsPage() {
  const { selectedCompany } = useCompany()

  if (!selectedCompany) {
    return <div className="p-8 text-center text-muted-foreground">Please select a company.</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">Contracts</h2>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Contract Records</CardTitle>
        </CardHeader>
        <CardContent>
          <DataGrid
            tableName="contracts"
            companyId={selectedCompany.id}
            columns={[
              { key: "contract_no", label: "Contract No.", editable: true },
              { key: "title", label: "Title", editable: true },
              { key: "party_a", label: "Party A", editable: true },
              { key: "party_b", label: "Party B", editable: true },
              { key: "total_amount", label: "Amount", editable: true, type: "number" },
              { key: "contract_type", label: "Type", editable: true },
              { key: "verification_status", label: "Status", editable: true },
            ]}
          />
        </CardContent>
      </Card>
    </div>
  )
}
