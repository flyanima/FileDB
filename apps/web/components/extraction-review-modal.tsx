"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, CheckCircle, ExternalLink, Eye, EyeOff } from "lucide-react"
import { toast } from "sonner"
import { supabase } from "@/lib/supabase"

interface ExtractionReviewModalProps {
  documentId: string
  open: boolean
  onClose: () => void
  onApproved: () => void
}

export function ExtractionReviewModal({ documentId, open, onClose, onApproved }: ExtractionReviewModalProps) {
  const [loading, setLoading] = useState(true)
  const [approving, setApproving] = useState(false)
  const [extraction, setExtraction] = useState<any>(null)
  const [editedData, setEditedData] = useState<any>({})
  const [document, setDocument] = useState<any>(null)
  const [showPreview, setShowPreview] = useState(true)

  useEffect(() => {
    if (open && documentId) {
      fetchExtractionResult()
      fetchDocument()
    }
  }, [open, documentId])

  const fetchDocument = async () => {
    try {
      const { data, error } = await supabase
        .from("documents")
        .select("*")
        .eq("id", documentId)
        .single()
      
      if (error) throw error
      setDocument(data)
    } catch (error) {
      console.error("Error fetching document:", error)
    }
  }

  const fetchExtractionResult = async () => {
    setLoading(true)
    try {
      const response = await fetch(`http://127.0.0.1:8000/documents/${documentId}/extraction`)
      
      if (!response.ok) {
        throw new Error("No extraction result found")
      }
      
      const result = await response.json()
      setExtraction(result.extraction)
      setEditedData(result.extraction.extracted_data)
    } catch (error: any) {
      console.error("Error fetching extraction:", error)
      toast.error("无法获取提取结果")
      onClose()
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async () => {
    setApproving(true)
    try {
      const response = await fetch("http://127.0.0.1:8000/extractions/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          extraction_id: extraction.id,
          user_corrections: editedData
        })
      })
      
      if (!response.ok) {
        throw new Error("Approval failed")
      }
      
      toast.success("数据已批准并保存！")
      onApproved()
      onClose()
    } catch (error) {
      console.error("Approval error:", error)
      toast.error("批准失败")
    } finally {
      setApproving(false)
    }
  }

  const handleFieldChange = (field: string, value: any) => {
    setEditedData({ ...editedData, [field]: value })
  }

  const getFileUrl = (storagePath: string) => {
    const { data } = supabase.storage.from('raw-files').getPublicUrl(storagePath)
    return data.publicUrl
  }

  const renderContractFields = () => (
    <div className="grid grid-cols-2 gap-4">
      <div>
        <Label>合同编号</Label>
        <Input
          value={editedData.contract_no || ""}
          onChange={(e) => handleFieldChange("contract_no", e.target.value)}
        />
      </div>
      <div>
        <Label>合同标题</Label>
        <Input
          value={editedData.title || ""}
          onChange={(e) => handleFieldChange("title", e.target.value)}
        />
      </div>
      <div>
        <Label>甲方</Label>
        <Input
          value={editedData.party_a || ""}
          onChange={(e) => handleFieldChange("party_a", e.target.value)}
        />
      </div>
      <div>
        <Label>乙方</Label>
        <Input
          value={editedData.party_b || ""}
          onChange={(e) => handleFieldChange("party_b", e.target.value)}
        />
      </div>
      <div>
        <Label>合同金额</Label>
        <Input
          type="number"
          value={editedData.total_amount || ""}
          onChange={(e) => handleFieldChange("total_amount", e.target.value)}
        />
      </div>
      <div>
        <Label>合同类型</Label>
        <Input
          value={editedData.contract_type || ""}
          onChange={(e) => handleFieldChange("contract_type", e.target.value)}
        />
      </div>
      <div>
        <Label>开始日期</Label>
        <Input
          type="date"
          value={editedData.start_date || ""}
          onChange={(e) => handleFieldChange("start_date", e.target.value)}
        />
      </div>
      <div>
        <Label>结束日期</Label>
        <Input
          type="date"
          value={editedData.end_date || ""}
          onChange={(e) => handleFieldChange("end_date", e.target.value)}
        />
      </div>
    </div>
  )

  const renderInvoiceFields = () => (
    <div className="grid grid-cols-2 gap-4">
      <div>
        <Label>发票代码</Label>
        <Input
          value={editedData.invoice_code || ""}
          onChange={(e) => handleFieldChange("invoice_code", e.target.value)}
        />
      </div>
      <div>
        <Label>发票号码</Label>
        <Input
          value={editedData.invoice_number || ""}
          onChange={(e) => handleFieldChange("invoice_number", e.target.value)}
        />
      </div>
      <div>
        <Label>价税合计</Label>
        <Input
          type="number"
          value={editedData.total_amount_tax_included || ""}
          onChange={(e) => handleFieldChange("total_amount_tax_included", e.target.value)}
        />
      </div>
    </div>
  )

  const renderFields = () => {
    if (!extraction) return null

    switch (extraction.doc_type) {
      case "contract":
        return renderContractFields()
      case "invoice":
        return renderInvoiceFields()
      default:
        return (
          <div className="text-sm text-muted-foreground">
            文档类型: {extraction.doc_type}
            <pre className="mt-2 p-2 bg-slate-100 rounded text-xs overflow-auto max-h-60">
              {JSON.stringify(editedData, null, 2)}
            </pre>
          </div>
        )
    }
  }

  const openInNewTab = () => {
    if (document?.storage_path) {
      const fileUrl = getFileUrl(document.storage_path)
      window.open(fileUrl, '_blank')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle>审核AI提取结果</DialogTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPreview(!showPreview)}
              >
                {showPreview ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
                {showPreview ? '隐藏预览' : '显示预览'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={openInNewTab}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                新窗口打开
              </Button>
            </div>
          </div>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <div className={`grid gap-6 flex-1 overflow-hidden ${showPreview ? 'grid-cols-2' : 'grid-cols-1'}`}>
            {/* Left: Document Preview */}
            {showPreview && (
              <div className="border rounded-lg p-4 overflow-hidden flex flex-col">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold">原始文档</h3>
                  <p className="text-xs text-muted-foreground">
                    💡 建议：点击"新窗口打开"以便放大查看细节
                  </p>
                </div>
                {document && document.storage_path ? (
                  <div className="border rounded overflow-auto flex-1">
                    {(() => {
                      const fileUrl = getFileUrl(document.storage_path)
                      const fileName = document.name?.toLowerCase() || ''
                      const fileType = document.file_type?.toLowerCase() || ''
                      
                      console.log('Document preview:', { fileName, fileType, fileUrl })
                      
                      // Check by file extension or MIME type
                      const isPdf = fileName.endsWith('.pdf') || fileType.includes('pdf')
                      const isImage = fileName.match(/\.(jpg|jpeg|png|gif|webp)$/i) || fileType.startsWith('image/')
                      
                      if (isImage) {
                        return (
                          <img 
                            src={fileUrl} 
                            alt={document.name}
                            className="w-full h-auto cursor-pointer"
                            onClick={openInNewTab}
                            title="点击在新窗口打开"
                          />
                        )
                      } else if (isPdf) {
                        return (
                          <iframe 
                            src={fileUrl}
                            className="w-full h-full min-h-[600px]"
                            title={document.name}
                          />
                        )
                      } else {
                        return (
                          <div className="p-4 text-center text-muted-foreground">
                            <p>无法预览此文件类型</p>
                            <p className="text-xs mt-2">文件类型: {fileType || '未知'}</p>
                            <a 
                              href={fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline text-sm mt-2 inline-block"
                            >
                              点击下载查看
                            </a>
                          </div>
                        )
                      }
                    })()}
                  </div>
                ) : (
                  <div className="p-4 text-center text-muted-foreground">
                    文档加载中...
                  </div>
                )}
              </div>
            )}

            {/* Right: Extracted Data */}
            <div className="border rounded-lg p-4 overflow-y-auto">
              <h3 className="font-semibold mb-4">提取的数据（可编辑）</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium">文档类型:</span>
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">
                    {extraction?.doc_type === 'contract' ? '合同' :
                     extraction?.doc_type === 'invoice' ? '发票' :
                     extraction?.doc_type === 'bank_statement' ? '银行流水' :
                     extraction?.doc_type === 'payroll_record' ? '工资单' :
                     extraction?.doc_type}
                  </span>
                </div>
                
                {renderFields()}

                <div className="pt-4 border-t">
                  <p className="text-sm text-muted-foreground mb-2">
                    💡 提示：请仔细核对提取的数据，如有错误请直接修改后点击"批准并保存"
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={approving}>
            取消
          </Button>
          <Button 
            onClick={handleApprove} 
            disabled={loading || approving}
            className="bg-green-600 hover:bg-green-700"
          >
            {approving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                保存中...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                批准并保存
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
