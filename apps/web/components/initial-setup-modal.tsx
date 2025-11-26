"use client"

import { useState } from "react"
import { useCompany } from "@/lib/company-context"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"

export function InitialSetupModal() {
  const { companies, refreshCompanies, loading } = useCompany()
  const [companyName, setCompanyName] = useState("")
  const [taxId, setTaxId] = useState("")
  const [creating, setCreating] = useState(false)

  const handleCreate = async () => {
    if (!companyName.trim()) {
      toast.error("请输入公司名称")
      return
    }

    setCreating(true)
    try {
      const { error } = await supabase.from("companies").insert({
        name: companyName,
        tax_id: taxId || null,
        currency: "CNY"
      })

      if (error) throw error

      toast.success("公司创建成功！")
      await refreshCompanies()
      setCompanyName("")
      setTaxId("")
    } catch (error) {
      console.error("Error creating company:", error)
      toast.error("创建失败，请重试")
    } finally {
      setCreating(false)
    }
  }

  // Don't show modal if loading or if companies exist
  if (loading || companies.length > 0) {
    return null
  }

  return (
    <Dialog open={true}>
      <DialogContent className="sm:max-w-[500px]" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="text-2xl">欢迎使用 FinSight AI</DialogTitle>
          <DialogDescription className="text-base pt-2">
            在开始之前，请创建您的第一个公司/项目。
            <br />
            您可以稍后在设置中添加更多公司。
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="company-name">
              公司名称 <span className="text-red-500">*</span>
            </Label>
            <Input
              id="company-name"
              placeholder="例如：示例科技有限公司"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="tax-id">统一社会信用代码（选填）</Label>
            <Input
              id="tax-id"
              placeholder="例如：91110000XXXXXXXXXX"
              value={taxId}
              onChange={(e) => setTaxId(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            />
          </div>
        </div>

        <DialogFooter>
          <Button 
            onClick={handleCreate} 
            disabled={creating || !companyName.trim()}
            className="w-full"
          >
            {creating ? "创建中..." : "创建公司并开始使用"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
