"use client"

import { useCompany } from "@/lib/company-context"
import { DataGrid } from "@/components/ui/data-grid"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function BankStatementsPage() {
  const { selectedCompany } = useCompany()

  if (!selectedCompany) {
    return <div className="p-8 text-center text-muted-foreground">Please select a company.</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">Bank Statements</h2>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Transaction Records</CardTitle>
        </CardHeader>
        <CardContent>
          <DataGrid
            tableName="bank_statements"
            companyId={selectedCompany.id}
            columns={[
              { key: "transaction_date", label: "Date", editable: true, type: "date" },
              { key: "counterparty_name", label: "Counterparty", editable: true },
              { key: "debit_amount", label: "Debit", editable: true, type: "number" },
              { key: "credit_amount", label: "Credit", editable: true, type: "number" },
              { key: "summary", label: "Summary", editable: true },
              { key: "account_number", label: "Account", editable: true },
            ]}
          />
        </CardContent>
      </Card>
    </div>
  )
}
