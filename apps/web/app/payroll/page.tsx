"use client"

import { useCompany } from "@/lib/company-context"
import { DataGrid } from "@/components/ui/data-grid"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileDown } from "lucide-react"

export default function PayrollPage() {
  const { selectedCompany } = useCompany()

  const handleGeneratePayslip = () => {
    // TODO: Implement payslip generation
    alert("Payslip generation coming soon!")
  }

  if (!selectedCompany) {
    return <div className="p-8 text-center text-muted-foreground">Please select a company.</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">Payroll</h2>
        <Button onClick={handleGeneratePayslip}>
          <FileDown className="h-4 w-4 mr-2" />
          Generate Payslips
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Payroll Records</CardTitle>
        </CardHeader>
        <CardContent>
          <DataGrid
            tableName="payroll_records"
            companyId={selectedCompany.id}
            columns={[
              { key: "employee_id", label: "Employee ID", editable: true },
              { key: "pay_period", label: "Period", editable: true },
              { key: "base_salary", label: "Base Salary", editable: true, type: "number" },
              { key: "position_subsidy", label: "Position Subsidy", editable: true, type: "number" },
              { key: "total_deductions", label: "Deductions", editable: true, type: "number" },
              { key: "net_pay", label: "Net Pay", editable: true, type: "number" },
            ]}
          />
        </CardContent>
      </Card>
    </div>
  )
}
