// Core Entity Types for Pharmacy Inventory Management System

export type UserRole = "Admin" | "Pharmacist" | "Staff"

export interface User {
  id: string
  username: string
  email: string
  passwordHash: string
  role: UserRole
  fullName: string
  isActive: boolean
  createdAt: Date
  lastLogin?: Date
}

export interface MedicineCategory {
  id: string
  name: string
  description?: string
}

export interface Medicine {
  id: string
  name: string
  genericName: string
  categoryId: string
  category?: MedicineCategory
  manufacturer: string
  dosageForm: string
  strength: string
  unitPrice: number
  reorderLevel: number
  description?: string
  requiresPrescription: boolean
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface MedicineBatch {
  id: string
  medicineId: string
  medicine?: Medicine
  batchNumber: string
  quantity: number
  manufacturingDate: Date
  expiryDate: Date
  purchasePrice: number
  sellingPrice: number
  supplierId: string
  supplier?: Supplier
  receivedDate: Date
}

export interface Supplier {
  id: string
  name: string
  contactPerson: string
  email: string
  phone: string
  address: string
  isActive: boolean
  createdAt: Date
}

export interface Purchase {
  id: string
  supplierId: string
  supplier?: Supplier
  purchaseDate: Date
  totalAmount: number
  status: "Pending" | "Received" | "Cancelled"
  items: PurchaseItem[]
  createdBy: string
  notes?: string
}

export interface PurchaseItem {
  id: string
  purchaseId: string
  medicineId: string
  medicine?: Medicine
  quantity: number
  unitPrice: number
  batchNumber: string
  expiryDate: Date
}

export interface Sale {
  id: string
  invoiceNumber: string
  saleDate: Date
  customerId?: string
  customerName?: string
  totalAmount: number
  discount: number
  tax: number
  netAmount: number
  paymentMethod: "Cash" | "Card" | "Mobile"
  status: "Completed" | "Refunded" | "Pending"
  items: SaleItem[]
  soldBy: string
  notes?: string
}

export interface SaleItem {
  id: string
  saleId: string
  medicineId: string
  medicine?: Medicine
  batchId: string
  batch?: MedicineBatch
  quantity: number
  unitPrice: number
  discount: number
  totalPrice: number
}

export interface Notification {
  id: string
  type: "LowStock" | "Expiring" | "Expired" | "System"
  title: string
  message: string
  isRead: boolean
  createdAt: Date
  relatedEntityId?: string
  relatedEntityType?: string
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean
  data?: T
  message?: string
  errors?: string[]
}

export interface PaginatedResponse<T> {
  items: T[]
  totalCount: number
  pageNumber: number
  pageSize: number
  totalPages: number
}

// Dashboard Types
export interface DashboardStats {
  totalMedicines: number
  lowStockCount: number
  expiringCount: number
  todaySales: number
  todayRevenue: number
  monthlyRevenue: number
  pendingPurchases: number
}

export interface SalesReport {
  date: string
  totalSales: number
  totalRevenue: number
  itemsSold: number
}

export interface InventoryReport {
  categoryId: string
  categoryName: string
  totalItems: number
  totalValue: number
  lowStockItems: number
}

// Auth Types
export interface LoginRequest {
  username: string
  password: string
}

export interface LoginResponse {
  user: Omit<User, "passwordHash">
  token: string
}

export interface RegisterRequest {
  username: string
  email: string
  password: string
  fullName: string
  role: UserRole
}
