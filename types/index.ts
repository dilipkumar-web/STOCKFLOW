// ==============================================================================
// STOCKFLOW - Database Models & Application Types
// ==============================================================================

export type UserRole = 'admin' | 'client';
export type AccountStatus = 'active' | 'inactive';

export interface User {
  user_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  role: UserRole;
  account_status: AccountStatus;
  created_at: string;
}

export interface SessionUser {
  user_id: string;
  full_name: string;
  email: string;
  role: UserRole;
}

export interface Product {
  product_id: string;
  name: string;
  category: string;
  price: number;
  reorder_level: number;
  created_at: string;
  // Computed fields from queries
  total_stock?: number;
  stock_status?: 'In Stock' | 'Low Stock' | 'Out of Stock';
  warehouses_count?: number;
}

export interface Supplier {
  supplier_id: string;
  name: string;
  company: string;
  phone: string;
  email: string;
  address: string;
  orders_count?: number;
}

export interface Warehouse {
  warehouse_id: string;
  name: string;
  location: string;
  capacity: number;
  // Computed fields
  current_stock?: number;
  available_capacity?: number;
  utilization_percent?: number;
  products_count?: number;
}

export interface InventoryItem {
  inventory_id: string;
  product_id: string;
  warehouse_id: string;
  quantity: number;
  last_updated: string;
  product_name?: string;
  product_category?: string;
  product_price?: number;
  warehouse_name?: string;
  warehouse_location?: string;
  reorder_level?: number;
  stock_status?: 'In Stock' | 'Low Stock' | 'Out of Stock';
}

export type PurchaseOrderStatus = 'Pending' | 'Received' | 'Cancelled';

export interface PurchaseOrder {
  order_id: string;
  supplier_id: string;
  warehouse_id: string;
  order_date: string;
  expected_delivery: string | null;
  received_date: string | null;
  status: PurchaseOrderStatus;
  supplier_name?: string;
  supplier_company?: string;
  warehouse_name?: string;
  total_amount?: number;
  total_items?: number;
  items?: PurchaseOrderItem[];
}

export interface PurchaseOrderItem {
  item_id?: string;
  order_id?: string;
  product_id: string;
  product_name?: string;
  quantity: number;
  unit_price: number;
  line_total?: number;
}

export type TransactionType = 'IN' | 'OUT' | 'TRANSFER';

export interface StockTransaction {
  transaction_id: string;
  product_id: string;
  product_name?: string;
  source_warehouse: string | null;
  source_warehouse_name?: string | null;
  destination_warehouse: string | null;
  destination_warehouse_name?: string | null;
  transaction_type: TransactionType;
  quantity: number;
  transaction_time: string;
  remarks: string | null;
}

export type CustomerOrderStatus = 'Pending' | 'Confirmed' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';

export interface CustomerOrder {
  customer_order_id: string;
  user_id: string;
  full_name?: string;
  email?: string;
  phone?: string;
  order_date: string;
  total_amount: number;
  shipping_address: string;
  order_status: CustomerOrderStatus;
  payment_status: string;
  updated_at: string;
  items?: CustomerOrderItem[];
  items_count?: number;
}

export interface CustomerOrderItem {
  customer_order_item_id?: string;
  customer_order_id?: string;
  product_id: string;
  product_name?: string;
  category?: string;
  quantity: number;
  unit_price: number;
  line_total: number;
}

export interface CartItem {
  cart_item_id: string;
  user_id: string;
  product_id: string;
  name: string;
  category: string;
  price: number;
  quantity: number;
  available_stock: number;
  line_total: number;
  added_at: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

export interface DashboardStats {
  totalProducts: number;
  totalStockQuantity: number;
  totalInventoryValue: number;
  totalSuppliers: number;
  totalWarehouses: number;
  pendingPurchaseOrders: number;
  totalCustomerOrders: number;
  lowStockCount: number;
  recentTransactions: StockTransaction[];
  recentCustomerOrders: CustomerOrder[];
  lowStockProducts: Product[];
  charts: {
    inventoryByWarehouse: { warehouse: string; quantity: number; value: number }[];
    productsByCategory: { category: string; count: number; stock: number }[];
    stockMovements: { date: string; inQty: number; outQty: number; transferQty: number }[];
    purchaseOrderStatus: { status: string; count: number }[];
    customerOrderStatus: { status: string; count: number }[];
    warehouseUtilization: { name: string; capacity: number; current: number; percentage: number }[];
  };
}
