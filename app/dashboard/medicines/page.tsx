"use client"

import { useState } from "react"
import useSWR from "swr"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Plus,
  Search,
  AlertTriangle,
  Clock,
  Filter,
  Pill,
  Eye,
} from "lucide-react"
import type { Medicine, MedicineCategory } from "@/lib/types"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

interface MedicineWithStock extends Medicine {
  category?: MedicineCategory
  currentStock: number
  isLowStock: boolean
  nearestExpiry: string | null
}

export default function MedicinesPage() {
  const searchParams = useSearchParams()
  const initialFilter = searchParams.get("filter") || ""

  const [search, setSearch] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("")
  const [stockFilter, setStockFilter] = useState(initialFilter)

  const { data: medicines, isLoading } = useSWR<MedicineWithStock[]>(
    `/api/medicines${stockFilter === "lowStock" ? "?lowStock=true" : stockFilter === "expiring" ? "?expiring=true" : ""}`,
    fetcher
  )
  const { data: categories } = useSWR<MedicineCategory[]>("/api/categories", fetcher)

  const filteredMedicines = medicines?.filter((medicine) => {
    const matchesSearch =
      !search ||
      medicine.name.toLowerCase().includes(search.toLowerCase()) ||
      medicine.genericName.toLowerCase().includes(search.toLowerCase()) ||
      medicine.manufacturer.toLowerCase().includes(search.toLowerCase())

    const matchesCategory = !categoryFilter || medicine.categoryId === categoryFilter

    return matchesSearch && matchesCategory
  })

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A"
    return new Date(dateString).toLocaleDateString()
  }

  const isExpiringSoon = (dateString: string | null) => {
    if (!dateString) return false
    const expiryDate = new Date(dateString)
    const ninetyDaysFromNow = new Date()
    ninetyDaysFromNow.setDate(ninetyDaysFromNow.getDate() + 90)
    return expiryDate <= ninetyDaysFromNow
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Medicine Inventory</h1>
          <p className="text-slate-600">Manage your medicine stock and information</p>
        </div>
        <Link href="/dashboard/medicines/new">
          <Button className="bg-teal-600 hover:bg-teal-700">
            <Plus className="mr-2 h-4 w-4" />
            Add Medicine
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Search medicines..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex gap-2">
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories?.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={stockFilter} onValueChange={setStockFilter}>
                <SelectTrigger className="w-[150px]">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="All Stock" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Stock</SelectItem>
                  <SelectItem value="lowStock">Low Stock</SelectItem>
                  <SelectItem value="expiring">Expiring Soon</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Total Medicines</CardTitle>
            <Pill className="h-5 w-5 text-teal-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{medicines?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Low Stock</CardTitle>
            <AlertTriangle className="h-5 w-5 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
              {medicines?.filter((m) => m.isLowStock).length || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Expiring Soon</CardTitle>
            <Clock className="h-5 w-5 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {medicines?.filter((m) => isExpiringSoon(m.nearestExpiry)).length || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex h-64 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-600 border-t-transparent" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Medicine</TableHead>
                    <TableHead className="hidden md:table-cell">Category</TableHead>
                    <TableHead className="hidden lg:table-cell">Manufacturer</TableHead>
                    <TableHead className="text-right">Stock</TableHead>
                    <TableHead className="text-right hidden sm:table-cell">Price</TableHead>
                    <TableHead className="hidden lg:table-cell">Expiry</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMedicines?.map((medicine) => (
                    <TableRow key={medicine.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-slate-900">{medicine.name}</p>
                          <p className="text-sm text-slate-500">{medicine.genericName}</p>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Badge variant="secondary">{medicine.category?.name || "N/A"}</Badge>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-slate-600">
                        {medicine.manufacturer}
                      </TableCell>
                      <TableCell className="text-right">
                        <span
                          className={
                            medicine.isLowStock
                              ? "font-semibold text-amber-600"
                              : "text-slate-900"
                          }
                        >
                          {medicine.currentStock}
                        </span>
                      </TableCell>
                      <TableCell className="text-right hidden sm:table-cell">
                        ${medicine.unitPrice.toFixed(2)}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <span
                          className={
                            isExpiringSoon(medicine.nearestExpiry)
                              ? "text-red-600"
                              : "text-slate-600"
                          }
                        >
                          {formatDate(medicine.nearestExpiry)}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex justify-center gap-1">
                          {medicine.isLowStock && (
                            <Badge variant="outline" className="border-amber-300 bg-amber-50 text-amber-700">
                              Low Stock
                            </Badge>
                          )}
                          {isExpiringSoon(medicine.nearestExpiry) && (
                            <Badge variant="outline" className="border-red-300 bg-red-50 text-red-700">
                              Expiring
                            </Badge>
                          )}
                          {!medicine.isLowStock && !isExpiringSoon(medicine.nearestExpiry) && (
                            <Badge variant="outline" className="border-emerald-300 bg-emerald-50 text-emerald-700">
                              OK
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Link href={`/dashboard/medicines/${medicine.id}`}>
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                            <span className="sr-only">View</span>
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredMedicines?.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} className="h-32 text-center text-slate-500">
                        No medicines found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
