"use client"

import { useCompany } from "@/lib/company-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, FileInput, Landmark, Users, Upload, Loader2, Eye, RefreshCw, Trash2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
import { ExtractionReviewModal } from "@/components/extraction-review-modal"

export default function DashboardPage() {
  const { selectedCompany } = useCompany()
  const [uploading, setUploading] = useState(false)
  const [documents, setDocuments] = useState<any[]>([])
  const [loadingDocs, setLoadingDocs] = useState(false)
  const [selectedDoc, setSelectedDoc] = useState<any>(null)
  const [viewerOpen, setViewerOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [docToDelete, setDocToDelete] = useState<any>(null)
  const [reviewModalOpen, setReviewModalOpen] = useState(false)
  const [docToReview, setDocToReview] = useState<string | null>(null)
  const [statistics, setStatistics] = useState({
    invoices: 0,
    contracts: 0,
    bankStatements: 0,
    payrollRecords: 0
  })

  const fetchStatistics = async () => {
    if (!selectedCompany) return
    
    try {
      const [invoices, contracts, bankStatements, payrollRecords] = await Promise.all([
        supabase.from("invoices").select("id", { count: "exact", head: true }).eq("company_id", selectedCompany.id),
        supabase.from("contracts").select("id", { count: "exact", head: true }).eq("company_id", selectedCompany.id),
        supabase.from("bank_statements").select("id", { count: "exact", head: true }).eq("company_id", selectedCompany.id),
        supabase.from("payroll_records").select("id", { count: "exact", head: true }).eq("company_id", selectedCompany.id),
      ])

      setStatistics({
        invoices: invoices.count || 0,
        contracts: contracts.count || 0,
        bankStatements: bankStatements.count || 0,
        payrollRecords: payrollRecords.count || 0
      })
    } catch (error) {
      console.error("Error fetching statistics:", error)
    }
  }

  const fetchDocuments = async () => {
    if (!selectedCompany) return
    setLoadingDocs(true)
    try {
      const { data, error } = await supabase
        .from("documents")
        .select("*")
        .eq("company_id", selectedCompany.id)
        .order("created_at", { ascending: false })
        .limit(20)
      
      if (error) throw error
      setDocuments(data || [])
    } catch (error) {
      console.error("Error fetching documents:", error)
    } finally {
      setLoadingDocs(false)
    }
  }

  useEffect(() => {
    fetchDocuments()
    fetchStatistics()
  }, [selectedCompany])

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedCompany || !e.target.files?.[0]) return
    
    setUploading(true)
    const file = e.target.files[0]
    
    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("company_id", selectedCompany.id)
      
      const uploadResponse = await fetch("http://127.0.0.1:8000/documents/upload", {
        method: "POST",
        body: formData,
      })
      
      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json()
        throw new Error(errorData.detail || "Upload failed")
      }
      
      const uploadResult = await uploadResponse.json()
      const documentId = uploadResult.document.id
      
      toast.success("文件上传成功！正在AI解析...")
      
      const parseResponse = await fetch(`http://127.0.0.1:8000/documents/${documentId}/parse`, {
        method: "POST",
      })
      
      if (!parseResponse.ok) {
        toast.warning("上传成功，但AI解析启动失败")
      } else {
        toast.success("AI正在解析文档，请等待审核提示...")
      }
      
      setTimeout(() => {
        fetchDocuments()
      }, 2000)
      
      e.target.value = ""
      
    } catch (error: any) {
      console.error("Upload error:", error)
      toast.error(`上传失败: ${error.message}`)
    } finally {
      setUploading(false)
    }
  }

  const handleReviewDocument = (doc: any) => {
    setDocToReview(doc.id)
    setReviewModalOpen(true)
  }

  const handleViewDocument = (doc: any) => {
    setSelectedDoc(doc)
    setViewerOpen(true)
  }

  const confirmDeleteDocument = (doc: any) => {
    setDocToDelete(doc)
    setDeleteDialogOpen(true)
  }

  const handleDeleteDocument = async () => {
    if (!docToDelete) return
    
    try {
      const tablesToCheck = ['invoices', 'contracts', 'bank_statements', 'payroll_records', 'extraction_results']
      
      for (const table of tablesToCheck) {
        const { error } = await supabase
          .from(table)
          .delete()
          .eq('document_id', docToDelete.id)
        
        if (error && error.code !== 'PGRST116') {
          console.error(`Error deleting from ${table}:`, error)
        }
      }
      
      const { error: docError } = await supabase
        .from("documents")
        .delete()
        .eq("id", docToDelete.id)
      
      if (docError) throw docError
      
      setDocuments(documents.filter(doc => doc.id !== docToDelete.id))
      fetchStatistics()
      toast.success("文档及关联数据已删除")
    } catch (error) {
      console.error("Delete error:", error)
      toast.error("删除失败")
    } finally {
      setDeleteDialogOpen(false)
      setDocToDelete(null)
    }
  }

  const getFileUrl = (storagePath: string) => {
    const { data } = supabase.storage.from('raw-files').getPublicUrl(storagePath)
    return data.publicUrl
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "uploaded":
        return <span className="text-blue-600">📤 已上传</span>
      case "processing":
        return <span className="text-yellow-600">⚙️ 解析中...</span>
      case "extracted":
        return <span className="text-orange-600 font-medium">⏳ 待审核</span>
      case "parsed":
        return <span className="text-green-600">✓ 已完成</span>
      case "error":
        return <span className="text-red-600">❌ 错误</span>
      default:
        return <span>{status}</span>
    }
  }

  const pendingReviewDocs = documents.filter(doc => doc.status === "extracted")

  if (!selectedCompany) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold text-muted-foreground">欢迎使用 FinSight AI</h2>
          <p className="text-muted-foreground">请选择或创建一个公司以开始使用</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">仪表板</h2>
          <p className="text-muted-foreground">欢迎使用 {selectedCompany.name}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => { fetchDocuments(); fetchStatistics(); }} size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            刷新
          </Button>
          <input
            type="file"
            id="file-upload"
            className="hidden"
            onChange={handleFileUpload}
            accept=".pdf,.jpg,.jpeg,.png,.xlsx,.csv"
          />
          <Button asChild disabled={uploading}>
            <label htmlFor="file-upload" className="cursor-pointer">
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  上传中...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  上传文档
                </>
              )}
            </label>
          </Button>
        </div>
      </div>

      {/* Pending Review Alert */}
      {pendingReviewDocs.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-700">
              <AlertCircle className="h-5 w-5" />
              待审核文档 ({pendingReviewDocs.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-orange-600 mb-3">
              以下文档已完成AI提取，请审核数据准确性后批准保存：
            </p>
            <div className="space-y-2">
              {pendingReviewDocs.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-3 bg-white border border-orange-200 rounded-lg">
                  <div>
                    <p className="font-medium">{doc.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(doc.created_at).toLocaleString("zh-CN")}
                    </p>
                  </div>
                  <Button 
                    onClick={() => handleReviewDocument(doc)}
                    className="bg-orange-600 hover:bg-orange-700"
                  >
                    立即审核
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">发票</CardTitle>
            <FileText className="h-4 w-4 text-violet-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.invoices}</div>
            <p className="text-xs text-muted-foreground">总记录数</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">合同</CardTitle>
            <FileInput className="h-4 w-4 text-pink-700" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.contracts}</div>
            <p className="text-xs text-muted-foreground">总记录数</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">银行流水</CardTitle>
            <Landmark className="h-4 w-4 text-orange-700" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.bankStatements}</div>
            <p className="text-xs text-muted-foreground">总交易数</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">工资单</CardTitle>
            <Users className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.payrollRecords}</div>
            <p className="text-xs text-muted-foreground">总记录数</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>所有文档</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingDocs ? (
            <div className="flex justify-center p-4">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : documents.length === 0 ? (
            <p className="text-sm text-muted-foreground">暂无文档</p>
          ) : (
            <div className="space-y-2">
              {documents.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-slate-50">
                  <div className="flex-1">
                    <p className="font-medium">{doc.name}</p>
                    <div className="flex gap-4 text-xs text-muted-foreground mt-1">
                      <span>状态: {getStatusBadge(doc.status)}</span>
                      {doc.error_message && (
                        <span className="text-red-600">错误: {doc.error_message}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {new Date(doc.created_at).toLocaleString("zh-CN")}
                    </span>
                    {doc.status === "extracted" && (
                      <Button 
                        size="sm"
                        onClick={() => handleReviewDocument(doc)}
                        className="bg-orange-600 hover:bg-orange-700"
                      >
                        审核
                      </Button>
                    )}
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleViewDocument(doc)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => confirmDeleteDocument(doc)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={viewerOpen} onOpenChange={setViewerOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>{selectedDoc?.name}</DialogTitle>
          </DialogHeader>
          <div className="overflow-auto">
            {selectedDoc && (
              <div className="space-y-4">
                <div className="text-sm">
                  <p><strong>状态:</strong> {selectedDoc.status}</p>
                  <p><strong>文件类型:</strong> {selectedDoc.file_type}</p>
                  {selectedDoc.error_message && (
                    <p className="text-red-600"><strong>错误信息:</strong> {selectedDoc.error_message}</p>
                  )}
                </div>
                {selectedDoc.storage_path && (
                  <div>
                    <p className="text-sm font-medium mb-2">文件预览:</p>
                    {selectedDoc.file_type?.startsWith('image/') ? (
                      <img 
                        src={getFileUrl(selectedDoc.storage_path)} 
                        alt={selectedDoc.name}
                        className="max-w-full h-auto border rounded"
                      />
                    ) : selectedDoc.file_type === 'application/pdf' ? (
                      <iframe 
                        src={getFileUrl(selectedDoc.storage_path)}
                        className="w-full h-[500px] border rounded"
                      />
                    ) : (
                      <a 
                        href={getFileUrl(selectedDoc.storage_path)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        点击查看文件
                      </a>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除文档</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除文档 "{docToDelete?.name}" 吗？
              <span className="block mt-2 text-orange-600 font-medium">
                ⚠️ 警告：此操作将同时删除所有从该文档提取的数据（发票、合同等），且无法撤销。
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteDocument} className="bg-red-600 hover:bg-red-700">
              确认删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {docToReview && (
        <ExtractionReviewModal
          documentId={docToReview}
          open={reviewModalOpen}
          onClose={() => {
            setReviewModalOpen(false)
            setDocToReview(null)
          }}
          onApproved={() => {
            fetchDocuments()
            fetchStatistics()
            toast.success("数据已保存到数据库！")
          }}
        />
      )}
    </div>
  )
}
