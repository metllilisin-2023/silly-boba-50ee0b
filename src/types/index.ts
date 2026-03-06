
export interface Category {
  id: string;
  name: string;
}

export enum Unit {
  REAM = 'رزمة',
  PIECE = 'قطعة',
  BOX = 'صندوق',
  UNIT = 'وحدة',
  CARTON = 'كرتون',
  RECORD = 'سجل',
  BAG = 'حقيبة',
  BOTTLE = 'علبة'
}

export enum DeliveryType {
  PERMANENT = 'نهائي',
  TEMPORARY = 'مؤقت (عهدة)'
}

export interface InventoryItem {
  id: string;
  barcode: string;
  name: string;
  description: string;
  category: string; // Changed from Category enum to string (ID or Name)
  unit: Unit;
  initialStock: number;
  inbound: number;
  outbound: number;
  currentQty: number;
  reorderLevel: number;
}

export interface InboundLog {
  id: string;
  date: string;
  itemId: string;
  itemName: string;
  quantity: number;
  unit: Unit;
  supplier: string;
  orderNo: string;
  invoiceNo: string;
  receiptNo: string;
  notes: string;
  department?: string;
  officeNumber?: string;
  attachments?: string[];
}

export interface OutboundLog {
  id: string;
  date: string;
  itemId: string;
  itemName: string;
  quantity: number;
  unit: Unit;
  department: string;
  officeNumber?: string;
  recipientEntity?: string; // Added recipientEntity field
  deliveryType: DeliveryType;
  inventoryNo?: string;
  recipientName: string;
  recipientEmployeeId?: string;
  recipientTitle?: string;
  signature?: string;
  notes?: string;
  attachments?: string[];
}

export enum UserRole {
  STOREKEEPER = 'أمين المخزن',
  SECRETARY_GENERAL = 'الأمين العام',
  DEAN = 'عميد الكلية'
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  action: string;
  details: string;
  department?: string;
  officeNumber?: string;
  items?: {
    itemId: string;
    itemName: string;
    barcode: string;
    status: 'good' | 'broken' | 'missing';
    timestamp: string;
  }[];
}
