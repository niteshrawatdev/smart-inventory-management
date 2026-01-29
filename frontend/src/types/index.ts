// User Types 
export interface User {
  id: string;
  email: string;
  fullName?: string;
  role: 'ADMIN' | 'MANAGER' | 'VIEWER';
  avatarUrl?: string;
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
}

export interface Warehouse {
  id: string;
  name: string;
  location?: string;
  capacity?: number;
  currentUtilization: number;
  managerId?: string;
  isActive: boolean;
  createdAt: string;
  manager?: Pick<User, 'id' | 'fullName' | 'email'>;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  category?: string;
  description?: string;
  unitPrice: number;
  imageUrl?: string;
  reorderPoint: number;
  optimalStock: number;
  createdAt: string;
}

export interface InventoryItem {
  id: string;
  warehouseId: string;
  productId: string;
  quantity: number;
  lastUpdated: string;
  locationInWarehouse?: string;
  warehouse: Warehouse;
  product: Product;
}

export interface StockMovement {
  id: string;
  inventoryId: string;
  movementType: 'incoming' | 'outgoing' | 'adjustment';
  quantityChange: number;
  previousQuantity: number;
  newQuantity: number;
  reason?: string;
  userId?: string;
  createdAt: string;
  inventory?: InventoryItem;
  user?: Pick<User, 'id' | 'fullName'>;
}

export interface Alert {
  id: string;
  type: 'low_stock' | 'overstock' | 'expiry' | 'theft';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  inventoryId?: string;
  isResolved: boolean;
  resolvedAt?: string;
  resolvedBy?: string;
  createdAt: string;
  inventory?: InventoryItem;
  resolver?: Pick<User, 'id' | 'fullName'>;
}

export interface AiDetection {
  id: string;
  warehouseId: string;
  imageUrl: string;
  detectionData: any; // JSON data
  processedAt: string;
  accuracyScore?: number;
  warehouse?: Warehouse;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Auth Types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest extends LoginRequest {
  fullName?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

// Warehouse Types
export interface CreateWarehouseRequest {
  name: string;
  location?: string;
  capacity?: number;
  managerId?: string;
}

export interface UpdateWarehouseRequest extends Partial<CreateWarehouseRequest> {}

// Product Types
export interface CreateProductRequest {
  sku: string;
  name: string;
  category?: string;
  description?: string;
  unitPrice: number;
  imageUrl?: string;
  reorderPoint?: number;
  optimalStock?: number;
}

export interface UpdateProductRequest extends Partial<CreateProductRequest> {}

// Inventory Types
export interface AdjustStockRequest {
  warehouseId: string;
  productId: string;
  quantity: number;
  movementType: 'incoming' | 'outgoing' | 'adjustment';
  reason?: string;
  location?: string;
}

// Alert Types
export interface ResolveAlertRequest {
  resolutionNotes?: string;
}


export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  hasLoadedProfile: boolean; // Add this
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, fullName?: string) => Promise<void>;
  logout: () => Promise<void>;
  loadProfile: () => Promise<void>;
  clearError: () => void;
}