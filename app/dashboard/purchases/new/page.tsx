"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import useSWR from "swr"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/lib/auth-context"
import { ArrowLeft, Plus, Trash2, Save, Loader2 } from "lucide-react"
import Link from "next/link"
import type { Supplier, Medicine, MedicineCategory } from "@/lib/types"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

interface MedicineWithStock extends Medicine {
  category?: MedicineCategory
  currentStock: number
}

interface PurchaseItem {
  medicineId: string
  medicine: MedicineWithStock
  quantity: number
  unitPrice: number
  batchNumber: string
  expiryDate: string
}

export default function NewPurchasePage() {
  const router = useRouter()
  const { toast } = useToast()
  const { user } = useAuth()

  const { data: suppliers } = useSWR<Supplier[]>("/api/suppliers", fetcher)
  const { data: medicines } = useSWR<MedicineWithStock[]>("/api/medicines", fetcher)

  const [supplierId, setSupplierId] = useState("")
  const [notes, setNotes] = useState("")
  const [items, setItems] = useState<PurchaseItem[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Form for adding items
  const [selectedMedicine, setSelectedMedicine] = useState("")
  const [quantity, setQuantity] = useState("")
  const [unitPrice, setUnitPrice] = useState("")
  const [batchNumber, setBatchNumber] = useState("")
  const [expiryDate, setExpiryDate] = useState("")

  const addItem = () => {
    const medicine = medicines?.find((m) => m.id === selectedMedicine)
    if (!medicine || !quantity || !unitPrice || !batchNumber || !expiryDate) {
      toast({
        title: "Missing Fields",
        description: "Please fill all item fields",
        variant: "destructive",
      })
      return
    }

    setItems([
      ...items,
      {
        medicineId: selectedMedicine,
        medicine,
        quantity: parseInt(quantity),
        unitPrice: parseFloat(unitPrice),
        batchNumber,
        expiryDate,
      },
    ])

    // Reset form
    setSelectedMedicine("")
    setQuantity("")
    setUnitPrice("")
    setBatchNumber("")
    setExpiryDate("")
  }

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index))
  }

  const totalAmount = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)

  const handleSubmit = async () => {
    if (!supplierId) {
      toast({
        title: "Missing Supplier",
        description: "Please select a supplier",
        variant: "destructive",
      })
      return
    }

    if (items.length === 0) {
      toast({
        title: "No Items",
        description: "Please add at least one item",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch("/api/purchases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          supplierId,
          notes,
          createdBy: user?.id,
          items: items.map((item) => ({
            medicineId: item.medicineId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            batchNumber: item.batchNumber,
            expiryDate: item.expiryDate,
          })),
        }),
      })

      if (response.ok) {
        toast({
          title: "Purchase Created",
          description: "Purchase order has been created successfully",
        })
        router.push("/dashboard/purchases")
      } else {
        throw new Error("Failed to create purchase")
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to create purchase order. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/purchases">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">New Purchase Order</h1>
          <p className="text-slate-600">Create a new purchase order from suppliers</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Order Details */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Order Details</CardTitle>
            <CardDescription>Select supplier and add items to the order</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Supplier Selection */}
            <div className="space-y-2">
              <Label>Supplier *</Label>
              <Select value={supplierId} onValueChange={setSupplierId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select supplier" />
                </SelectTrigger>
                <SelectContent>
                  {suppliers?.map((supplier) => (
                    <SelectItem key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Add Item Form */}
            <div className="rounded-lg border bg-slate-50 p-4">
              <h3 className="mb-4 font-medium">Add Item</h3>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-2 sm:col-span-2 lg:col-span-1">
                  <Label>Medicine</Label>
                  <Select value={selectedMedicine} onValueChange={setSelectedMedicine}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select medicine" />
                    </SelectTrigger>
                    <SelectContent>
                      {medicines?.map((medicine) => (
                        <SelectItem key={medicine.id} value={medicine.id}>
                          {medicine.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Quantity</Label>
                  <Input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Unit Price ($)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={unitPrice}
                    onChange={(e) => setUnitPrice(e.target.value)}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Batch Number</Label>
                  <Input
                    value={batchNumber}
                    onChange={(e) => setBatchNumber(e.target.value)}
                    placeholder="e.g., AMX-2024-002"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Expiry Date</Label>
                  <Input
                    type="date"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                  />
                </div>
                <div className="flex items-end">
                  <Button type="button" onClick={addItem} className="w-full">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Item
                  </Button>
                </div>
              </div>
            </div>

            {/* Items List */}
            {items.length > 0 && (
              <div className="overflow-x-auto rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Medicine</TableHead>
                      <TableHead className="hidden sm:table-cell">Batch</TableHead>
                      <TableHead className="text-right">Qty</TableHead>
                      <TableHead className="text-right">Price</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead className="w-10"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{item.medicine.name}</p>
                            <p className="text-xs text-slate-500 sm:hidden">
                              Batch: {item.batchNumber}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell text-slate-600">
                          {item.batchNumber}
                        </TableCell>
                        <TableCell className="text-right">{item.quantity}</TableCell>
                        <TableCell className="text-right">${item.unitPrice.toFixed(2)}</TableCell>
                        <TableCell className="text-right font-medium">
                          ${(item.quantity * item.unitPrice).toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-red-500"
                            onClick={() => removeItem(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* Notes */}
            <div className="space-y-2">
              <Label>Notes (Optional)</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any additional notes for this purchase order..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Order Summary */}
        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Order Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600">Supplier:</span>
                <span className="font-medium">
                  {suppliers?.find((s) => s.id === supplierId)?.name || "Not selected"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Items:</span>
                <span className="font-medium">{items.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Total Quantity:</span>
                <span className="font-medium">
                  {items.reduce((sum, item) => sum + item.quantity, 0)}
                </span>
              </div>
            </div>
            <div className="border-t pt-4">
              <div className="flex justify-between text-lg font-bold">
                <span>Total Amount</span>
                <span className="text-teal-600">${totalAmount.toFixed(2)}</span>
              </div>
            </div>
            <Button
              onClick={handleSubmit}
              disabled={!supplierId || items.length === 0 || isSubmitting}
              className="w-full bg-teal-600 hover:bg-teal-700"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Create Purchase Order
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
