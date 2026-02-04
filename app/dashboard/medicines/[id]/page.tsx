"use client"

import { use } from "react"
import useSWR from "swr"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ArrowLeft, Package, AlertTriangle, Clock, Plus } from "lucide-react"
import type { Medicine, MedicineCategory, MedicineBatch, Supplier } from "@/lib/types"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

interface MedicineWithStock extends Medicine {
  category?: MedicineCategory
  currentStock: number
  isLowStock: boolean
  nearestExpiry: string | null
}

interface BatchWithRelations extends MedicineBatch {
  medicine?: Medicine
  supplier?: Supplier
}

export default function MedicineDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const { data: medicines } = useSWR<MedicineWithStock[]>("/api/medicines", fetcher)
  const { data: batches } = useSWR<BatchWithRelations[]>(`/api/batches?medicineId=${id}`, fetcher)

  const medicine = medicines?.find((m) => m.id === id)

  const formatDate = (dateString: string | Date) => {
    return new Date(dateString).toLocaleDateString()
  }

  const isExpiringSoon = (dateString: string | Date) => {
    const expiryDate = new Date(dateString)
    const ninetyDaysFromNow = new Date()
    ninetyDaysFromNow.setDate(ninetyDaysFromNow.getDate() + 90)
    return expiryDate <= ninetyDaysFromNow
  }

  if (!medicine) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-600 border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/medicines">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{medicine.name}</h1>
            <p className="text-slate-600">{medicine.genericName}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/dashboard/medicines/${id}/add-batch`}>
            <Button className="bg-teal-600 hover:bg-teal-700">
              <Plus className="mr-2 h-4 w-4" />
              Add Batch
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Current Stock</CardTitle>
            <Package className="h-5 w-5 text-teal-600" />
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${medicine.isLowStock ? "text-amber-600" : "text-slate-900"}`}
            >
              {medicine.currentStock}
            </div>
            <p className="text-xs text-slate-500">Reorder at {medicine.reorderLevel}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Unit Price</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">
              ${medicine.unitPrice.toFixed(2)}
            </div>
            <p className="text-xs text-slate-500">per {medicine.dosageForm.toLowerCase()}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Batches</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{batches?.length || 0}</div>
            <p className="text-xs text-slate-500">Active batches</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              {medicine.isLowStock && (
                <Badge className="bg-amber-100 text-amber-700">
                  <AlertTriangle className="mr-1 h-3 w-3" />
                  Low Stock
                </Badge>
              )}
              {medicine.nearestExpiry && isExpiringSoon(medicine.nearestExpiry) && (
                <Badge className="bg-red-100 text-red-700">
                  <Clock className="mr-1 h-3 w-3" />
                  Expiring
                </Badge>
              )}
              {!medicine.isLowStock && (!medicine.nearestExpiry || !isExpiringSoon(medicine.nearestExpiry)) && (
                <Badge className="bg-emerald-100 text-emerald-700">Normal</Badge>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Details */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Medicine Details</CardTitle>
            <CardDescription>General information about this medicine</CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="space-y-4">
              <div className="flex justify-between border-b pb-2">
                <dt className="text-slate-600">Category</dt>
                <dd className="font-medium text-slate-900">
                  <Badge variant="secondary">{medicine.category?.name || "N/A"}</Badge>
                </dd>
              </div>
              <div className="flex justify-between border-b pb-2">
                <dt className="text-slate-600">Manufacturer</dt>
                <dd className="font-medium text-slate-900">{medicine.manufacturer}</dd>
              </div>
              <div className="flex justify-between border-b pb-2">
                <dt className="text-slate-600">Dosage Form</dt>
                <dd className="font-medium text-slate-900">{medicine.dosageForm}</dd>
              </div>
              <div className="flex justify-between border-b pb-2">
                <dt className="text-slate-600">Strength</dt>
                <dd className="font-medium text-slate-900">{medicine.strength}</dd>
              </div>
              <div className="flex justify-between border-b pb-2">
                <dt className="text-slate-600">Prescription Required</dt>
                <dd className="font-medium text-slate-900">
                  {medicine.requiresPrescription ? "Yes" : "No"}
                </dd>
              </div>
              {medicine.description && (
                <div>
                  <dt className="mb-1 text-slate-600">Description</dt>
                  <dd className="text-slate-900">{medicine.description}</dd>
                </div>
              )}
            </dl>
          </CardContent>
        </Card>

        {/* Batches */}
        <Card>
          <CardHeader>
            <CardTitle>Batch Inventory</CardTitle>
            <CardDescription>Stock details by batch</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Batch #</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead>Expiry</TableHead>
                    <TableHead className="hidden sm:table-cell">Supplier</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {batches?.map((batch) => (
                    <TableRow key={batch.id}>
                      <TableCell className="font-medium">{batch.batchNumber}</TableCell>
                      <TableCell className="text-right">{batch.quantity}</TableCell>
                      <TableCell>
                        <span
                          className={
                            isExpiringSoon(batch.expiryDate)
                              ? "font-medium text-red-600"
                              : "text-slate-600"
                          }
                        >
                          {formatDate(batch.expiryDate)}
                        </span>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-slate-600">
                        {batch.supplier?.name || "N/A"}
                      </TableCell>
                    </TableRow>
                  ))}
                  {(!batches || batches.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={4} className="h-32 text-center text-slate-500">
                        No batches found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
