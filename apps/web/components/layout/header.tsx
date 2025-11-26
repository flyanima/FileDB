"use client"

import { CompanySwitcher } from "@/components/company-switcher"

export function Header() {
  return (
    <div className="flex items-center justify-between p-4 border-b h-16 bg-white">
      <div className="flex items-center gap-4">
        <h2 className="text-lg font-semibold">FinSight AI</h2>
      </div>
      
      <div className="flex items-center gap-4">
        <CompanySwitcher />
      </div>
    </div>
  )
}
