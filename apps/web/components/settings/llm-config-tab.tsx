"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Loader2, Play, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface LLMProvider {
  id: string
  name: string
  base_url: string
  api_key: string // In real app, this might be masked
  is_active: boolean
  selected_model: string | null
}

const DEFAULT_PROVIDERS = [
  { name: "OpenRouter", base_url: "https://openrouter.ai/api/v1" },
  { name: "Google Gemini", base_url: "https://generativelanguage.googleapis.com/v1beta/openai/" },
  { name: "SiliconFlow", base_url: "https://api.siliconflow.cn/v1" },
]

export function LLMConfigTab() {
  const [providers, setProviders] = useState<LLMProvider[]>([])
  const [loading, setLoading] = useState(true)
  const [testingConnection, setTestingConnection] = useState(false)
  const [availableModels, setAvailableModels] = useState<string[]>([])
  
  // Edit/Add State
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingProvider, setEditingProvider] = useState<LLMProvider | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    base_url: "",
    api_key: "",
    selected_model: ""
  })

  const fetchProviders = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/llm/providers`)
      const json = await res.json()
      if (json.status === "success") {
        setProviders(json.data)
      }
    } catch (error) {
      console.error("Error fetching providers:", error)
      toast.error("获取供应商列表失败")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProviders()
  }, [])

  const handleEdit = (provider: LLMProvider) => {
    setEditingProvider(provider)
    setFormData({
      name: provider.name,
      base_url: provider.base_url,
      api_key: provider.api_key, // Note: This might be masked, user needs to re-enter if they want to change it
      selected_model: provider.selected_model || ""
    })
    setIsDialogOpen(true)
    setAvailableModels([]) // Reset models on open
  }

  const handleAdd = () => {
    setEditingProvider(null)
    setFormData({
      name: "OpenRouter",
      base_url: "https://openrouter.ai/api/v1",
      api_key: "",
      selected_model: ""
    })
    setIsDialogOpen(true)
    setAvailableModels([])
  }

  const handleTestConnection = async () => {
    if (!formData.api_key || !formData.base_url) {
      toast.error("请填写 API Key 和 Base URL")
      return
    }

    setTestingConnection(true)
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/llm/test`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          base_url: formData.base_url,
          api_key: formData.api_key
        })
      })
      
      const json = await res.json()
      if (res.ok && json.status === "success") {
        toast.success("连接成功！已获取模型列表")
        setAvailableModels(json.models)
        if (json.models.length > 0 && !formData.selected_model) {
          setFormData(prev => ({ ...prev, selected_model: json.models[0] }))
        }
      } else {
        toast.error(`连接失败: ${json.detail || "未知错误"}`)
      }
    } catch (error) {
      console.error("Test connection error:", error)
      toast.error("连接测试出错")
    } finally {
      setTestingConnection(false)
    }
  }

  const handleSave = async () => {
    try {
      const url = editingProvider 
        ? `${process.env.NEXT_PUBLIC_API_URL}/llm/providers/${editingProvider.id}`
        : `${process.env.NEXT_PUBLIC_API_URL}/llm/providers`
      
      const method = editingProvider ? "PUT" : "POST"
      
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      })
      
      const json = await res.json()
      if (res.ok) {
        toast.success("保存成功")
        setIsDialogOpen(false)
        fetchProviders()
      } else {
        toast.error(`保存失败: ${json.detail}`)
      }
    } catch (error) {
      console.error("Save error:", error)
      toast.error("保存出错")
    }
  }

  const handleActivate = async (id: string) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/llm/providers/${id}/activate`, {
        method: "POST"
      })
      if (res.ok) {
        toast.success("已切换激活的供应商")
        fetchProviders()
      } else {
        toast.error("切换失败")
      }
    } catch (error) {
      toast.error("切换出错")
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("确定要删除此配置吗？")) return
    
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/llm/providers/${id}`, {
        method: "DELETE"
      })
      if (res.ok) {
        toast.success("删除成功")
        fetchProviders()
      } else {
        const json = await res.json()
        toast.error(`删除失败: ${json.detail}`)
      }
    } catch {
      toast.error("删除出错")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">LLM 供应商配置</h3>
          <p className="text-sm text-muted-foreground">
            配置用于文档分析和数据提取的 AI 模型供应商。
          </p>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="mr-2 h-4 w-4" /> 添加供应商
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {providers.map((provider) => (
          <Card key={provider.id} className={provider.is_active ? "border-primary ring-1 ring-primary" : ""}>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  {provider.name}
                  {provider.is_active && <Badge variant="default" className="text-xs">Active</Badge>}
                </CardTitle>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(provider)}>
                    <span className="sr-only">Edit</span>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-4 w-4"
                    >
                      <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                      <path d="m15 5 4 4" />
                    </svg>
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => handleDelete(provider.id)}
                    disabled={provider.is_active}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <CardDescription className="truncate" title={provider.base_url}>
                {provider.base_url}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="text-sm">
                  <span className="text-muted-foreground">Model: </span>
                  <span className="font-medium">{provider.selected_model || "Not selected"}</span>
                </div>
                {!provider.is_active && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full mt-2"
                    onClick={() => handleActivate(provider.id)}
                  >
                    Activate
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
        
        {providers.length === 0 && !loading && (
          <div className="col-span-full text-center py-12 border rounded-lg border-dashed text-muted-foreground">
            暂无配置，请添加一个 LLM 供应商。
          </div>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingProvider ? "编辑供应商" : "添加供应商"}</DialogTitle>
            <DialogDescription>
              配置 API 连接信息。建议先测试连接以获取可用模型列表。
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">供应商名称</Label>
              <Input 
                id="name" 
                value={formData.name} 
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="例如：OpenRouter" 
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="base_url">Base URL</Label>
              <div className="flex gap-2">
                <Input 
                  id="base_url" 
                  value={formData.base_url} 
                  onChange={(e) => setFormData({...formData, base_url: e.target.value})}
                  placeholder="https://..." 
                  className="flex-1"
                />
                <Select 
                  onValueChange={(val) => {
                    const preset = DEFAULT_PROVIDERS.find(p => p.base_url === val)
                    if (preset) {
                      setFormData(prev => ({ ...prev, base_url: val, name: preset.name }))
                    }
                  }}
                >
                  <SelectTrigger className="w-[100px]">
                    <SelectValue placeholder="预设" />
                  </SelectTrigger>
                  <SelectContent>
                    {DEFAULT_PROVIDERS.map(p => (
                      <SelectItem key={p.base_url} value={p.base_url}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="api_key">API Key</Label>
              <Input 
                id="api_key" 
                type="password"
                value={formData.api_key} 
                onChange={(e) => setFormData({...formData, api_key: e.target.value})}
                placeholder="sk-..." 
              />
            </div>

            <div className="flex justify-end">
              <Button 
                type="button" 
                variant="secondary" 
                size="sm" 
                onClick={handleTestConnection}
                disabled={testingConnection || !formData.api_key}
              >
                {testingConnection ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}
                测试连接 & 获取模型
              </Button>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="model">选择模型</Label>
              {availableModels.length > 0 ? (
                <Select 
                  value={formData.selected_model} 
                  onValueChange={(val) => setFormData({...formData, selected_model: val})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择模型" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableModels.map(m => (
                      <SelectItem key={m} value={m}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input 
                  id="model" 
                  value={formData.selected_model} 
                  onChange={(e) => setFormData({...formData, selected_model: e.target.value})}
                  placeholder="手动输入模型名称或先测试连接" 
                />
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>取消</Button>
            <Button onClick={handleSave} disabled={!formData.name || !formData.base_url}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
