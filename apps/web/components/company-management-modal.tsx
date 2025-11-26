"use client"

import { useState, useEffect } from "react"
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

interface Company {
  id: string
  name: string
  tax_id: string | null
  currency: string
}

interface CompanyManagementModalProps {
  isOpen: boolean
  onClose: () => void
  company?: Company | null
  onSuccess: () => void
}

export function CompanyManagementModal({ 
  isOpen, 
  onClose, 
  company, 
  onSuccess 
}: CompanyManagementModalProps) {
  const [name, setName] = useState("")
  const [taxId, setTaxId] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen) {
      if (company) {
        setName(company.name)
        setTaxId(company.tax_id || "")
      } else {
        setName("")
        setTaxId("")
      }
    }
  }, [isOpen, company])

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.error("请输入公司名称")
      return
    }

    setLoading(true)
    try {
      if (company) {
        // Update existing company
        const { error } = await supabase
          .from("companies")
          .update({
            name,
            tax_id: taxId || null,
            updated_at: new Date().toISOString()
          })
          .eq("id", company.id)

        if (error) throw error
        toast.success("公司信息已更新")
      } else {
        // Create new company
        const { error } = await supabase
          .from("companies")
          .insert({
            name,
            tax_id: taxId || null,
            currency: "CNY"
          })

        if (error) throw error
        toast.success("公司创建成功")
      }

      onSuccess()
      onClose()
    } catch (error) {
      console.error("Error saving company:", error)
      toast.error("保存失败，请重试")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{company ? "编辑公司" : "添加新公司"}</DialogTitle>
          <DialogDescription>
            {company ? "修改公司基本信息。" : "创建一个新的公司主体来管理独立的财务数据。"}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">
              公司名称 <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              placeholder="例如：示例科技有限公司"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="tax-id">统一社会信用代码（选填）</Label>
            <Input
              id="tax-id"
              placeholder="例如：91110000XXXXXXXXXX"
              value={taxId}
              onChange={(e) => setTaxId(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            取消
          </Button>
          <Button onClick={handleSubmit} disabled={loading || !name.trim()}>
            {loading ? "保存中..." : "保存"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
