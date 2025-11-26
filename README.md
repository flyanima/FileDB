# FinSight AI - 智能财务文档管理系统

基于 AI 的财务文档智能解析和管理平台,支持发票、合同、银行流水、工资单等多种财务文档的自动识别和数据提取。

## 功能特性

### ✅ 已实现功能

- **多公司管理** - 支持多个公司主体,数据完全隔离
- **智能文档解析** - 基于 LLM 的 OCR 和数据提取
- **人工审核机制** - 提取结果人工确认后入库
- **数据表格管理** - 发票、合同、银行流水、工资单的 CRUD 操作
- **Excel/CSV 导入导出** - 批量数据导入导出,支持模板下载
- **LLM 配置管理** - 支持多个 AI 提供商(OpenRouter、Gemini、SiliconFlow)

### 🚧 开发中功能

- 智能匹配与校验
- 工资单生成
- 向量化管理
- MCP 服务集成

## 技术栈

### 前端
- **框架**: Next.js 16 + React 19
- **样式**: TailwindCSS 4
- **UI 组件**: Radix UI
- **状态管理**: React Context
- **表格处理**: xlsx (SheetJS)

### 后端
- **框架**: FastAPI (Python)
- **数据库**: Supabase (PostgreSQL)
- **AI 服务**: OpenRouter / Gemini / SiliconFlow
- **文件存储**: Supabase Storage

## 快速开始

### 1. 环境要求

- Node.js 20+
- Python 3.11+
- Supabase 账号(或本地 Supabase)

### 2. 克隆项目

\`\`\`bash
git clone https://github.com/flyanima/FileDB.git
cd FileDB
\`\`\`

### 3. 配置环境变量

#### 前端配置

复制环境变量模板:
\`\`\`bash
cd apps/web
cp .env.example .env.local
\`\`\`

编辑 \`.env.local\` 填入你的 Supabase 配置:
\`\`\`env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
\`\`\`

#### 后端配置

创建 \`.env\` 文件:
\`\`\`bash
cd apps/api
cp .env.example .env
\`\`\`

填入配置:
\`\`\`env
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_supabase_service_key
OPENROUTER_API_KEY=your_openrouter_key  # 可选,可在界面配置
\`\`\`

### 4. 数据库初始化

运行 Supabase 迁移:
\`\`\`bash
cd supabase
supabase db reset
\`\`\`

### 5. 安装依赖

#### 前端
\`\`\`bash
cd apps/web
npm install
\`\`\`

#### 后端
\`\`\`bash
cd apps/api
pip install -r requirements.txt
\`\`\`

### 6. 启动服务

#### 启动前端
\`\`\`bash
cd apps/web
npm run dev
\`\`\`

访问: http://localhost:3000

#### 启动后端
\`\`\`bash
cd apps/api
uvicorn main:app --reload --port 8000
\`\`\`

API 文档: http://localhost:8000/docs

## 使用指南

### 初次使用

1. 访问 http://localhost:3000
2. 创建第一个公司
3. 前往"设置"页面配置 LLM 提供商
4. 上传文档开始使用

### 数据导入导出

1. **导出数据**: 点击"导出 Excel"或"导出 CSV"
2. **下载模板**: 点击"下载模板"获取预配置的 Excel 模板
3. **导入数据**: 填写模板后点击"导入数据",系统会自动验证并预览

### LLM 配置

1. 前往"设置" → "LLM 配置"
2. 点击"添加供应商"
3. 选择预设(OpenRouter/Gemini/SiliconFlow)或自定义
4. 输入 API Key
5. 点击"测试连接 & 获取模型"
6. 选择模型并保存
7. 点击"Activate"激活该供应商

## 项目结构

\`\`\`
FileDB/
├── apps/
│   ├── web/              # Next.js 前端
│   │   ├── app/          # 页面路由
│   │   ├── components/   # React 组件
│   │   └── lib/          # 工具函数
│   └── api/              # FastAPI 后端
│       ├── routers/      # API 路由
│       └── services/     # 业务逻辑
├── supabase/
│   └── migrations/       # 数据库迁移
└── README.md
\`\`\`

## 开发路线图

- [x] Priority 1: 多公司管理
- [x] Priority 2: LLM 配置管理
- [x] Priority 3: 数据表格增强(导入导出)
- [ ] Priority 4: 工资单生成
- [ ] Priority 5: 智能匹配校验
- [ ] Priority 6: 向量化管理
- [ ] Priority 7: MCP 服务

## 贡献指南

欢迎提交 Issue 和 Pull Request!

## 许可证

MIT License

## 联系方式

- GitHub: [@flyanima](https://github.com/flyanima)
- 项目地址: https://github.com/flyanima/FileDB
