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
import { Loader2, Save, Plus, Trash2, FileDown, FileUp, FileSpreadsheet } from "lucide-react"
import { toast } from "sonner"
import { supabase } from "@/lib/supabase"
import { exportToExcel, exportToCSV, generateTemplate, parseExcelFile, validateRow, mapImportedData } from "@/lib/excel-utils"
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
  
  // Import/Export states
  const [importDialogOpen, setImportDialogOpen] = useState(false)
  const [importPreviewData, setImportPreviewData] = useState<any[]>([])
  const [importing, setImporting] = useState(false)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

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

  // Export handlers
  const handleExportExcel = () => {
    exportToExcel(data, columns, tableName)
    toast.success("已导出到 Excel")
  }

  const handleExportCSV = () => {
    exportToCSV(data, columns, tableName)
    toast.success("已导出到 CSV")
  }

  const handleDownloadTemplate = () => {
    generateTemplate(columns, tableName)
    toast.success("模板已下载")
  }

  // Import handlers
  const handleImportClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const parsedData = await parseExcelFile(file)
      
      // Validate and show preview
      const validRows: any[] = []
      const errors: string[] = []

      parsedData.forEach((row, index) => {
        const validation = validateRow(row, columns)
        if (validation.valid) {
          validRows.push(row)
        } else {
          errors.push(`Row ${index + 1}: ${validation.errors.join(', ')}`)
        }
      })

      if (errors.length > 0) {
        console.warn("Import validation errors:", errors)
        toast.warning(`${errors.length} 行数据存在问题,将被跳过`)
      }

      setImportPreviewData(validRows)
      setImportDialogOpen(true)
    } catch (error) {
      console.error("Error parsing file:", error)
      toast.error("文件解析失败,请检查文件格式")
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleConfirmImport = async () => {
    if (!companyId) return
    
    setImporting(true)
    try {
      // Map imported data to database columns
      const mappedData = mapImportedData(importPreviewData, columns)
      
      // Add company_id to each row
      const dataToInsert = mappedData.map(row => ({
        ...row,
        company_id: companyId
      }))

      // Batch insert
      const { error } = await supabase
        .from(tableName)
        .insert(dataToInsert)

      if (error) throw error

      toast.success(`成功导入 ${dataToInsert.length} 条数据`)
      setImportDialogOpen(false)
      setImportPreviewData([])
      fetchData() // Refresh data
    } catch (error) {
      console.error("Error importing data:", error)
      toast.error("导入失败,请重试")
    } finally {
      setImporting(false)
    }
  }

  if (loading) {
    return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          <Button onClick={handleExportExcel} size="sm" variant="outline">
            <FileDown className="h-4 w-4 mr-2" /> 导出 Excel
          </Button>
          <Button onClick={handleExportCSV} size="sm" variant="outline">
            <FileDown className="h-4 w-4 mr-2" /> 导出 CSV
          </Button>
          <Button onClick={handleDownloadTemplate} size="sm" variant="outline">
            <FileSpreadsheet className="h-4 w-4 mr-2" /> 下载模板
          </Button>
          <Button onClick={handleImportClick} size="sm" variant="outline">
            <FileUp className="h-4 w-4 mr-2" /> 导入数据
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
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

      {/* Import Preview Dialog */}
      <AlertDialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <AlertDialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <AlertDialogHeader>
            <AlertDialogTitle>导入数据预览</AlertDialogTitle>
            <AlertDialogDescription>
              将导入 {importPreviewData.length} 条数据。请确认数据正确后点击&ldquo;确认导入&rdquo;。
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="my-4">
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    {columns.map((col) => (
                      <TableHead key={col.key}>{col.label}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {importPreviewData.slice(0, 10).map((row, index) => (
                    <TableRow key={index}>
                      {columns.map((col) => (
                        <TableCell key={col.key}>
                          {row[col.label] || '-'}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {importPreviewData.length > 10 && (
              <p className="text-sm text-muted-foreground mt-2">
                仅显示前 10 条数据,共 {importPreviewData.length} 条
              </p>
            )}
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={importing}>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmImport} disabled={importing}>
              {importing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  导入中...
                </>
              ) : (
                '确认导入'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
