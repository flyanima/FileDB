// Use require for xlsx to avoid module resolution issues
// eslint-disable-next-line @typescript-eslint/no-require-imports
const XLSX = require('xlsx')

export interface Column {
  key: string
  label: string
  type?: 'text' | 'number' | 'date'
}

/**
 * Export data to Excel file
 */
export function exportToExcel(data: any[], columns: Column[], filename: string) {
  // Prepare data with only the columns we want
  const exportData = data.map(row => {
    const obj: any = {}
    columns.forEach(col => {
      obj[col.label] = row[col.key] ?? ''
    })
    return obj
  })

  // Create worksheet
  const ws = XLSX.utils.json_to_sheet(exportData)

  // Set column widths
  const colWidths = columns.map(col => ({ wch: Math.max(col.label.length + 2, 15) }))
  ws['!cols'] = colWidths

  // Create workbook
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Data')

  // Download
  XLSX.writeFile(wb, `${filename}.xlsx`)
}

/**
 * Export data to CSV file
 */
export function exportToCSV(data: any[], columns: Column[], filename: string) {
  // Prepare data
  const exportData = data.map(row => {
    const obj: any = {}
    columns.forEach(col => {
      obj[col.label] = row[col.key] ?? ''
    })
    return obj
  })

  // Create worksheet and convert to CSV
  const ws = XLSX.utils.json_to_sheet(exportData)
  const csv = XLSX.utils.sheet_to_csv(ws)

  // Download
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `${filename}.csv`
  link.click()
}

/**
 * Generate and download a template Excel file
 */
export function generateTemplate(columns: Column[], tableName: string) {
  // Create header row
  const headers: any = {}
  columns.forEach(col => {
    headers[col.label] = ''
  })

  // Create sample row with type hints
  const sampleRow: any = {}
  columns.forEach(col => {
    switch (col.type) {
      case 'number':
        sampleRow[col.label] = '123'
        break
      case 'date':
        sampleRow[col.label] = '2024-01-01'
        break
      default:
        sampleRow[col.label] = 'Sample text'
    }
  })

  // Create worksheet with headers and sample
  const ws = XLSX.utils.json_to_sheet([headers, sampleRow])

  // Set column widths
  const colWidths = columns.map(col => ({ wch: Math.max(col.label.length + 2, 15) }))
  ws['!cols'] = colWidths

  // Create workbook
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Template')

  // Download
  XLSX.writeFile(wb, `${tableName}_template.xlsx`)
}

/**
 * Parse Excel or CSV file and return array of objects
 */
export async function parseExcelFile(file: File): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      try {
        const data = e.target?.result
        const workbook = XLSX.read(data, { type: 'binary' })

        // Get first sheet
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]

        // Convert to JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet)

        resolve(jsonData)
      } catch (error) {
        reject(error)
      }
    }

    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsBinaryString(file)
  })
}

/**
 * Validate a row against column definitions
 */
export function validateRow(row: any, columns: Column[]): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  columns.forEach(col => {
    const value = row[col.label]

    // Skip validation if value is empty
    if (value === undefined || value === null || value === '') {
      return
    }

    switch (col.type) {
      case 'number':
        if (isNaN(Number(value))) {
          errors.push(`${col.label}: "${value}" is not a valid number`)
        }
        break
      case 'date':
        const date = new Date(value)
        if (isNaN(date.getTime())) {
          errors.push(`${col.label}: "${value}" is not a valid date`)
        }
        break
      // text type accepts anything
    }
  })

  return {
    valid: errors.length === 0,
    errors
  }
}

/**
 * Map imported data to database column keys
 */
export function mapImportedData(importedRows: any[], columns: Column[]): any[] {
  return importedRows.map(row => {
    const mappedRow: any = {}

    columns.forEach(col => {
      const value = row[col.label]
      
      if (value !== undefined && value !== null && value !== '') {
        // Convert types
        switch (col.type) {
          case 'number':
            mappedRow[col.key] = Number(value)
            break
          case 'date':
            mappedRow[col.key] = new Date(value).toISOString().split('T')[0]
            break
          default:
            mappedRow[col.key] = String(value)
        }
      }
    })

    return mappedRow
  })
}
