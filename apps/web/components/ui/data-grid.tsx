"use client"

import React, { useState, useEffect } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Loader2, Save, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { supabase } from "@/lib/supabase"
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

interface Column {
  key: string
  label: string
  editable?: boolean
  type?: "text" | "number" | "date"
}

interface DataGridProps {
  tableName: string
  columns: Column[]
  companyId: string | undefined
  onRowClick?: (row: any) => void
}

export function DataGrid({ tableName, columns, companyId, onRowClick }: DataGridProps) {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValues, setEditValues] = useState<any>({})
  const [saving, setSaving] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [rowToDelete, setRowToDelete] = useState<any>(null)

  const fetchData = async () => {
    if (!companyId) return
    setLoading(true)
    try {
      const { data: rows, error } = await supabase
        .from(tableName)
        .select("*")
        .eq("company_id", companyId)
        .order("created_at", { ascending: false })
      
      if (error) throw error
      setData(rows || [])
    } catch (error) {
      console.error("Error fetching data:", error)
      toast.error("获取数据失败")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [companyId, tableName])

  const handleEdit = (row: any) => {
    setEditingId(row.id)
    setEditValues(row)
  }

  const handleSave = async () => {
    if (!editingId) return
    setSaving(true)
    try {
      const { error } = await supabase
        .from(tableName)
        .update(editValues)
        .eq("id", editingId)
      
      if (error) throw error
      
      setData(data.map(row => row.id === editingId ? { ...row, ...editValues } : row))
      setEditingId(null)
      toast.success("保存成功")
    } catch (error) {
      console.error("Error saving:", error)
      toast.error("保存失败")
    } finally {
      setSaving(false)
    }
  }

  const confirmDelete = (row: any) => {
    setRowToDelete(row)
    setDeleteDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!rowToDelete) return
    
    try {
      // If this row has a document_id, also delete the document
      if (rowToDelete.document_id) {
        const { error: docError } = await supabase
          .from("documents")
          .delete()
          .eq("id", rowToDelete.document_id)
        
        if (docError) {
          console.error("Error deleting document:", docError)
          // Continue with row deletion even if document deletion fails
        }
      }
      
      // Delete the row
      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq("id", rowToDelete.id)
      
      if (error) throw error
      
      setData(data.filter(row => row.id !== rowToDelete.id))
      toast.success("删除成功")
    } catch (error) {
      console.error("Error deleting:", error)
      toast.error("删除失败")
    } finally {
      setDeleteDialogOpen(false)
      setRowToDelete(null)
    }
  }

  const handleAddRow = async () => {
    if (!companyId) return
    try {
      const newRow = {
        company_id: companyId,
      }
      const { data: inserted, error } = await supabase
        .from(tableName)
        .insert(newRow)
        .select()
        .single()
      
      if (error) throw error
      
      setData([inserted, ...data])
      setEditingId(inserted.id)
      setEditValues(inserted)
      toast.success("已添加新行")
    } catch (error) {
      console.error("Error adding row:", error)
      toast.error("添加失败")
    }
  }

  if (loading) {
    return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={handleAddRow} size="sm">
          <Plus className="h-4 w-4 mr-2" /> 添加行
        </Button>
      </div>
      <div className="rounded-md border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((col) => (
                <TableHead key={col.key}>{col.label}</TableHead>
              ))}
              <TableHead className="w-[150px]">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length + 1} className="text-center h-24 text-muted-foreground">
                  暂无数据。上传文档后，AI会自动提取数据到此表格。
                </TableCell>
              </TableRow>
            ) : (
              data.map((row) => (
                <TableRow key={row.id} onClick={() => !editingId && onRowClick && onRowClick(row)}>
                  {columns.map((col) => (
                    <TableCell key={col.key}>
                      {editingId === row.id && col.editable ? (
                        <Input
                          value={editValues[col.key] || ""}
                          onChange={(e) => setEditValues({ ...editValues, [col.key]: e.target.value })}
                          type={col.type || "text"}
                          className="h-8"
                        />
                      ) : (
                        <span className={editingId === row.id ? "text-muted-foreground" : ""}>
                          {row[col.key] || "-"}
                        </span>
                      )}
                    </TableCell>
                  ))}
                  <TableCell>
                    <div className="flex gap-2">
                      {editingId === row.id ? (
                        <Button size="sm" onClick={handleSave} disabled={saving}>
                          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                        </Button>
                      ) : (
                        <>
                          <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); handleEdit(row); }}>
                            编辑
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            onClick={(e) => { e.stopPropagation(); confirmDelete(row); }}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除这条记录吗？此操作无法撤销。
              {rowToDelete?.document_id && (
                <span className="block mt-2 text-orange-600">
                  注意：关联的文档也将被删除。
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
