"use client"

import { useState, useEffect } from "react"
import useSWR from "swr"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
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
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import {
  FileText,
  Download,
  TrendingUp,
  Package,
  DollarSign,
  ShoppingCart,
} from "lucide-react"
import type { Sale, Medicine, MedicineCategory, MedicineBatch, Supplier } from "@/lib/types"

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

const COLORS = ["#0d9488", "#14b8a6", "#2dd4bf", "#5eead4", "#99f6e4", "#f0fdfa"]

export default function ReportsPage() {
  const [reportType, setReportType] = useState("sales")
  const [mounted, setMounted] = useState(false)

  const { data: sales } = useSWR<SaleWithDetails[]>("/api/sales", fetcher)
  const { data: medicines } = useSWR<MedicineWithStock[]>("/api/medicines", fetcher)
  const { data: batches } = useSWR<BatchWithRelations[]>("/api/batches", fetcher)
  const { data: categories } = useSWR<MedicineCategory[]>("/api/categories", fetcher)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Calculate sales statistics
  const completedSales = sales?.filter((s) => s.status === "Completed") || []
  const totalRevenue = completedSales.reduce((sum, s) => sum + s.netAmount, 0)
  const totalTransactions = completedSales.length
  const averageOrderValue = totalTransactions > 0 ? totalRevenue / totalTransactions : 0

  // Sales by payment method
  const salesByPaymentMethod = [
    { name: "Cash", value: completedSales.filter((s) => s.paymentMethod === "Cash").length },
    { name: "Card", value: completedSales.filter((s) => s.paymentMethod === "Card").length },
    { name: "Mobile", value: completedSales.filter((s) => s.paymentMethod === "Mobile").length },
  ]

  // Revenue by day (last 7 days)
  const revenueByDay: { date: string; revenue: number }[] = []
  for (let i = 6; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    date.setHours(0, 0, 0, 0)

    const daySales = completedSales.filter((s) => {
      const saleDate = new Date(s.saleDate)
      saleDate.setHours(0, 0, 0, 0)
      return saleDate.getTime() === date.getTime()
    })

    revenueByDay.push({
      date: date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }),
      revenue: daySales.reduce((sum, s) => sum + s.netAmount, 0),
    })
  }

  // Inventory by category
  const inventoryByCategory = categories?.map((cat) => {
    const categoryMedicines = medicines?.filter((m) => m.categoryId === cat.id) || []
    const totalStock = categoryMedicines.reduce((sum, m) => sum + m.currentStock, 0)
    return {
      name: cat.name,
      stock: totalStock,
      items: categoryMedicines.length,
    }
  }) || []

  // Low stock items
  const lowStockItems = medicines?.filter((m) => m.isLowStock) || []

  // Expiring batches
  const ninetyDaysFromNow = new Date()
  ninetyDaysFromNow.setDate(ninetyDaysFromNow.getDate() + 90)
  const expiringBatches = batches?.filter(
    (b) => new Date(b.expiryDate) <= ninetyDaysFromNow && b.quantity > 0
  ) || []

  // Top selling medicines
  const medicineSales: Record<string, { name: string; quantity: number; revenue: number }> = {}
  completedSales.forEach((sale) => {
    sale.items.forEach((item) => {
      const medicine = medicines?.find((m) => m.id === item.medicineId)
      if (medicine) {
        if (!medicineSales[item.medicineId]) {
          medicineSales[item.medicineId] = { name: medicine.name, quantity: 0, revenue: 0 }
        }
        medicineSales[item.medicineId].quantity += item.quantity
        medicineSales[item.medicineId].revenue += item.totalPrice
      }
    })
  })
  const topSellingMedicines = Object.values(medicineSales)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10)

  if (!mounted) {
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
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Reports</h1>
          <p className="text-slate-600">Analytics and insights for your pharmacy</p>
        </div>
        <div className="flex gap-2">
          <Select value={reportType} onValueChange={setReportType}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sales">Sales Report</SelectItem>
              <SelectItem value="inventory">Inventory Report</SelectItem>
              <SelectItem value="expiry">Expiry Report</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {reportType === "sales" && (
        <>
          {/* Sales Stats */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-600">Total Revenue</CardTitle>
                <DollarSign className="h-5 w-5 text-emerald-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-900">${totalRevenue.toFixed(2)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-600">Transactions</CardTitle>
                <ShoppingCart className="h-5 w-5 text-teal-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-900">{totalTransactions}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-600">Avg. Order Value</CardTitle>
                <TrendingUp className="h-5 w-5 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-900">
                  ${averageOrderValue.toFixed(2)}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-600">Items Sold</CardTitle>
                <Package className="h-5 w-5 text-amber-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-900">
                  {completedSales.reduce((sum, s) => sum + s.items.reduce((is, i) => is + i.quantity, 0), 0)}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Revenue Trend</CardTitle>
                <CardDescription>Last 7 days revenue</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={revenueByDay}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200" />
                      <XAxis dataKey="date" className="text-xs" tick={{ fontSize: 10 }} />
                      <YAxis className="text-xs" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#1e293b",
                          border: "none",
                          borderRadius: "8px",
                          color: "#fff",
                        }}
                        formatter={(value: number) => [`$${value.toFixed(2)}`, "Revenue"]}
                      />
                      <Line
                        type="monotone"
                        dataKey="revenue"
                        stroke="#0d9488"
                        strokeWidth={2}
                        dot={{ fill: "#0d9488" }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Payment Methods</CardTitle>
                <CardDescription>Distribution of payment types</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={salesByPaymentMethod}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {salesByPaymentMethod.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Top Selling */}
          <Card>
            <CardHeader>
              <CardTitle>Top Selling Medicines</CardTitle>
              <CardDescription>Based on total revenue</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Rank</TableHead>
                      <TableHead>Medicine</TableHead>
                      <TableHead className="text-right">Qty Sold</TableHead>
                      <TableHead className="text-right">Revenue</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topSellingMedicines.map((medicine, index) => (
                      <TableRow key={medicine.name}>
                        <TableCell>
                          <Badge variant="outline">#{index + 1}</Badge>
                        </TableCell>
                        <TableCell className="font-medium">{medicine.name}</TableCell>
                        <TableCell className="text-right">{medicine.quantity}</TableCell>
                        <TableCell className="text-right font-semibold">
                          ${medicine.revenue.toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {reportType === "inventory" && (
        <>
          {/* Inventory Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Stock by Category</CardTitle>
              <CardDescription>Current inventory levels per category</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={inventoryByCategory} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={120} className="text-xs" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1e293b",
                        border: "none",
                        borderRadius: "8px",
                        color: "#fff",
                      }}
                    />
                    <Bar dataKey="stock" fill="#0d9488" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Low Stock Items */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Low Stock Items ({lowStockItems.length})
              </CardTitle>
              <CardDescription>Items that need reordering</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Medicine</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead className="text-right">Current Stock</TableHead>
                      <TableHead className="text-right">Reorder Level</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lowStockItems.map((medicine) => (
                      <TableRow key={medicine.id}>
                        <TableCell className="font-medium">{medicine.name}</TableCell>
                        <TableCell>{medicine.category?.name}</TableCell>
                        <TableCell className="text-right font-semibold text-amber-600">
                          {medicine.currentStock}
                        </TableCell>
                        <TableCell className="text-right">{medicine.reorderLevel}</TableCell>
                        <TableCell>
                          <Badge className="bg-amber-100 text-amber-700">Low Stock</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                    {lowStockItems.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="h-32 text-center text-slate-500">
                          No low stock items
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {reportType === "expiry" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Expiring Batches ({expiringBatches.length})
            </CardTitle>
            <CardDescription>Batches expiring within 90 days</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Medicine</TableHead>
                    <TableHead>Batch #</TableHead>
                    <TableHead className="text-right">Quantity</TableHead>
                    <TableHead>Expiry Date</TableHead>
                    <TableHead>Supplier</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expiringBatches.map((batch) => (
                    <TableRow key={batch.id}>
                      <TableCell className="font-medium">{batch.medicine?.name}</TableCell>
                      <TableCell>{batch.batchNumber}</TableCell>
                      <TableCell className="text-right">{batch.quantity}</TableCell>
                      <TableCell>
                        <span className="font-medium text-red-600">
                          {new Date(batch.expiryDate).toLocaleDateString()}
                        </span>
                      </TableCell>
                      <TableCell>{batch.supplier?.name}</TableCell>
                    </TableRow>
                  ))}
                  {expiringBatches.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="h-32 text-center text-slate-500">
                        No batches expiring soon
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
