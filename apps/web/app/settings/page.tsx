"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useCompany } from "@/lib/company-context"
import { Plus, Pencil, Trash2, Building2 } from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { CompanyManagementModal } from "@/components/company-management-modal"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LLMConfigTab } from "@/components/settings/llm-config-tab"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"

interface Company {
  id: string
  name: string
  tax_id: string | null
  currency: string
}

export default function SettingsPage() {
  const { companies, selectedCompany, refreshCompanies, selectCompany } = useCompany()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCompany, setEditingCompany] = useState<Company | null>(null)
  const [deletingCompany, setDeletingCompany] = useState<Company | null>(null)

  const handleAdd = () => {
    setEditingCompany(null)
    setIsModalOpen(true)
  }

  const handleEdit = (company: Company) => {
    setEditingCompany(company)
    setIsModalOpen(true)
  }

  const handleDeleteClick = (company: Company) => {
    setDeletingCompany(company)
  }

  const handleConfirmDelete = async () => {
    if (!deletingCompany) return

    try {
      const { error } = await supabase
        .from("companies")
        .delete()
        .eq("id", deletingCompany.id)

      if (error) throw error

      toast.success("公司已删除")
      
      // If deleted company was selected, try to select another one
      if (selectedCompany?.id === deletingCompany.id) {
        const remainingCompanies = companies.filter(c => c.id !== deletingCompany.id)
        if (remainingCompanies.length > 0) {
          selectCompany(remainingCompanies[0].id)
        } else {
          // If no companies left, refresh will trigger InitialSetupModal (handled in layout/context)
          // But we should probably clear the selection
          localStorage.removeItem("selectedCompanyId")
          window.location.reload() // Force reload to trigger initial setup
          return
        }
      }

      await refreshCompanies()
    } catch (error) {
      console.error("Error deleting company:", error)
      toast.error("删除失败，请重试")
    } finally {
      setDeletingCompany(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">设置</h2>
      </div>
      
      <Tabs defaultValue="company" className="space-y-4">
        <TabsList>
          <TabsTrigger value="company">公司管理</TabsTrigger>
          <TabsTrigger value="llm">LLM 配置</TabsTrigger>
        </TabsList>

        <TabsContent value="company" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>公司管理</CardTitle>
                  <CardDescription>管理您的公司主体和基本信息。</CardDescription>
                </div>
                <Button onClick={handleAdd}>
                  <Plus className="mr-2 h-4 w-4" />
                  添加公司
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>公司名称</TableHead>
                    <TableHead>统一社会信用代码</TableHead>
                    <TableHead>基础货币</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {companies.map((company) => (
                    <TableRow key={company.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center">
                          <Building2 className="mr-2 h-4 w-4 text-muted-foreground" />
                          {company.name}
                          {selectedCompany?.id === company.id && (
                            <span className="ml-2 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                              当前使用
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{company.tax_id || "-"}</TableCell>
                      <TableCell>{company.currency}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleEdit(company)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            className="text-red-500 hover:text-red-600 hover:bg-red-50"
                            onClick={() => handleDeleteClick(company)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {companies.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                        暂无公司，请添加第一个公司。
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="llm">
          <LLMConfigTab />
        </TabsContent>
      </Tabs>

      <CompanyManagementModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        company={editingCompany}
        onSuccess={() => {
          refreshCompanies()
        }}
      />

      <AlertDialog open={!!deletingCompany} onOpenChange={(open) => !open && setDeletingCompany(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除公司？</AlertDialogTitle>
            <AlertDialogDescription>
              您正在删除 <strong>{deletingCompany?.name}</strong>。
              <br /><br />
              <span className="text-red-500 font-bold">警告：此操作不可撤销！</span>
              <br />
              删除公司将同时删除该名下的所有数据，包括：
              <ul className="list-disc list-inside mt-2">
                <li>所有上传的文档</li>
                <li>所有发票、合同、银行流水等业务数据</li>
                <li>所有相关的统计信息</li>
              </ul>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmDelete}
              className="bg-red-500 hover:bg-red-600"
            >
              确认删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
