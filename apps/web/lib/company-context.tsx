"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react"
import { supabase } from "@/lib/supabase"

interface Company {
  id: string
  name: string
  tax_id: string | null
  currency: string
  created_at: string
  updated_at: string
}

interface CompanyContextType {
  selectedCompany: Company | null
  companies: Company[]
  selectCompany: (id: string) => void
  refreshCompanies: () => Promise<void>
  loading: boolean
}

const CompanyContext = createContext<CompanyContextType | undefined>(undefined)

export function CompanyProvider({ children }: { children: ReactNode }) {
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null)
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)

  const fetchCompanies = async () => {
    try {
      const { data, error } = await supabase
        .from("companies")
        .select("*")
        .order("created_at", { ascending: true })
      
      if (error) throw error
      setCompanies(data || [])
      
      // Auto-select company from localStorage or first company
      if (data && data.length > 0) {
        const savedCompanyId = localStorage.getItem("selectedCompanyId")
        const companyToSelect = savedCompanyId 
          ? data.find(c => c.id === savedCompanyId) || data[0]
          : data[0]
        
        setSelectedCompany(companyToSelect)
      }
    } catch (error) {
      console.error("Error fetching companies:", error)
    } finally {
      setLoading(false)
    }
  }

  const selectCompany = (id: string) => {
    const company = companies.find(c => c.id === id)
    if (company) {
      setSelectedCompany(company)
      localStorage.setItem("selectedCompanyId", id)
    }
  }

  const refreshCompanies = async () => {
    await fetchCompanies()
  }

  useEffect(() => {
    fetchCompanies()
  }, [])

  return (
    <CompanyContext.Provider 
      value={{ 
        selectedCompany, 
        companies, 
        selectCompany, 
        refreshCompanies,
        loading 
      }}
    >
      {children}
    </CompanyContext.Provider>
  )
}

export function useCompany() {
  const context = useContext(CompanyContext)
  if (context === undefined) {
    throw new Error("useCompany must be used within a CompanyProvider")
  }
  return context
}
