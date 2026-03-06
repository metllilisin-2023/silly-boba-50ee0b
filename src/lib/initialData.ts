
import { Unit, InventoryItem, InboundLog, OutboundLog, DeliveryType, Category } from '../types';

// Initial categories
export const INITIAL_CATEGORIES: Category[] = [
  { id: 'cat-1', name: 'قرطاسية' },
  { id: 'cat-2', name: 'أثاث' },
  { id: 'cat-3', name: 'تجهيزات تقنية' },
  { id: 'cat-4', name: 'مواد نظافة' }
];

// Initial inventory based on official opening balance rules
export const INITIAL_INVENTORY: InventoryItem[] = [
  {
    id: 'K/H/2024/001',
    barcode: '2132024001',
    name: 'ورق طباعة A4',
    description: 'كرتون ورق A4 عالي الجودة للطباعة الإدارية.',
    category: 'قرطاسية',
    unit: Unit.CARTON,
    initialStock: 58,
    inbound: 0,
    outbound: 0,
    currentQty: 58,
    reorderLevel: 5
  },
  {
    id: 'K/H/2024/002',
    barcode: '2132024002',
    name: 'حبر طابعة TK-4105',
    description: 'خرطوشة حبر طابعة ليزرية متوافقة.',
    category: 'تجهيزات تقنية',
    unit: Unit.PIECE,
    initialStock: 32,
    inbound: 0,
    outbound: 0,
    currentQty: 32,
    reorderLevel: 5
  },
  {
    id: 'K/H/2024/003',
    barcode: '2132024003',
    name: 'إطار شهادة زجاجي A4',
    description: 'إطار حائط زجاجي فاخر للمقاس العالمي A4.',
    category: 'أثاث',
    unit: Unit.PIECE,
    initialStock: 177,
    inbound: 0,
    outbound: 0,
    currentQty: 177,
    reorderLevel: 5
  },
  {
    id: 'K/H/2024/004',
    barcode: '2132024004',
    name: 'إطار شهادة زجاجي A3',
    description: 'إطار حائط زجاجي فاخر للمقاس A3.',
    category: 'أثاث',
    unit: Unit.PIECE,
    initialStock: 60,
    inbound: 0,
    outbound: 0,
    currentQty: 60,
    reorderLevel: 5
  },
  {
    id: 'K/H/2024/005',
    barcode: '2132024005',
    name: 'إطار شهادة خشبي A3',
    description: 'إطار خشبي كلاسيكي للمقاس A3.',
    category: 'أثاث',
    unit: Unit.PIECE,
    initialStock: 60,
    inbound: 0,
    outbound: 0,
    currentQty: 60,
    reorderLevel: 5
  },
  {
    id: 'K/H/2024/006',
    barcode: '2132024006',
    name: 'سجل البريد الوارد',
    description: 'سجل رسمي لتدوين المراسلات الواردة.',
    category: 'قرطاسية',
    unit: Unit.RECORD,
    initialStock: 30,
    inbound: 0,
    outbound: 0,
    currentQty: 30,
    reorderLevel: 5
  },
  {
    id: 'K/H/2024/007',
    barcode: '2132024007',
    name: 'سجل البريد الصادر',
    description: 'سجل رسمي لتدوين المراسلات الصادرة.',
    category: 'قرطاسية',
    unit: Unit.RECORD,
    initialStock: 20,
    inbound: 0,
    outbound: 0,
    currentQty: 20,
    reorderLevel: 5
  },
  {
    id: 'K/H/2024/008',
    barcode: '2132024008',
    name: 'سجل 2 MAIN',
    description: 'سجل إداري رئيسي للعمليات المخزنية.',
    category: 'قرطاسية',
    unit: Unit.RECORD,
    initialStock: 50,
    inbound: 0,
    outbound: 0,
    currentQty: 50,
    reorderLevel: 5
  },
  {
    id: 'K/H/2024/009',
    barcode: '2132024009',
    name: 'حقيبة جلدية',
    description: 'حقيبة وثائق جلدية عالية الجودة.',
    category: 'قرطاسية',
    unit: Unit.BAG,
    initialStock: 34,
    inbound: 0,
    outbound: 0,
    currentQty: 34,
    reorderLevel: 5
  },
  {
    id: 'K/H/2024/010',
    barcode: '2132024010',
    name: 'قلم جاف أزرق',
    description: 'علبة أقلام جاف زرقاء (50 قطعة).',
    category: 'قرطاسية',
    unit: Unit.BOX,
    initialStock: 22,
    inbound: 0,
    outbound: 0,
    currentQty: 22,
    reorderLevel: 5
  },
  {
    id: 'K/H/2024/011',
    barcode: '2132024011',
    name: 'حبر ختم',
    description: 'علبة حبر مخصصة للأختام الرسمية.',
    category: 'قرطاسية',
    unit: Unit.BOTTLE,
    initialStock: 140,
    inbound: 0,
    outbound: 0,
    currentQty: 140,
    reorderLevel: 5
  }
];

export const INITIAL_INBOUND: InboundLog[] = [];
export const INITIAL_OUTBOUND: OutboundLog[] = [];
