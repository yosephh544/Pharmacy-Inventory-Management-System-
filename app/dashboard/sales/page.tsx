"use client"

import { useState } from "react"
import useSWR from "swr"
import Link from "next/link"
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Plus,
  Search,
  Eye,
  ShoppingCart,
  DollarSign,
  TrendingUp,
} from "lucide-react"
import type { Sale, Medicine } from "@/lib/types"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

interface SaleWithDetails extends Sale {
  items: Array<{
    id: string
    medicineId: string
    medicine?: Medicine
    quantity: number
    unitPrice: number
    totalPrice: number
  }>
}

export default function SalesPage() {
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [selectedSale, setSelectedSale] = useState<SaleWithDetails | null>(null)

  const { data: sales, isLoading } = useSWR<SaleWithDetails[]>("/api/sales", fetcher)

  const filteredSales = sales?.filter((sale) => {
    const matchesSearch =
      !search ||
      sale.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
      sale.customerName?.toLowerCase().includes(search.toLowerCase())

    const matchesStatus = !statusFilter || statusFilter === "all" || sale.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const formatDate = (dateString: string | Date) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const todaySales = sales?.filter((s) => {
    const today = new Date()
    const saleDate = new Date(s.saleDate)
    return (
      saleDate.getDate() === today.getDate() &&
      saleDate.getMonth() === today.getMonth() &&
      saleDate.getFullYear() === today.getFullYear() &&
      s.status === "Completed"
    )
  })

  const todayRevenue = todaySales?.reduce((sum, s) => sum + s.netAmount, 0) || 0
  const totalSales = sales?.filter((s) => s.status === "Completed").length || 0

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Completed":
        return <Badge className="bg-emerald-100 text-emerald-700">Completed</Badge>
      case "Pending":
        return <Badge className="bg-amber-100 text-amber-700">Pending</Badge>
      case "Refunded":
        return <Badge className="bg-red-100 text-red-700">Refunded</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getPaymentMethodBadge = (method: string) => {
    switch (method) {
      case "Cash":
        return <Badge variant="outline" className="border-green-300 bg-green-50">Cash</Badge>
      case "Card":
        return <Badge variant="outline" className="border-blue-300 bg-blue-50">Card</Badge>
      case "Mobile":
        return <Badge variant="outline" className="border-purple-300 bg-purple-50">Mobile</Badge>
      default:
        return <Badge variant="outline">{method}</Badge>
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Sales</h1>
          <p className="text-slate-600">Manage sales transactions and invoices</p>
        </div>
        <Link href="/dashboard/sales/new">
          <Button className="bg-teal-600 hover:bg-teal-700">
            <Plus className="mr-2 h-4 w-4" />
            New Sale
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Today&apos;s Sales</CardTitle>
            <ShoppingCart className="h-5 w-5 text-teal-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{todaySales?.length || 0}</div>
            <p className="text-xs text-slate-500">transactions</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Today&apos;s Revenue</CardTitle>
            <DollarSign className="h-5 w-5 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">${todayRevenue.toFixed(2)}</div>
            <p className="text-xs text-slate-500">total revenue</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Total Sales</CardTitle>
            <TrendingUp className="h-5 w-5 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{totalSales}</div>
            <p className="text-xs text-slate-500">completed transactions</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Search by invoice or customer..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Completed">Completed</SelectItem>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="Refunded">Refunded</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

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
                    <TableHead>Invoice #</TableHead>
                    <TableHead className="hidden sm:table-cell">Date</TableHead>
                    <TableHead className="hidden md:table-cell">Customer</TableHead>
                    <TableHead className="hidden lg:table-cell">Items</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="hidden sm:table-cell">Payment</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSales?.map((sale) => (
                    <TableRow key={sale.id}>
                      <TableCell className="font-medium">{sale.invoiceNumber}</TableCell>
                      <TableCell className="hidden sm:table-cell text-slate-600">
                        {formatDate(sale.saleDate)}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {sale.customerName || "Walk-in"}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-slate-600">
                        {sale.items.length} item(s)
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        ${sale.netAmount.toFixed(2)}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        {getPaymentMethodBadge(sale.paymentMethod)}
                      </TableCell>
                      <TableCell>{getStatusBadge(sale.status)}</TableCell>
                      <TableCell className="text-right">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedSale(sale)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-lg">
                            <DialogHeader>
                              <DialogTitle>Invoice {selectedSale?.invoiceNumber}</DialogTitle>
                              <DialogDescription>
                                {selectedSale && formatDate(selectedSale.saleDate)}
                              </DialogDescription>
                            </DialogHeader>
                            {selectedSale && (
                              <div className="space-y-4">
                                <div className="flex justify-between text-sm">
                                  <span className="text-slate-600">Customer:</span>
                                  <span className="font-medium">
                                    {selectedSale.customerName || "Walk-in Customer"}
                                  </span>
                                </div>
                                <div className="border-t pt-4">
                                  <p className="mb-2 font-medium">Items:</p>
                                  <div className="space-y-2">
                                    {selectedSale.items.map((item) => (
                                      <div
                                        key={item.id}
                                        className="flex justify-between text-sm"
                                      >
                                        <span>
                                          {item.medicine?.name || "Medicine"} x{item.quantity}
                                        </span>
                                        <span>${item.totalPrice.toFixed(2)}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                                <div className="space-y-2 border-t pt-4 text-sm">
                                  <div className="flex justify-between">
                                    <span className="text-slate-600">Subtotal:</span>
                                    <span>${selectedSale.totalAmount.toFixed(2)}</span>
                                  </div>
                                  {selectedSale.discount > 0 && (
                                    <div className="flex justify-between">
                                      <span className="text-slate-600">Discount:</span>
                                      <span className="text-red-600">
                                        -${selectedSale.discount.toFixed(2)}
                                      </span>
                                    </div>
                                  )}
                                  <div className="flex justify-between">
                                    <span className="text-slate-600">Tax (8%):</span>
                                    <span>${selectedSale.tax.toFixed(2)}</span>
                                  </div>
                                  <div className="flex justify-between border-t pt-2 font-semibold">
                                    <span>Total:</span>
                                    <span>${selectedSale.netAmount.toFixed(2)}</span>
                                  </div>
                                </div>
                                <div className="flex justify-between text-sm">
                                  <span className="text-slate-600">Payment Method:</span>
                                  {getPaymentMethodBadge(selectedSale.paymentMethod)}
                                </div>
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredSales?.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} className="h-32 text-center text-slate-500">
                        No sales found
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
