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
import { Plus, Search, Eye, Package, Clock, CheckCircle } from "lucide-react"
import type { Purchase, Supplier, Medicine } from "@/lib/types"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

interface PurchaseWithRelations extends Purchase {
  supplier?: Supplier
  items: Array<{
    id: string
    medicineId: string
    medicine?: Medicine
    quantity: number
    unitPrice: number
    batchNumber: string
    expiryDate: Date
  }>
}

export default function PurchasesPage() {
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [selectedPurchase, setSelectedPurchase] = useState<PurchaseWithRelations | null>(null)

  const { data: purchases, isLoading } = useSWR<PurchaseWithRelations[]>("/api/purchases", fetcher)

  const filteredPurchases = purchases?.filter((purchase) => {
    const matchesSearch =
      !search ||
      purchase.id.toLowerCase().includes(search.toLowerCase()) ||
      purchase.supplier?.name.toLowerCase().includes(search.toLowerCase())

    const matchesStatus = !statusFilter || statusFilter === "all" || purchase.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const formatDate = (dateString: string | Date) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const pendingCount = purchases?.filter((p) => p.status === "Pending").length || 0
  const receivedCount = purchases?.filter((p) => p.status === "Received").length || 0
  const totalValue = purchases?.reduce((sum, p) => sum + p.totalAmount, 0) || 0

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Pending":
        return (
          <Badge className="bg-amber-100 text-amber-700">
            <Clock className="mr-1 h-3 w-3" />
            Pending
          </Badge>
        )
      case "Received":
        return (
          <Badge className="bg-emerald-100 text-emerald-700">
            <CheckCircle className="mr-1 h-3 w-3" />
            Received
          </Badge>
        )
      case "Cancelled":
        return <Badge className="bg-red-100 text-red-700">Cancelled</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Purchases</h1>
          <p className="text-slate-600">Manage purchase orders from suppliers</p>
        </div>
        <Link href="/dashboard/purchases/new">
          <Button className="bg-teal-600 hover:bg-teal-700">
            <Plus className="mr-2 h-4 w-4" />
            New Purchase
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Pending Orders</CardTitle>
            <Clock className="h-5 w-5 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{pendingCount}</div>
            <p className="text-xs text-slate-500">awaiting delivery</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Received Orders</CardTitle>
            <CheckCircle className="h-5 w-5 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{receivedCount}</div>
            <p className="text-xs text-slate-500">completed orders</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Total Value</CardTitle>
            <Package className="h-5 w-5 text-teal-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">${totalValue.toFixed(2)}</div>
            <p className="text-xs text-slate-500">all purchases</p>
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
                placeholder="Search by ID or supplier..."
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
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="Received">Received</SelectItem>
                <SelectItem value="Cancelled">Cancelled</SelectItem>
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
                    <TableHead>Order ID</TableHead>
                    <TableHead className="hidden sm:table-cell">Supplier</TableHead>
                    <TableHead className="hidden md:table-cell">Date</TableHead>
                    <TableHead className="hidden lg:table-cell">Items</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPurchases?.map((purchase) => (
                    <TableRow key={purchase.id}>
                      <TableCell className="font-medium">
                        {purchase.id.substring(0, 12)}...
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        {purchase.supplier?.name || "N/A"}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-slate-600">
                        {formatDate(purchase.purchaseDate)}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-slate-600">
                        {purchase.items.length} item(s)
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        ${purchase.totalAmount.toFixed(2)}
                      </TableCell>
                      <TableCell>{getStatusBadge(purchase.status)}</TableCell>
                      <TableCell className="text-right">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedPurchase(purchase)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-lg">
                            <DialogHeader>
                              <DialogTitle>Purchase Order Details</DialogTitle>
                              <DialogDescription>
                                {selectedPurchase && formatDate(selectedPurchase.purchaseDate)}
                              </DialogDescription>
                            </DialogHeader>
                            {selectedPurchase && (
                              <div className="space-y-4">
                                <div className="flex justify-between text-sm">
                                  <span className="text-slate-600">Supplier:</span>
                                  <span className="font-medium">
                                    {selectedPurchase.supplier?.name}
                                  </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                  <span className="text-slate-600">Status:</span>
                                  {getStatusBadge(selectedPurchase.status)}
                                </div>
                                <div className="border-t pt-4">
                                  <p className="mb-2 font-medium">Items:</p>
                                  <div className="space-y-2">
                                    {selectedPurchase.items.map((item) => (
                                      <div
                                        key={item.id}
                                        className="flex justify-between rounded bg-slate-50 p-2 text-sm"
                                      >
                                        <div>
                                          <p className="font-medium">
                                            {item.medicine?.name || "Medicine"}
                                          </p>
                                          <p className="text-xs text-slate-500">
                                            Batch: {item.batchNumber}
                                          </p>
                                        </div>
                                        <div className="text-right">
                                          <p>{item.quantity} units</p>
                                          <p className="text-slate-500">
                                            ${item.unitPrice.toFixed(2)} each
                                          </p>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                                <div className="flex justify-between border-t pt-4 font-semibold">
                                  <span>Total Amount:</span>
                                  <span>${selectedPurchase.totalAmount.toFixed(2)}</span>
                                </div>
                                {selectedPurchase.notes && (
                                  <div className="text-sm">
                                    <span className="text-slate-600">Notes:</span>
                                    <p className="mt-1">{selectedPurchase.notes}</p>
                                  </div>
                                )}
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredPurchases?.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="h-32 text-center text-slate-500">
                        No purchases found
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
