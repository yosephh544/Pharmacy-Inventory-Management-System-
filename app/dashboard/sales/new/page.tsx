"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import useSWR from "swr"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
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
import {
  ArrowLeft,
  Search,
  Plus,
  Minus,
  Trash2,
  ShoppingCart,
  CreditCard,
  Banknote,
  Smartphone,
  Loader2,
} from "lucide-react"
import Link from "next/link"
import type { Medicine, MedicineCategory, MedicineBatch, Supplier } from "@/lib/types"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

interface MedicineWithStock extends Medicine {
  category?: MedicineCategory
  currentStock: number
  isLowStock: boolean
}

interface BatchWithRelations extends MedicineBatch {
  medicine?: Medicine
  supplier?: Supplier
}

interface CartItem {
  medicineId: string
  medicine: MedicineWithStock
  batchId: string
  batch: BatchWithRelations
  quantity: number
  unitPrice: number
}

export default function NewSalePage() {
  const router = useRouter()
  const { toast } = useToast()
  const { user } = useAuth()

  const { data: medicines } = useSWR<MedicineWithStock[]>("/api/medicines", fetcher)
  const { data: allBatches } = useSWR<BatchWithRelations[]>("/api/batches", fetcher)

  const [search, setSearch] = useState("")
  const [cart, setCart] = useState<CartItem[]>([])
  const [customerName, setCustomerName] = useState("")
  const [discount, setDiscount] = useState(0)
  const [paymentMethod, setPaymentMethod] = useState<"Cash" | "Card" | "Mobile">("Cash")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const filteredMedicines = medicines?.filter(
    (m) =>
      m.currentStock > 0 &&
      (m.name.toLowerCase().includes(search.toLowerCase()) ||
        m.genericName.toLowerCase().includes(search.toLowerCase()))
  )

  const addToCart = (medicine: MedicineWithStock) => {
    // Find available batch for this medicine
    const availableBatch = allBatches?.find(
      (b) => b.medicineId === medicine.id && b.quantity > 0
    )

    if (!availableBatch) {
      toast({
        title: "Out of Stock",
        description: "No available batch for this medicine",
        variant: "destructive",
      })
      return
    }

    const existingItem = cart.find(
      (item) => item.medicineId === medicine.id && item.batchId === availableBatch.id
    )

    if (existingItem) {
      if (existingItem.quantity >= availableBatch.quantity) {
        toast({
          title: "Stock Limit",
          description: "Cannot add more than available stock",
          variant: "destructive",
        })
        return
      }
      setCart(
        cart.map((item) =>
          item.medicineId === medicine.id && item.batchId === availableBatch.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      )
    } else {
      setCart([
        ...cart,
        {
          medicineId: medicine.id,
          medicine,
          batchId: availableBatch.id,
          batch: availableBatch,
          quantity: 1,
          unitPrice: availableBatch.sellingPrice,
        },
      ])
    }
    setSearch("")
  }

  const updateQuantity = (index: number, delta: number) => {
    const item = cart[index]
    const newQuantity = item.quantity + delta

    if (newQuantity <= 0) {
      removeFromCart(index)
      return
    }

    if (newQuantity > item.batch.quantity) {
      toast({
        title: "Stock Limit",
        description: "Cannot add more than available stock",
        variant: "destructive",
      })
      return
    }

    setCart(cart.map((item, i) => (i === index ? { ...item, quantity: newQuantity } : item)))
  }

  const removeFromCart = (index: number) => {
    setCart(cart.filter((_, i) => i !== index))
  }

  const subtotal = cart.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)
  const tax = (subtotal - discount) * 0.08
  const total = subtotal - discount + tax

  const handleSubmit = async () => {
    if (cart.length === 0) {
      toast({
        title: "Empty Cart",
        description: "Please add items to the cart",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch("/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: customerName || undefined,
          discount,
          paymentMethod,
          soldBy: user?.id,
          items: cart.map((item) => ({
            medicineId: item.medicineId,
            batchId: item.batchId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
          })),
        }),
      })

      if (response.ok) {
        const data = await response.json()
        toast({
          title: "Sale Completed",
          description: `Invoice ${data.data.invoiceNumber} created successfully`,
        })
        router.push("/dashboard/sales")
      } else {
        throw new Error("Failed to create sale")
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to process sale. Please try again.",
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
        <Link href="/dashboard/sales">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">New Sale</h1>
          <p className="text-slate-600">Point of Sale - Create new transaction</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Product Search & Selection */}
        <div className="lg:col-span-2 space-y-4">
          {/* Search */}
          <Card>
            <CardContent className="p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  placeholder="Search medicines by name..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              {search && filteredMedicines && filteredMedicines.length > 0 && (
                <div className="mt-2 max-h-64 overflow-y-auto rounded-lg border">
                  {filteredMedicines.slice(0, 10).map((medicine) => (
                    <button
                      key={medicine.id}
                      onClick={() => addToCart(medicine)}
                      className="flex w-full items-center justify-between border-b p-3 text-left hover:bg-slate-50 last:border-b-0"
                    >
                      <div>
                        <p className="font-medium text-slate-900">{medicine.name}</p>
                        <p className="text-sm text-slate-500">
                          {medicine.genericName} - {medicine.strength}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-teal-600">
                          ${medicine.unitPrice.toFixed(2)}
                        </p>
                        <p className="text-xs text-slate-500">
                          Stock: {medicine.currentStock}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Cart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Cart ({cart.length} items)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {cart.length === 0 ? (
                <div className="flex h-48 items-center justify-center text-slate-500">
                  No items in cart. Search and add medicines above.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Item</TableHead>
                        <TableHead className="text-center">Qty</TableHead>
                        <TableHead className="text-right">Price</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead className="w-10"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {cart.map((item, index) => (
                        <TableRow key={`${item.medicineId}-${item.batchId}`}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{item.medicine.name}</p>
                              <p className="text-xs text-slate-500">
                                Batch: {item.batch.batchNumber}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center justify-center gap-1">
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => updateQuantity(index, -1)}
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <span className="w-8 text-center font-medium">{item.quantity}</span>
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => updateQuantity(index, 1)}
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            ${item.unitPrice.toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            ${(item.quantity * item.unitPrice).toFixed(2)}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-red-500 hover:text-red-700"
                              onClick={() => removeFromCart(index)}
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
            </CardContent>
          </Card>
        </div>

        {/* Order Summary */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="customer">Customer Name (Optional)</Label>
                <Input
                  id="customer"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Walk-in Customer"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="discount">Discount ($)</Label>
                <Input
                  id="discount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={discount}
                  onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                />
              </div>

              <div className="space-y-2">
                <Label>Payment Method</Label>
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    type="button"
                    variant={paymentMethod === "Cash" ? "default" : "outline"}
                    className={paymentMethod === "Cash" ? "bg-teal-600" : ""}
                    onClick={() => setPaymentMethod("Cash")}
                  >
                    <Banknote className="mr-1 h-4 w-4" />
                    Cash
                  </Button>
                  <Button
                    type="button"
                    variant={paymentMethod === "Card" ? "default" : "outline"}
                    className={paymentMethod === "Card" ? "bg-teal-600" : ""}
                    onClick={() => setPaymentMethod("Card")}
                  >
                    <CreditCard className="mr-1 h-4 w-4" />
                    Card
                  </Button>
                  <Button
                    type="button"
                    variant={paymentMethod === "Mobile" ? "default" : "outline"}
                    className={paymentMethod === "Mobile" ? "bg-teal-600" : ""}
                    onClick={() => setPaymentMethod("Mobile")}
                  >
                    <Smartphone className="mr-1 h-4 w-4" />
                    Mobile
                  </Button>
                </div>
              </div>

              <div className="space-y-2 border-t pt-4">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Discount</span>
                    <span className="text-red-600">-${discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Tax (8%)</span>
                  <span>${tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between border-t pt-2 text-lg font-bold">
                  <span>Total</span>
                  <span className="text-teal-600">${total.toFixed(2)}</span>
                </div>
              </div>

              <Button
                onClick={handleSubmit}
                disabled={cart.length === 0 || isSubmitting}
                className="w-full bg-teal-600 hover:bg-teal-700"
                size="lg"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    Complete Sale
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Quick Info */}
          <Card>
            <CardContent className="p-4">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600">Cashier:</span>
                  <span className="font-medium">{user?.fullName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Date:</span>
                  <span className="font-medium">
                    {new Date().toLocaleDateString()}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
