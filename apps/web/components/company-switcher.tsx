"use client"

import { useCompany } from "@/lib/company-context"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Building2, ChevronDown, Settings } from "lucide-react"
import { useRouter } from "next/navigation"

export function CompanySwitcher() {
  const { selectedCompany, companies, selectCompany } = useCompany()
  const router = useRouter()

  if (!selectedCompany) {
    return null
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Building2 className="h-4 w-4" />
          <span className="max-w-[150px] truncate">{selectedCompany.name}</span>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[250px]">
        {companies.map((company) => (
          <DropdownMenuItem
            key={company.id}
            onClick={() => selectCompany(company.id)}
            className="cursor-pointer"
          >
            <Building2 className="h-4 w-4 mr-2" />
            <div className="flex flex-col">
              <span className="font-medium">{company.name}</span>
              {company.tax_id && (
                <span className="text-xs text-muted-foreground">
                  税号: {company.tax_id}
                </span>
              )}
            </div>
            {selectedCompany.id === company.id && (
              <span className="ml-auto text-primary">✓</span>
            )}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => router.push("/settings?tab=companies")}
          className="cursor-pointer"
        >
          <Settings className="h-4 w-4 mr-2" />
          管理公司...
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
