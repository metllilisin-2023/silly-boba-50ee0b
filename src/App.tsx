
import React, { useState, useEffect, useMemo } from 'react';
import { 
  LayoutDashboard, 
  Package, 
  PlusCircle, 
  MinusCircle, 
  Search, 
  AlertTriangle, 
  Users, 
  MessageSquare,
  FileText,
  Settings,
  Menu,
  X,
  TrendingUp,
  History,
  Info,
  Download,
  Code2,
  ClipboardCheck,
  Database,
  Tags,
  Edit,
  Printer,
  Trash2,
  CheckCircle2,
  FileSpreadsheet,
  Send,
  Sparkles,
  PieChart as PieChartIcon
} from 'lucide-react';
import * as XLSX from 'xlsx';
import html2canvas from 'html2canvas';
import { 
  GoogleGenAI,
  GenerateContentResponse,
  FunctionDeclaration,
  Type
} from "@google/genai";
import { 
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { 
  InventoryItem, 
  InboundLog, 
  OutboundLog, 
  UserRole, 
  Category, 
  Unit, 
  DeliveryType,
  AuditLog
} from './types/index';
import { INITIAL_INVENTORY, INITIAL_INBOUND, INITIAL_OUTBOUND, INITIAL_CATEGORIES } from './lib/initialData';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useInventoryStore } from './store/inventoryStore';
import { initDb } from './lib/db';

// --- Internal Components (Zipped into App.tsx) ---

const Dashboard: React.FC<{ 
  inventory: InventoryItem[], 
  stats: any, 
  role: UserRole, 
  logs: { inbound: InboundLog[], outbound: OutboundLog[] } 
}> = ({ inventory, stats, role, logs }) => {
  const lowStockItems = inventory.filter(item => item.currentQty <= item.reorderLevel);
  
  // Data for charts
  const categoryData = useMemo(() => {
    const data = inventory.reduce((acc: any[], item) => {
      const existing = acc.find(c => c.name === item.category);
      if (existing) {
        existing.value += item.currentQty;
      } else {
        acc.push({ name: item.category, value: item.currentQty });
      }
      return acc;
    }, []);
    return data;
  }, [inventory]);

  const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard icon={<Package className="w-6 h-6 text-indigo-600" />} label="إجمالي المواد" value={stats.totalItems} color="indigo" />
        <StatCard icon={<AlertTriangle className="w-6 h-6 text-rose-600" />} label="مواد منخفضة المخزون" value={stats.lowStockItems} color="rose" />
        <StatCard icon={<PlusCircle className="w-6 h-6 text-emerald-600" />} label="عمليات الوارد" value={stats.totalInboundCount} color="emerald" />
        <StatCard icon={<MinusCircle className="w-6 h-6 text-amber-600" />} label="عمليات الصرف" value={stats.totalOutboundCount} color="amber" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-6">
              <TrendingUp className="w-4 h-4 text-indigo-600" />
              توزيع المخزون حسب الفئة
            </h3>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    cursor={{ fill: '#f8fafc' }}
                  />
                  <Bar dataKey="value" fill="#4f46e5" radius={[4, 4, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                تنبيهات المخزون المنخفض
              </h3>
            </div>
            <div className="p-4">
              {lowStockItems.length > 0 ? (
                <div className="space-y-3">
                  {lowStockItems.map(item => (
                    <div key={item.id} className="flex items-center justify-between p-3 bg-rose-50 rounded-xl border border-rose-100">
                      <div>
                        <p className="font-bold text-slate-900">{item.name}</p>
                        <p className="text-xs text-slate-500">{item.category}</p>
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-black text-rose-600">{item.currentQty} {item.unit}</p>
                        <p className="text-[10px] text-rose-400">الحد الأدنى: {item.reorderLevel}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center text-slate-400">
                  <ClipboardCheck className="w-12 h-12 mx-auto mb-2 opacity-20" />
                  <p>جميع المواد متوفرة بكميات كافية.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-6">
              <PieChartIcon className="w-4 h-4 text-indigo-600" />
              نسبة الفئات
            </h3>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {categoryData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <History className="w-4 h-4 text-indigo-600" />
                آخر الحركات
              </h3>
            </div>
            <div className="p-4 space-y-4">
              {[...logs.inbound, ...logs.outbound]
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .slice(0, 5)
                .map(log => {
                  const isIn = 'supplier' in log;
                  return (
                    <div key={log.id} className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${isIn ? 'bg-emerald-100' : 'bg-amber-100'}`}>
                        {isIn ? <PlusCircle className={`w-4 h-4 text-emerald-600`} /> : <MinusCircle className={`w-4 h-4 text-amber-600`} />}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-bold text-slate-800">{log.itemName}</p>
                        <p className="text-[10px] text-slate-500">{isIn ? `من: ${log.supplier}` : `إلى: ${log.recipientName}`}</p>
                      </div>
                      <div className="text-left">
                        <p className={`text-xs font-black ${isIn ? 'text-emerald-600' : 'text-amber-600'}`}>
                          {isIn ? '+' : '-'}{log.quantity}
                        </p>
                        <p className="text-[8px] text-slate-400">{log.date}</p>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard: React.FC<{ icon: React.ReactNode, label: string, value: number | string, color: string }> = ({ icon, label, value, color }) => (
  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4">
    <div className={`p-3 bg-${color}-50 rounded-xl`}>
      {icon}
    </div>
    <div>
      <p className="text-xs font-medium text-slate-500 mb-1">{label}</p>
      <p className="text-2xl font-black text-slate-900">{value}</p>
    </div>
  </div>
);

const AddItemModal: React.FC<{
  categories: Category[],
  onClose: () => void,
  onSave: (item: InventoryItem) => void
}> = ({ categories, onClose, onSave }) => {
  const [formData, setFormData] = useState<Partial<InventoryItem>>({
    id: Math.random().toString(36).substr(2, 9).toUpperCase(),
    barcode: '',
    name: '',
    description: '',
    category: categories[0]?.name || '',
    unit: Unit.PIECE,
    initialStock: 0,
    inbound: 0,
    outbound: 0,
    currentQty: 0,
    reorderLevel: 5
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'initialStock' || name === 'reorderLevel' ? Number(value) : value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      currentQty: formData.initialStock || 0
    } as InventoryItem);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-6 bg-indigo-600 text-white flex justify-between items-center">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <PlusCircle className="w-5 h-5" />
            إضافة صنف جديد للمخزون
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-lg transition-colors">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500">اسم المادة</label>
              <input 
                type="text" 
                name="name"
                required
                placeholder="مثال: ورق A4"
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                value={formData.name}
                onChange={handleChange}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500">الباركود / المعرف</label>
              <input 
                type="text" 
                name="barcode"
                required
                placeholder="رمز الباركود"
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none font-mono"
                value={formData.barcode}
                onChange={handleChange}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500">الفئة</label>
              <select 
                name="category"
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                value={formData.category}
                onChange={handleChange}
              >
                {categories.map(cat => <option key={cat.id} value={cat.name}>{cat.name}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500">الوحدة</label>
              <select 
                name="unit"
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                value={formData.unit}
                onChange={handleChange}
              >
                {Object.entries(Unit).map(([key, value]) => <option key={key} value={value}>{value}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500">الرصيد الافتتاحي</label>
              <input 
                type="number" 
                name="initialStock"
                min="0"
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                value={formData.initialStock}
                onChange={handleChange}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500">حد إعادة الطلب</label>
              <input 
                type="number" 
                name="reorderLevel"
                min="0"
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                value={formData.reorderLevel}
                onChange={handleChange}
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500">الوصف (اختياري)</label>
            <textarea 
              name="description"
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none h-20 resize-none"
              value={formData.description}
              onChange={handleChange}
            />
          </div>
          <div className="pt-4 flex gap-3">
            <button 
              type="submit"
              className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
            >
              إضافة الصنف
            </button>
            <button 
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-all"
            >
              إلغاء
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const EditItemModal: React.FC<{
  item: InventoryItem,
  categories: Category[],
  onClose: () => void,
  onSave: (updated: InventoryItem) => void
}> = ({ item, categories, onClose, onSave }) => {
  const [formData, setFormData] = useState<InventoryItem>({ ...item });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'initialStock' || name === 'reorderLevel' ? Number(value) : value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-6 bg-indigo-600 text-white flex justify-between items-center">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <Edit className="w-5 h-5" />
            تعديل بيانات المادة
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-lg transition-colors">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500">اسم المادة</label>
              <input 
                type="text" 
                name="name"
                required
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                value={formData.name}
                onChange={handleChange}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500">الباركود</label>
              <input 
                type="text" 
                name="barcode"
                required
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                value={formData.barcode}
                onChange={handleChange}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500">الفئة</label>
              <select 
                name="category"
                required
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                value={formData.category}
                onChange={handleChange}
              >
                {categories.map(cat => <option key={cat.id} value={cat.name}>{cat.name}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500">الوحدة</label>
              <select 
                name="unit"
                required
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                value={formData.unit}
                onChange={handleChange}
              >
                {Object.values(Unit).map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500">المخزون الأولي</label>
              <input 
                type="number" 
                name="initialStock"
                required
                min="0"
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                value={formData.initialStock}
                onChange={handleChange}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500">مستوى إعادة الطلب</label>
              <input 
                type="number" 
                name="reorderLevel"
                required
                min="0"
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                value={formData.reorderLevel}
                onChange={handleChange}
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500">الوصف</label>
            <input 
              type="text" 
              name="description"
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              value={formData.description}
              onChange={handleChange}
            />
          </div>
          <div className="pt-4 flex gap-3">
            <button 
              type="submit"
              className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
            >
              حفظ التعديلات
            </button>
            <button 
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-all"
            >
              إلغاء
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const InventoryTable: React.FC<{ 
  inventory: InventoryItem[], 
  role: UserRole, 
  categories: Category[],
  onAddItem: (item: InventoryItem) => void,
  onUpdateItem: (item: InventoryItem) => void,
  onDeleteItem: (id: string) => void
}> = ({ inventory, role, categories, onAddItem, onUpdateItem, onDeleteItem }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const filtered = inventory.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         item.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.barcode.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const html = `
      <html dir="rtl">
        <head>
          <title>قائمة المخزون - كلية الحقوق والعلوم السياسية</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;700&display=swap');
            body { font-family: 'Tajawal', sans-serif; padding: 40px; }
            h1 { text-align: center; color: #1e293b; margin-bottom: 30px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #e2e8f0; padding: 12px; text-align: right; }
            th { background-color: #f8fafc; font-weight: bold; }
            .header-info { display: flex; justify-content: space-between; margin-bottom: 20px; font-size: 14px; }
            .footer { margin-top: 50px; text-align: center; font-size: 12px; color: #64748b; }
            @media print { .no-print { display: none; } }
          </style>
        </head>
        <body>
          <div class="header-info">
            <div>جامعة غرداية<br/>كلية الحقوق والعلوم السياسية</div>
            <div>التاريخ: ${new Date().toLocaleDateString('ar-DZ')}</div>
          </div>
          <h1>تقرير جرد المخزون الحالي</h1>
          <table>
            <thead>
              <tr>
                <th>المعرف</th>
                <th>الباركود</th>
                <th>اسم المادة</th>
                <th>الفئة</th>
                <th>الرصيد</th>
                <th>الوحدة</th>
              </tr>
            </thead>
            <tbody>
              ${filtered.map(item => `
                <tr>
                  <td>#${item.id}</td>
                  <td>${item.barcode}</td>
                  <td>${item.name}</td>
                  <td>${item.category}</td>
                  <td>${item.currentQty}</td>
                  <td>${item.unit}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div class="footer">تم استخراج هذا التقرير آلياً بواسطة نظام law.Gh. Stock</div>
          <script>window.print(); window.close();</script>
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  };

  const handleExcelExport = () => {
    if (filtered.length === 0) return;
    const worksheet = XLSX.utils.json_to_sheet(filtered);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Inventory");
    XLSX.writeFile(workbook, `inventory_report_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Package className="w-6 h-6 text-indigo-600" />
          المخزون الحالي
        </h2>
        <div className="flex items-center gap-3">
          <button 
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all shadow-sm"
          >
            <Printer size={16} />
            طباعة (PDF)
          </button>
          <button 
            onClick={handleExcelExport}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-xl text-sm font-bold hover:bg-emerald-100 transition-all shadow-sm"
          >
            <FileSpreadsheet size={16} />
            تصدير Excel
          </button>
          {role === UserRole.STOREKEEPER && (
            <button 
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
            >
              <PlusCircle size={16} />
              إضافة صنف جديد
            </button>
          )}
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="بحث (اسم أو باركود)..." 
              className="pr-10 pl-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none w-64"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select 
            className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="all">جميع الفئات</option>
            {categories.map(cat => <option key={cat.id} value={cat.name}>{cat.name}</option>)}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">المعرف</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">الباركود</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">اسم المادة</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">الفئة</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">الرصيد الحالي</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">الوحدة</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">الحالة</th>
                {role === UserRole.STOREKEEPER && <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">إجراءات</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(item => (
                <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 text-xs font-mono text-slate-400">#{item.id}</td>
                  <td className="px-6 py-4 text-xs font-mono text-indigo-600">{item.barcode}</td>
                  <td className="px-6 py-4 font-bold text-slate-900">{item.name}</td>
                  <td className="px-6 py-4 text-sm text-slate-500">{item.category}</td>
                  <td className="px-6 py-4 font-black text-slate-900">{item.currentQty}</td>
                  <td className="px-6 py-4 text-sm text-slate-500">{item.unit}</td>
                  <td className="px-6 py-4">
                    {item.currentQty <= item.reorderLevel ? (
                      <span className="px-2 py-1 bg-rose-100 text-rose-700 text-[10px] font-black rounded-full">منخفض</span>
                    ) : (
                      <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-[10px] font-black rounded-full">متوفر</span>
                    )}
                  </td>
                  {role === UserRole.STOREKEEPER && (
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => setEditingItem(item)} 
                          className="p-1.5 text-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="تعديل"
                        >
                          <Edit size={16} />
                        </button>
                        <button 
                          onClick={() => onDeleteItem(item.id)} 
                          className="p-1.5 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="حذف"
                        >
                          <MinusCircle size={16} />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {editingItem && (
        <EditItemModal 
          item={editingItem} 
          categories={categories} 
          onClose={() => setEditingItem(null)} 
          onSave={(updated) => {
            onUpdateItem(updated);
            setEditingItem(null);
          }} 
        />
      )}

      {isAddModalOpen && (
        <AddItemModal 
          categories={categories} 
          onClose={() => setIsAddModalOpen(false)} 
          onSave={(newItem) => {
            onAddItem(newItem);
            setIsAddModalOpen(false);
          }} 
        />
      )}
    </div>
  );
};

const TransactionForms: React.FC<{
  type: 'inbound' | 'outbound',
  inventory: InventoryItem[],
  categories: Category[],
  onAddInbound: (log: InboundLog) => void,
  onAddOutbound: (log: OutboundLog) => void,
  onAddItem: (item: InventoryItem) => void,
  onManageCategories?: () => void
}> = ({ type, inventory, categories, onAddInbound, onAddOutbound, onAddItem, onManageCategories }) => {
  const [selectedItemId, setSelectedItemId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [recipient, setRecipient] = useState('');
  const [supplier, setSupplier] = useState('');
  const [notes, setNotes] = useState('');
  const [orderNo, setOrderNo] = useState('');
  const [invoiceNo, setInvoiceNo] = useState('');
  const [receiptNo, setReceiptNo] = useState('');
  
  // Extended fields for Inbound/Outbound
  const [inboundItems, setInboundItems] = useState([{ id: Date.now(), itemId: '', quantity: 1 }]);
  const [outboundItems, setOutboundItems] = useState([{ id: Date.now(), itemId: '', quantity: 1, inventoryNo: 'UNIV-GHA-LAW-' }]);
  const [date, setDate] = useState(new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).split('/').join('/'));
  const [recipientEntity, setRecipientEntity] = useState('');
  const [department, setDepartment] = useState('');
  const [officeNumber, setOfficeNumber] = useState('');
  const [recipientEmployeeId, setRecipientEmployeeId] = useState('');
  const [deliveryType, setDeliveryType] = useState<DeliveryType>(DeliveryType.TEMPORARY);
  const [isSigned, setIsSigned] = useState(false);
  const [attachments, setAttachments] = useState<string[]>([]);
  const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setAttachments(prev => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const addOutboundRow = () => {
    setOutboundItems([...outboundItems, { id: Date.now(), itemId: '', quantity: 1, inventoryNo: 'UNIV-GHA-LAW-' }]);
  };

  const addInboundRow = () => {
    setInboundItems([...inboundItems, { id: Date.now(), itemId: '', quantity: 1 }]);
  };

  const removeInboundRow = (id: number) => {
    if (inboundItems.length > 1) {
      setInboundItems(inboundItems.filter(item => item.id !== id));
    }
  };

  const updateInboundRow = (id: number, field: string, value: any) => {
    setInboundItems(inboundItems.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const removeOutboundRow = (id: number) => {
    if (outboundItems.length > 1) {
      setOutboundItems(outboundItems.filter(item => item.id !== id));
    }
  };

  const updateOutboundRow = (id: number, field: string, value: any) => {
    setOutboundItems(outboundItems.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const handleReset = () => {
    setSelectedItemId('');
    setQuantity(1);
    setRecipient('');
    setSupplier('');
    setNotes('');
    setOrderNo('');
    setInvoiceNo('');
    setReceiptNo('');
    setInboundItems([{ id: Date.now(), itemId: '', quantity: 1 }]);
    setOutboundItems([{ id: Date.now(), itemId: '', quantity: 1, inventoryNo: 'UNIV-GHA-LAW-' }]);
    setRecipientEntity('');
    setDepartment('');
    setOfficeNumber('');
    setRecipientEmployeeId('');
    setIsSigned(false);
    setAttachments([]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (type === 'inbound') {
      let successCount = 0;
      inboundItems.forEach(row => {
        const item = inventory.find(i => i.id === row.itemId);
        if (item) {
          onAddInbound({
            id: Math.random().toString(36).substr(2, 9),
            itemId: item.id,
            itemName: item.name,
            quantity: row.quantity,
            unit: item.unit,
            date,
            supplier,
            orderNo,
            invoiceNo,
            receiptNo,
            notes,
            department,
            officeNumber,
            attachments
          });
          successCount++;
        }
      });
      if (successCount === 0) {
        alert('يرجى اختيار مادة واحدة على الأقل');
        return;
      }
    } else {
      let successCount = 0;
      outboundItems.forEach(row => {
        const item = inventory.find(i => i.id === row.itemId);
        if (item) {
          onAddOutbound({
            id: Math.random().toString(36).substr(2, 9),
            itemId: item.id,
            itemName: item.name,
            quantity: row.quantity,
            unit: item.unit,
            date,
            recipientName: recipient,
            recipientEntity,
            department,
            officeNumber,
            recipientEmployeeId,
            deliveryType,
            inventoryNo: row.inventoryNo,
            signature: isSigned ? 'SIGNED_DIGITALLY' : '',
            notes,
            attachments
          });
          successCount++;
        }
      });
      if (successCount === 0) {
        alert('يرجى اختيار مادة واحدة على الأقل');
        return;
      }
    }
    
    handleReset();
    alert('تمت العملية بنجاح وأرشفة السجل تلقائياً');
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        <div className={`p-6 ${type === 'inbound' ? 'bg-emerald-600' : 'bg-amber-600'} text-white`}>
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold flex items-center gap-3">
              {type === 'inbound' ? <PlusCircle /> : <MinusCircle />}
              {type === 'inbound' ? 'تسجيل وارد جديد' : 'تسجيل صادر (صرف عتاد)'}
            </h2>
            <span className="text-xs bg-white/20 px-3 py-1 rounded-full border border-white/30">
              جامعة غرداية - كلية الحقوق والعلوم السياسية
            </span>
          </div>
          <p className="text-white/70 text-sm mt-1">يرجى ملء البيانات بدقة لضمان صحة السجلات الإدارية</p>
        </div>
        
        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          {/* Item Selection Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <Package className="w-4 h-4 text-indigo-600" />
                قائمة المواد والأصناف
              </h3>
              <div className="flex gap-2">
                <button 
                  type="button" 
                  onClick={type === 'inbound' ? addInboundRow : addOutboundRow}
                  className="text-xs bg-indigo-50 text-indigo-600 px-3 py-1 rounded-lg hover:bg-indigo-100 transition-colors font-bold"
                >
                  + إضافة سطر جديد
                </button>
                <button 
                  type="button" 
                  onClick={handleReset}
                  className="text-xs bg-slate-100 text-slate-600 px-3 py-1 rounded-lg hover:bg-slate-200 transition-colors font-bold"
                >
                  مسح
                </button>
              </div>
            </div>
            
            {type === 'inbound' ? (
              <div className="space-y-4">
                {inboundItems.map((row, index) => (
                  <div key={row.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-4 relative group">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">المادة / الصنف ({index + 1})</span>
                      {inboundItems.length > 1 && (
                        <button 
                          type="button" 
                          onClick={() => removeInboundRow(row.id)}
                          className="text-rose-500 hover:text-rose-700 p-1"
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                      <div className="md:col-span-8 space-y-2">
                        <div className="flex justify-between items-center">
                          <label className="text-[10px] font-bold text-slate-500">اختر مادة...</label>
                          <button 
                            type="button" 
                            onClick={onManageCategories}
                            className="text-[9px] text-indigo-600 hover:underline"
                          >
                            + فئة جديدة
                          </button>
                          <button 
                            type="button" 
                            onClick={() => setIsAddItemModalOpen(true)}
                            className="text-[9px] text-emerald-600 hover:underline"
                          >
                            + مادة جديدة
                          </button>
                        </div>
                        <select 
                          required
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                          value={row.itemId}
                          onChange={(e) => updateInboundRow(row.id, 'itemId', e.target.value)}
                        >
                          <option value="">اختر مادة...</option>
                          {inventory.map(item => <option key={item.id} value={item.id}>{item.name} ({item.currentQty} {item.unit})</option>)}
                        </select>
                      </div>
                      <div className="md:col-span-4 space-y-2">
                        <label className="text-[10px] font-bold text-slate-500">الكمية</label>
                        <input 
                          type="number" 
                          min="1" 
                          required
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-bold"
                          value={row.quantity}
                          onChange={(e) => updateInboundRow(row.id, 'quantity', Number(e.target.value))}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {outboundItems.map((row, index) => (
                  <div key={row.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-4 relative group">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">المادة / الصنف ({index + 1})</span>
                      {outboundItems.length > 1 && (
                        <button 
                          type="button" 
                          onClick={() => removeOutboundRow(row.id)}
                          className="text-rose-500 hover:text-rose-700 p-1"
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                      <div className="md:col-span-6 space-y-2">
                        <div className="flex justify-between items-center">
                          <label className="text-[10px] font-bold text-slate-500">اختر مادة...</label>
                          <button 
                            type="button" 
                            onClick={onManageCategories}
                            className="text-[9px] text-indigo-600 hover:underline"
                          >
                            + فئة جديدة
                          </button>
                          <button 
                            type="button" 
                            onClick={() => setIsAddItemModalOpen(true)}
                            className="text-[9px] text-emerald-600 hover:underline"
                          >
                            + مادة جديدة
                          </button>
                        </div>
                        <select 
                          required
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                          value={row.itemId}
                          onChange={(e) => updateOutboundRow(row.id, 'itemId', e.target.value)}
                        >
                          <option value="">اختر مادة...</option>
                          {inventory.map(item => <option key={item.id} value={item.id}>{item.name} ({item.currentQty} {item.unit})</option>)}
                        </select>
                      </div>
                      <div className="md:col-span-2 space-y-2">
                        <label className="text-[10px] font-bold text-slate-500">الكمية</label>
                        <input 
                          type="number" 
                          min="1" 
                          required
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-bold"
                          value={row.quantity}
                          onChange={(e) => updateOutboundRow(row.id, 'quantity', Number(e.target.value))}
                        />
                      </div>
                      <div className="md:col-span-4 space-y-2">
                        <label className="text-[10px] font-bold text-slate-500">رقم الجرد الخاص</label>
                        <input 
                          type="text" 
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-mono"
                          value={row.inventoryNo}
                          onChange={(e) => updateOutboundRow(row.id, 'inventoryNo', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Transaction Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500">تاريخ العملية</label>
              <input 
                type="text" 
                required
                placeholder="DD/MM/YYYY"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            {type === 'inbound' && (
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500">المورد</label>
                <input 
                  type="text" 
                  required
                  placeholder="اسم المورد أو المؤسسة"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={supplier}
                  onChange={(e) => setSupplier(e.target.value)}
                />
              </div>
            )}
          </div>

          {type === 'inbound' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500">رقم سند الطلب</label>
                <input 
                  type="text" 
                  placeholder="رقم سند الطلب (Bon de Commande)"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={orderNo}
                  onChange={(e) => setOrderNo(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500">رقم الفاتورة</label>
                <input 
                  type="text" 
                  placeholder="رقم الفاتورة (Facture)"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={invoiceNo}
                  onChange={(e) => setInvoiceNo(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500">رقم وصل الاستلام</label>
                <input 
                  type="text" 
                  placeholder="رقم وصل الاستلام (Bon de Réception)"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={receiptNo}
                  onChange={(e) => setReceiptNo(e.target.value)}
                />
              </div>
            </div>
          )}

          {type === 'inbound' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500">المصلحة المستفيدة (اختياري)</label>
                <input 
                  type="text" 
                  placeholder="في حال كان الوارد مخصصاً لمصلحة معينة"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500">رقم المكتب (اختياري)</label>
                <input 
                  type="text" 
                  placeholder="رقم المكتب المخصص"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={officeNumber}
                  onChange={(e) => setOfficeNumber(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Recipient Details Section */}
          {type === 'outbound' && (
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-600" />
                تفاصيل المستلم والموقع
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500">المؤسسة المستلمة</label>
                  <input 
                    type="text" 
                    placeholder="اسم المؤسسة (إذا وجد)"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={recipientEntity}
                    onChange={(e) => setRecipientEntity(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500">المصلحة / القسم</label>
                  <input 
                    type="text" 
                    placeholder="مثال: الأمانة العامة"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500">رقم المكتب</label>
                  <input 
                    type="text" 
                    placeholder="رقم المكتب أو القاعة"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={officeNumber}
                    onChange={(e) => setOfficeNumber(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500">اسم المستلم</label>
                  <input 
                    type="text" 
                    required
                    placeholder="الاسم واللقب الكامل"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500">رقم الموظف</label>
                  <input 
                    type="text" 
                    placeholder="رقم بطاقة المهنة"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={recipientEmployeeId}
                    onChange={(e) => setRecipientEmployeeId(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500">طبيعة التسليم</label>
                  <select 
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={deliveryType}
                    onChange={(e) => setDeliveryType(e.target.value as DeliveryType)}
                  >
                    <option value={DeliveryType.TEMPORARY}>{DeliveryType.TEMPORARY}</option>
                    <option value={DeliveryType.PERMANENT}>{DeliveryType.PERMANENT}</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Signature & Notes */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <div className={type === 'outbound' ? "grid grid-cols-1 md:grid-cols-2 gap-6" : "space-y-4"}>
              {type === 'outbound' && (
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500">توقيع المستلم (رقمياً)</label>
                  <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 flex flex-col items-center justify-center bg-slate-50 gap-2">
                    <div className="flex items-center gap-2">
                      <input 
                        type="checkbox" 
                        id="signature" 
                        className="w-4 h-4 text-indigo-600"
                        checked={isSigned}
                        onChange={(e) => setIsSigned(e.target.checked)}
                      />
                      <label htmlFor="signature" className="text-xs font-bold text-slate-700">أقر باستلام المواد المذكورة أعلاه</label>
                    </div>
                    <button type="button" onClick={() => setIsSigned(false)} className="text-[10px] text-rose-500 hover:underline">مسح التوقيع</button>
                  </div>
                </div>
              )}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500">ملاحظات إضافية</label>
                <textarea 
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none h-24 resize-none text-sm"
                  placeholder="أي تفاصيل أو شروط خاصة بالعملية..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Attachments Section */}
          <div className="space-y-4 p-6 bg-slate-50 rounded-2xl border border-slate-100">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <ClipboardCheck className="w-4 h-4 text-indigo-600" />
              المرفقات والمستندات (خارج التطبيق)
            </h3>
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-500">تحميل مستندات (صور، PDF، فواتير...)</label>
              <input 
                type="file" 
                multiple 
                onChange={handleFileChange}
                className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
              />
              {attachments.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {attachments.map((att, i) => (
                    <div key={i} className="relative group">
                      <div className="w-16 h-16 bg-white border border-slate-200 rounded-lg flex items-center justify-center overflow-hidden shadow-sm">
                        {att.startsWith('data:image') ? (
                          <img src={att} alt="attachment" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          <FileText className="w-8 h-8 text-slate-300" />
                        )}
                      </div>
                      <button 
                        type="button"
                        onClick={() => setAttachments(prev => prev.filter((_, idx) => idx !== i))}
                        className="absolute -top-2 -right-2 bg-rose-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X size={10} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="pt-4">
            <p className="text-[10px] text-slate-400 mb-4">* جميع العمليات يتم أرشفتها تلقائياً في سجل الحركة اليومي.</p>
            <button 
              type="submit"
              className={`w-full py-4 rounded-xl font-bold text-white shadow-lg transition-all ${type === 'inbound' ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200' : 'bg-amber-600 hover:bg-amber-700 shadow-amber-200'}`}
            >
              تأكيد وتسجيل العملية
            </button>
          </div>
        </form>
      </div>

      {isAddItemModalOpen && (
        <AddItemModal 
          categories={categories} 
          onClose={() => setIsAddItemModalOpen(false)} 
          onSave={(newItem) => {
            onAddItem(newItem);
            setIsAddItemModalOpen(false);
          }} 
        />
      )}
    </div>
  );
};

const CategoryManager: React.FC<{
  categories: Category[],
  onAdd: (c: Category) => void,
  onUpdate: (c: Category) => void,
  onDelete: (id: string) => void
}> = ({ categories, onAdd, onUpdate, onDelete }) => {
  const [newName, setNewName] = useState('');
  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
        <Tags className="w-6 h-6 text-indigo-600" />
        إدارة فئات المواد
      </h2>
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex gap-3 mb-6">
          <input 
            type="text" 
            placeholder="اسم الفئة الجديدة..." 
            className="flex-1 px-4 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
          <button 
            onClick={() => {
              if (newName) {
                onAdd({ id: Math.random().toString(36).substr(2, 9), name: newName });
                setNewName('');
              }
            }}
            className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors"
          >
            إضافة
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {categories.map(cat => (
            <div key={cat.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
              <span className="font-bold text-slate-700">{cat.name}</span>
              <button onClick={() => onDelete(cat.id)} className="text-rose-500 hover:text-rose-700">حذف</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const AIAssistant: React.FC<{ inventory: InventoryItem[], inbound: InboundLog[], outbound: OutboundLog[] }> = ({ inventory, inbound, outbound }) => {
  const { addItem, auditLogs } = useInventoryStore();
  const [messages, setMessages] = useState<{ role: 'user' | 'ai', text: string }[]>([
    { role: 'ai', text: 'مرحباً! أنا مساعدك الذكي. يمكنني إعطاؤك تقارير سريعة، تحليل المخزون، أو الإجابة على أي استفسار حول المواد المتوفرة. كيف يمكنني مساعدتك اليوم؟' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight);
  }, [messages]);

  // Function declarations for Gemini
  const tools: { functionDeclarations: FunctionDeclaration[] }[] = [{
    functionDeclarations: [
      {
        name: "get_inventory_summary",
        description: "الحصول على ملخص إحصائي للمخزون الحالي (إجمالي المواد، المواد المنخفضة، إلخ)",
        parameters: { type: Type.OBJECT, properties: {} }
      },
      {
        name: "search_item",
        description: "البحث عن مادة معينة في المخزن بالاسم أو الباركود",
        parameters: {
          type: Type.OBJECT,
          properties: {
            query: { type: Type.STRING, description: "اسم المادة أو الباركود للبحث عنه" }
          },
          required: ["query"]
        }
      },
      {
        name: "add_item",
        description: "إضافة مادة جديدة للمخزن",
        parameters: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING, description: "اسم المادة" },
            category: { type: Type.STRING, description: "الفئة" },
            unit: { type: Type.STRING, description: "الوحدة (رزمة، قطعة، إلخ)" },
            initialStock: { type: Type.NUMBER, description: "الرصيد الأولي" },
            reorderLevel: { type: Type.NUMBER, description: "حد إعادة الطلب" }
          },
          required: ["name", "category", "unit", "initialStock"]
        }
      },
      {
        name: "get_low_stock_items",
        description: "الحصول على قائمة المواد التي رصيدها منخفض (أقل من حد إعادة الطلب)",
        parameters: { type: Type.OBJECT, properties: {} }
      },
      {
        name: "get_recent_transactions",
        description: "الحصول على آخر العمليات (وارد وصادر) التي تمت في المخزن",
        parameters: {
          type: Type.OBJECT,
          properties: {
            limit: { type: Type.NUMBER, description: "عدد العمليات المطلوب عرضها (الافتراضي 5)" }
          }
        }
      },
      {
        name: "get_audit_logs_summary",
        description: "الحصول على ملخص لآخر التغييرات الإدارية (إضافة، حذف، تحديث) في النظام",
        parameters: {
          type: Type.OBJECT,
          properties: {
            limit: { type: Type.NUMBER, description: "عدد السجلات المطلوب عرضها (الافتراضي 5)" }
          }
        }
      }
    ]
  }];

  const handleSend = async () => {
    if (!input.trim()) return;
    
    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsTyping(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      const model = "gemini-3-flash-preview";
      
      const inventorySummary = inventory.map(i => `${i.name} (${i.category}): ${i.currentQty} ${i.unit}`).join('\n');
      const systemPrompt = `أنت مساعد ذكي لنظام إدارة مخزون كلية الحقوق بجامعة غرداية. 
      لديك الصلاحية لتنفيذ أوامر مثل إضافة مواد أو البحث عنها.
      البيانات الحالية:
      ${inventorySummary}
      
      أجب باختصار وباللغة العربية.`;

      const response = await ai.models.generateContent({
        model,
        contents: userMsg,
        config: { 
          systemInstruction: systemPrompt,
          tools: tools
        }
      });

      const functionCalls = response.functionCalls;
      if (functionCalls) {
        for (const call of functionCalls) {
          if (call.name === 'get_inventory_summary') {
            const stats = {
              total: inventory.length,
              lowStock: inventory.filter(i => i.currentQty <= i.reorderLevel).length,
              categories: [...new Set(inventory.map(i => i.category))].length
            };
            setMessages(prev => [...prev, { role: 'ai', text: `إليك ملخص المخزن: إجمالي المواد ${stats.total}، المواد المنخفضة ${stats.lowStock}، موزعة على ${stats.categories} فئات.` }]);
          } else if (call.name === 'search_item') {
            const query = (call.args as any).query.toLowerCase();
            const found = inventory.filter(i => i.name.toLowerCase().includes(query) || i.barcode.includes(query));
            if (found.length > 0) {
              const resultText = found.map(i => `- ${i.name}: الرصيد ${i.currentQty} ${i.unit}`).join('\n');
              setMessages(prev => [...prev, { role: 'ai', text: `وجدت المواد التالية:\n${resultText}` }]);
            } else {
              setMessages(prev => [...prev, { role: 'ai', text: `عذراً، لم أجد أي مادة تطابق "${query}".` }]);
            }
          } else if (call.name === 'add_item') {
            const args = call.args as any;
            const newItem: InventoryItem = {
              id: Math.random().toString(36).substr(2, 9),
              barcode: Math.floor(100000000 + Math.random() * 900000000).toString(),
              name: args.name,
              description: '',
              category: args.category,
              unit: args.unit as any,
              initialStock: args.initialStock,
              inbound: 0,
              outbound: 0,
              currentQty: args.initialStock,
              reorderLevel: args.reorderLevel || 5
            };
            addItem(newItem);
            setMessages(prev => [...prev, { role: 'ai', text: `تمت إضافة المادة "${args.name}" بنجاح إلى المخزن.` }]);
          } else if (call.name === 'get_low_stock_items') {
            const lowStock = inventory.filter(i => i.currentQty <= i.reorderLevel);
            if (lowStock.length > 0) {
              const resultText = lowStock.map(i => `- ${i.name}: الرصيد الحالي ${i.currentQty} (الحد: ${i.reorderLevel})`).join('\n');
              setMessages(prev => [...prev, { role: 'ai', text: `تنبيه! المواد التالية رصيدها منخفض:\n${resultText}` }]);
            } else {
              setMessages(prev => [...prev, { role: 'ai', text: `لا توجد مواد رصيدها منخفض حالياً. كل شيء تحت السيطرة!` }]);
            }
          } else if (call.name === 'get_recent_transactions') {
            const limit = (call.args as any).limit || 5;
            const combined = [
              ...inbound.map(l => ({ ...l, type: 'وارد' })),
              ...outbound.map(l => ({ ...l, type: 'صادر' }))
            ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
             .slice(0, limit);
            
            if (combined.length > 0) {
              const resultText = combined.map(l => `- [${l.type}] ${l.itemName}: ${l.quantity} ${l.unit} بتاريخ ${l.date}`).join('\n');
              setMessages(prev => [...prev, { role: 'ai', text: `إليك آخر ${combined.length} عمليات:\n${resultText}` }]);
            } else {
              setMessages(prev => [...prev, { role: 'ai', text: `لا توجد سجلات لعمليات حديثة.` }]);
            }
          } else if (call.name === 'get_audit_logs_summary') {
            const limit = (call.args as any).limit || 5;
            const logs = auditLogs.slice().reverse().slice(0, limit);
            if (logs.length > 0) {
              const resultText = logs.map(l => `- [${l.action}] ${l.details} (بتاريخ ${new Date(l.timestamp).toLocaleString('ar-DZ')})`).join('\n');
              setMessages(prev => [...prev, { role: 'ai', text: `إليك آخر ${logs.length} تغييرات إدارية:\n${resultText}` }]);
            } else {
              setMessages(prev => [...prev, { role: 'ai', text: `لا توجد سجلات تغييرات إدارية حالياً.` }]);
            }
          }
        }
      } else {
        setMessages(prev => [...prev, { role: 'ai', text: response.text || 'عذراً، لم أستطع معالجة الطلب.' }]);
      }
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { role: 'ai', text: 'حدث خطأ أثناء الاتصال بالذكاء الاصطناعي. يرجى المحاولة لاحقاً.' }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-180px)] flex flex-col bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden m-6">
      <div className="p-4 bg-indigo-600 text-white flex items-center gap-3">
        <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
          <Sparkles className="w-6 h-6" />
        </div>
        <div>
          <h3 className="font-bold">المساعد الذكي (Gemini AI)</h3>
          <p className="text-[10px] opacity-80">تحليل فوري للمخزون والبيانات</p>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-start' : 'justify-end'}`}>
            <div className={`max-w-[80%] p-4 rounded-2xl text-sm ${
              m.role === 'user' 
                ? 'bg-white text-slate-800 border border-slate-200 shadow-sm rounded-tr-none' 
                : 'bg-indigo-600 text-white shadow-md rounded-tl-none'
            }`}>
              {m.text}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-end">
            <div className="bg-indigo-100 text-indigo-600 p-3 rounded-2xl rounded-tl-none flex gap-1">
              <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"></div>
              <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
              <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.4s]"></div>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 bg-white border-t border-slate-100 flex gap-2">
        <input 
          type="text" 
          placeholder="اسأل عن أي شيء في المخزن..."
          className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
        />
        <button 
          onClick={handleSend}
          disabled={isTyping}
          className="p-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50"
        >
          <Send size={20} />
        </button>
      </div>
    </div>
  );
};

const DevKit: React.FC = () => {
  const { setInventory, setInboundLogs, setOutboundLogs, setCategories } = useInventoryStore();
  
  const generateSampleData = () => {
    if (confirm('سيتم إضافة بيانات تجريبية للمخزن. هل أنت متأكد؟')) {
      setInventory(INITIAL_INVENTORY);
      setInboundLogs(INITIAL_INBOUND);
      setOutboundLogs(INITIAL_OUTBOUND);
      setCategories(INITIAL_CATEGORIES);
      alert('تم توليد البيانات التجريبية بنجاح!');
      window.location.reload();
    }
  };

  const clearAllData = () => {
    if (confirm('تحذير: سيتم مسح جميع البيانات نهائياً. هل أنت متأكد؟')) {
      setInventory([]);
      setInboundLogs([]);
      setOutboundLogs([]);
      setCategories([]);
      localStorage.clear();
      alert('تم مسح جميع البيانات.');
      window.location.reload();
    }
  };

  return (
    <div className="p-12 max-w-2xl mx-auto space-y-8">
      <div className="text-center space-y-2">
        <Code2 className="w-12 h-12 mx-auto text-indigo-600 opacity-50" />
        <h2 className="text-2xl font-bold text-slate-800">أدوات المطورين والتحكم المتقدم</h2>
        <p className="text-slate-500 text-sm">هذه الأدوات مخصصة للاختبار والإعداد السريع للنظام.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button 
          onClick={generateSampleData}
          className="p-6 bg-white border border-slate-200 rounded-2xl hover:border-indigo-500 hover:shadow-md transition-all text-right space-y-2 group"
        >
          <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors">
            <Database size={20} />
          </div>
          <h3 className="font-bold text-slate-800">توليد بيانات تجريبية</h3>
          <p className="text-xs text-slate-500">ملء المخزن ببيانات افتراضية لاختبار التقارير والرسوم البيانية.</p>
        </button>

        <button 
          onClick={clearAllData}
          className="p-6 bg-white border border-slate-200 rounded-2xl hover:border-rose-500 hover:shadow-md transition-all text-right space-y-2 group"
        >
          <div className="w-10 h-10 bg-rose-50 text-rose-600 rounded-lg flex items-center justify-center group-hover:bg-rose-600 group-hover:text-white transition-colors">
            <Trash2 size={20} />
          </div>
          <h3 className="font-bold text-slate-800">تصفير النظام بالكامل</h3>
          <p className="text-xs text-slate-500">مسح جميع المواد، السجلات، والفئات والعودة للحالة الصفرية.</p>
        </button>
      </div>
    </div>
  );
};
const DetailedReport: React.FC<{ 
  inventory: InventoryItem[], 
  inbound: InboundLog[], 
  outbound: OutboundLog[], 
  categories: Category[] 
}> = ({ inventory, inbound, outbound, categories }) => {
  const [reportType, setReportType] = useState<'inventory' | 'inbound' | 'outbound'>('inventory');
  const [isLoading, setIsLoading] = useState(false);
  const chartRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => setIsLoading(false), 400);
    return () => clearTimeout(timer);
  }, [reportType]);

  const chartData = useMemo(() => {
    if (reportType === 'inventory') {
      return inventory.reduce((acc: any[], item) => {
        const existing = acc.find(c => c.name === item.category);
        if (existing) {
          existing.value += item.currentQty;
        } else {
          acc.push({ name: item.category, value: item.currentQty });
        }
        return acc;
      }, []);
    } else {
      const logs = reportType === 'inbound' ? inbound : outbound;
      const data = logs.reduce((acc: any[], log) => {
        const existing = acc.find(c => c.name === log.itemName);
        if (existing) {
          existing.value += log.quantity;
        } else {
          acc.push({ name: log.itemName, value: log.quantity });
        }
        return acc;
      }, []);
      return data.sort((a, b) => b.value - a.value).slice(0, 8);
    }
  }, [reportType, inventory, inbound, outbound]);

  const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];

  const downloadExcel = () => {
    const data = reportType === 'inventory' ? inventory : reportType === 'inbound' ? inbound : outbound;
    if (data.length === 0) return;

    let filteredData: any[] = [];
    
    if (reportType === 'inventory') {
      filteredData = inventory.map(i => ({
        'المعرف': i.id,
        'اسم المادة': i.name,
        'الفئة': i.category,
        'الرصيد الحالي': i.currentQty,
        'الوحدة': i.unit,
        'الرصيد الأولي': i.initialStock,
        'حد إعادة الطلب': i.reorderLevel
      }));
    } else if (reportType === 'inbound') {
      filteredData = inbound.map(i => ({
        'التاريخ': i.date,
        'المادة': i.itemName,
        'الكمية': i.quantity,
        'الوحدة': i.unit,
        'المورد': i.supplier,
        'المصلحة': i.department || '/',
        'المكتب': i.officeNumber || '/',
        'رقم السند': i.orderNo || '/',
        'رقم الفاتورة': i.invoiceNo || '/',
        'رقم الوصل': i.receiptNo || '/',
        'ملاحظات': i.notes || '/'
      }));
    } else {
      filteredData = outbound.map(i => ({
        'التاريخ': i.date,
        'المادة': i.itemName,
        'الكمية': i.quantity,
        'الوحدة': i.unit,
        'المستلم': i.recipientName,
        'المصلحة': i.department || '/',
        'المكتب': i.officeNumber || '/',
        'الجهة': i.recipientEntity || '/',
        'رقم الجرد': i.inventoryNo || '/',
        'نوع التسليم': i.deliveryType,
        'ملاحظات': i.notes || '/'
      }));
    }

    const worksheet = XLSX.utils.json_to_sheet(filteredData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, reportType);
    
    XLSX.writeFile(workbook, `${reportType}_report_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const downloadCSV = (data: any[], filename: string) => {
    if (data.length === 0) return;
    
    let headers: string[] = [];
    let rows: string[][] = [];

    if (reportType === 'inventory') {
      headers = ['المعرف', 'اسم المادة', 'الفئة', 'الرصيد الحالي', 'الوحدة', 'الرصيد الأولي', 'حد إعادة الطلب'];
      rows = inventory.map(i => [
        i.id, i.name, i.category, i.currentQty.toString(), i.unit, i.initialStock.toString(), i.reorderLevel.toString()
      ]);
    } else if (reportType === 'inbound') {
      headers = ['التاريخ', 'المادة', 'الكمية', 'الوحدة', 'المورد', 'المصلحة', 'المكتب', 'رقم السند', 'رقم الفاتورة', 'رقم الوصل', 'ملاحظات'];
      rows = inbound.map(i => [
        i.date, i.itemName, i.quantity.toString(), i.unit, i.supplier, i.department || '/', i.officeNumber || '/', i.orderNo || '/', i.invoiceNo || '/', i.receiptNo || '/', i.notes || '/'
      ]);
    } else {
      headers = ['التاريخ', 'المادة', 'الكمية', 'الوحدة', 'المستلم', 'المصلحة', 'المكتب', 'الجهة', 'رقم الجرد', 'نوع التسليم', 'ملاحظات'];
      rows = outbound.map(i => [
        i.date, i.itemName, i.quantity.toString(), i.unit, i.recipientName, i.department || '/', i.officeNumber || '/', i.recipientEntity || '/', i.inventoryNo || '/', i.deliveryType, i.notes || '/'
      ]);
    }

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(v => `"${v}"`).join(','))
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadAttachment = (base64: string, index: number) => {
    const link = document.createElement('a');
    link.href = base64;
    link.download = `attachment_${index}_${Date.now()}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = async () => {
    setIsLoading(true);
    let chartImage = '';
    
    // Wait a bit for charts to be fully rendered
    await new Promise(resolve => setTimeout(resolve, 500));

    if (chartRef.current) {
      try {
        const canvas = await html2canvas(chartRef.current, {
          backgroundColor: '#ffffff',
          scale: 2,
          logging: false,
          useCORS: true
        });
        chartImage = canvas.toDataURL('image/png');
      } catch (err) {
        console.error('Failed to capture chart:', err);
      }
    }

    const printWindow = window.open('', '_blank');
    setIsLoading(false);
    if (!printWindow) return;

    const title = reportType === 'inventory' ? 'تقرير جرد المخزون' : reportType === 'inbound' ? 'سجل الواردات' : 'سجل الصادرات';
    const data = reportType === 'inventory' ? inventory : reportType === 'inbound' ? inbound : outbound;

    const html = `
      <html dir="rtl">
        <head>
          <title>${title}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;700&display=swap');
            body { font-family: 'Tajawal', sans-serif; padding: 40px; color: #1e293b; }
            .header-info { display: flex; justify-content: space-between; margin-bottom: 30px; font-size: 12px; border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; }
            h1 { text-align: center; color: #1e293b; margin: 20px 0; font-size: 24px; }
            .chart-container { text-align: center; margin: 30px 0; border: 1px solid #e2e8f0; padding: 20px; border-radius: 12px; }
            .chart-container img { max-width: 100%; height: auto; }
            .chart-title { font-weight: bold; margin-bottom: 15px; color: #475569; font-size: 16px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #e2e8f0; padding: 10px; text-align: right; font-size: 11px; }
            th { background-color: #f8fafc; font-weight: bold; color: #475569; }
            .footer { margin-top: 50px; text-align: center; font-size: 10px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 20px; }
            @media print { 
              body { padding: 20px; }
              .no-print { display: none; }
              .chart-container { break-inside: avoid; }
              table { break-inside: auto; }
              tr { break-inside: avoid; break-after: auto; }
            }
          </style>
        </head>
        <body>
          <div class="header-info">
            <div>جامعة غرداية<br/>كلية الحقوق والعلوم السياسية<br/>مصلحة الوسائل والنشاطات</div>
            <div style="text-align: left;">التاريخ: ${new Date().toLocaleDateString('ar-DZ')}<br/>الوقت: ${new Date().toLocaleTimeString('ar-DZ')}</div>
          </div>
          <h1>${title}</h1>
          
          ${chartImage ? `
            <div class="chart-container">
              <div class="chart-title">${reportType === 'inventory' ? 'توزيع المخزون حسب الفئات' : 'أكثر المواد تداولاً (الكمية الإجمالية)'}</div>
              <img src="${chartImage}" />
            </div>
          ` : ''}

          <table>
            <thead>
              ${reportType === 'inventory' ? `
                <tr>
                  <th>المعرف</th>
                  <th>اسم المادة</th>
                  <th>الفئة</th>
                  <th>الرصيد</th>
                  <th>الوحدة</th>
                </tr>
              ` : `
                <tr>
                  <th>التاريخ</th>
                  <th>المادة</th>
                  <th>الكمية</th>
                  <th>${reportType === 'inbound' ? 'المورد' : 'المستلم'}</th>
                  <th>المصلحة</th>
                  <th>المكتب</th>
                  <th>ملاحظات</th>
                </tr>
              `}
            </thead>
            <tbody>
              ${data.map(item => {
                if (reportType === 'inventory') {
                  const i = item as InventoryItem;
                  return `
                    <tr>
                      <td>#${i.id}</td>
                      <td>${i.name}</td>
                      <td>${i.category}</td>
                      <td>${i.currentQty}</td>
                      <td>${i.unit}</td>
                    </tr>
                  `;
                } else if (reportType === 'inbound') {
                  const i = item as InboundLog;
                  return `
                    <tr>
                      <td>${i.date}</td>
                      <td>${i.itemName}</td>
                      <td>+${i.quantity}</td>
                      <td>${i.supplier}</td>
                      <td>${i.department || '/'}</td>
                      <td>${i.officeNumber || '/'}</td>
                      <td>${i.notes || '/'}</td>
                    </tr>
                  `;
                } else {
                  const i = item as OutboundLog;
                  return `
                    <tr>
                      <td>${i.date}</td>
                      <td>${i.itemName}</td>
                      <td>-${i.quantity}</td>
                      <td>${i.recipientName}</td>
                      <td>${i.department || '/'}</td>
                      <td>${i.officeNumber || '/'}</td>
                      <td>${i.notes || '/'}</td>
                    </tr>
                  `;
                }
              }).join('')}
            </tbody>
          </table>
          <div class="footer">تم استخراج هذا التقرير آلياً بواسطة نظام law.Gh. Stock - جامعة غرداية</div>
          <script>
            window.onload = () => {
              setTimeout(() => {
                window.print();
                // window.close(); // Optional: close after print
              }, 500);
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <FileText className="w-6 h-6 text-indigo-600" />
          التقارير التفصيلية والمستندات
        </h2>
        <div className="flex bg-slate-100 p-1 rounded-xl">
          <button 
            onClick={() => setReportType('inventory')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${reportType === 'inventory' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            جرد المخزون
          </button>
          <button 
            onClick={() => setReportType('inbound')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${reportType === 'inbound' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            سجل الواردات
          </button>
          <button 
            onClick={() => setReportType('outbound')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${reportType === 'outbound' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            سجل الصادرات
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <span className="text-sm font-bold text-slate-600">
            {reportType === 'inventory' ? 'قائمة الجرد الكاملة' : reportType === 'inbound' ? 'سجل عمليات التوريد' : 'سجل عمليات الصرف'}
          </span>
          <div className="flex gap-2">
            <button 
              onClick={handlePrint}
              disabled={isLoading}
              className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-50 transition-all disabled:opacity-50"
            >
              <Printer size={14} />
              {isLoading ? 'جاري التحضير...' : 'طباعة (PDF)'}
            </button>
            <button 
              onClick={downloadExcel}
              className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-lg text-xs font-bold hover:bg-emerald-100 transition-all"
            >
              <FileSpreadsheet size={14} />
              تصدير Excel
            </button>
            <button 
              onClick={() => downloadCSV(
                reportType === 'inventory' ? inventory : reportType === 'inbound' ? inbound : outbound,
                reportType
              )}
              className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-bold hover:bg-indigo-100 transition-all"
            >
              <Download size={14} />
              تصدير CSV
            </button>
          </div>
        </div>

        {/* Charts Section for Print and View */}
        <div className="p-6 bg-slate-50/30 border-b border-slate-100">
          <div ref={chartRef} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-indigo-600" />
              {reportType === 'inventory' ? 'تحليل المخزون حسب الفئات' : 'تحليل الكميات المتداولة (أعلى 8 مواد)'}
            </h3>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                {reportType === 'inventory' ? (
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                ) : (
                  <BarChart data={chartData} layout="vertical" margin={{ left: 40, right: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" hide />
                    <YAxis 
                      dataKey="name" 
                      type="category" 
                      width={100} 
                      tick={{ fontSize: 10, fontWeight: 'bold' }}
                    />
                    <Tooltip 
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Bar 
                      dataKey="value" 
                      fill="#6366f1" 
                      radius={[0, 4, 4, 0]} 
                      barSize={20}
                      label={{ position: 'right', fontSize: 10, fontWeight: 'bold' }}
                    />
                  </BarChart>
                )}
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto relative">
          {isLoading && (
            <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] z-10 flex items-center justify-center">
              <div className="flex flex-col items-center gap-2">
                <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-xs font-bold text-indigo-600">جاري معالجة البيانات...</span>
              </div>
            </div>
          )}
          <table className="w-full text-right text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              {reportType === 'inventory' ? (
                <tr>
                  <th className="px-6 py-3 font-bold text-slate-500">المعرف</th>
                  <th className="px-6 py-3 font-bold text-slate-500">المادة</th>
                  <th className="px-6 py-3 font-bold text-slate-500">الفئة</th>
                  <th className="px-6 py-3 font-bold text-slate-500">الرصيد</th>
                  <th className="px-6 py-3 font-bold text-slate-500">الوحدة</th>
                </tr>
              ) : (
                <tr>
                  <th className="px-6 py-3 font-bold text-slate-500">التاريخ</th>
                  <th className="px-6 py-3 font-bold text-slate-500">المادة</th>
                  <th className="px-6 py-3 font-bold text-slate-500">الكمية</th>
                  <th className="px-6 py-3 font-bold text-slate-500">{reportType === 'inbound' ? 'المورد' : 'المستلم'}</th>
                  <th className="px-6 py-3 font-bold text-slate-500">المصلحة</th>
                  <th className="px-6 py-3 font-bold text-slate-500">المكتب</th>
                  <th className="px-6 py-3 font-bold text-slate-500">المرفقات</th>
                </tr>
              )}
            </thead>
            <tbody className="divide-y divide-slate-100">
              {reportType === 'inventory' && inventory.map(item => (
                <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-mono text-slate-400">#{item.id}</td>
                  <td className="px-6 py-4 font-bold">{item.name}</td>
                  <td className="px-6 py-4 text-slate-500">{item.category}</td>
                  <td className="px-6 py-4 font-black">{item.currentQty}</td>
                  <td className="px-6 py-4 text-slate-500">{item.unit}</td>
                </tr>
              ))}
              {reportType === 'inbound' && inbound.map(log => (
                <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 text-slate-500">{log.date}</td>
                  <td className="px-6 py-4 font-bold">{log.itemName}</td>
                  <td className="px-6 py-4 font-black text-emerald-600">+{log.quantity}</td>
                  <td className="px-6 py-4 text-slate-600">{log.supplier}</td>
                  <td className="px-6 py-4 text-slate-500">{log.department || '/'}</td>
                  <td className="px-6 py-4 text-slate-500">{log.officeNumber || '/'}</td>
                  <td className="px-6 py-4">
                    <div className="flex gap-1">
                      {log.attachments?.map((att, i) => (
                        <button 
                          key={i} 
                          onClick={() => handleDownloadAttachment(att, i)}
                          className="p-1 bg-slate-100 rounded hover:bg-slate-200 text-slate-500"
                          title="تحميل المرفق"
                        >
                          <Download size={12} />
                        </button>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
              {reportType === 'outbound' && outbound.map(log => (
                <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 text-slate-500">{log.date}</td>
                  <td className="px-6 py-4 font-bold">{log.itemName}</td>
                  <td className="px-6 py-4 font-black text-amber-600">-{log.quantity}</td>
                  <td className="px-6 py-4 text-slate-600">{log.recipientName}</td>
                  <td className="px-6 py-4 text-slate-500">{log.department || '/'}</td>
                  <td className="px-6 py-4 text-slate-500">{log.officeNumber || '/'}</td>
                  <td className="px-6 py-4">
                    <div className="flex gap-1">
                      {log.attachments?.map((att, i) => (
                        <button 
                          key={i} 
                          onClick={() => handleDownloadAttachment(att, i)}
                          className="p-1 bg-slate-100 rounded hover:bg-slate-200 text-slate-500"
                          title="تحميل المرفق"
                        >
                          <Download size={12} />
                        </button>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
const AnnualInventory: React.FC<{ inventory: InventoryItem[] }> = ({ inventory }) => {
  const { addAuditLog } = useInventoryStore();
  const [department, setDepartment] = useState('');
  const [officeNumber, setOfficeNumber] = useState('');
  const [scannedItems, setScannedItems] = useState<{
    id: string;
    itemId: string;
    itemName: string;
    barcode: string;
    status: 'good' | 'broken' | 'missing';
    timestamp: string;
  }[]>([]);
  const [currentBarcode, setCurrentBarcode] = useState('');

  const handleScan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentBarcode) return;

    // Simulate finding item by barcode (in real app, barcode might be inventoryNo or a separate field)
    // For demo, we'll try to match inventoryNo or just pick a random item if not found
    const item = inventory.find(i => i.id === currentBarcode || currentBarcode.includes(i.id));
    
    if (item) {
      const newItem = {
        id: Math.random().toString(36).substr(2, 9),
        itemId: item.id,
        itemName: item.name,
        barcode: currentBarcode,
        status: 'good' as const,
        timestamp: new Date().toLocaleString('ar-DZ')
      };
      setScannedItems([newItem, ...scannedItems]);
      setCurrentBarcode('');
    } else {
      alert('لم يتم العثور على مادة بهذا الرمز في قاعدة البيانات.');
    }
  };

  const updateStatus = (id: string, status: 'good' | 'broken' | 'missing') => {
    setScannedItems(scannedItems.map(item => item.id === id ? { ...item, status } : item));
  };

  const removeItem = (id: string) => {
    setScannedItems(scannedItems.filter(item => item.id !== id));
  };

  const handleSave = () => {
    if (scannedItems.length === 0) {
      alert('لا يمكن حفظ جرد فارغ.');
      return;
    }
    if (!department || !officeNumber) {
      alert('يرجى تحديد المصلحة ورقم المكتب.');
      return;
    }

    const auditLog: AuditLog = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
      userId: 'نظام الجرد السنوي',
      action: 'جرد سنوي للمكتب',
      details: `جرد المصلحة: ${department}، مكتب: ${officeNumber}`,
      department,
      officeNumber,
      items: scannedItems.map(item => ({
        itemId: item.itemId,
        itemName: item.itemName,
        barcode: item.barcode,
        status: item.status,
        timestamp: item.timestamp
      }))
    };

    addAuditLog(auditLog);
    alert('تم حفظ الجرد بنجاح في سجلات النظام.');
    setScannedItems([]);
    setDepartment('');
    setOfficeNumber('');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <ClipboardCheck className="w-6 h-6 text-indigo-600" />
            الجرد السنوي للمكاتب والوسائل
          </h2>
          <p className="text-slate-500 text-sm">عملية التحقق الميداني من الأصول والمعدات باستخدام الباركود</p>
        </div>
        <div className="flex gap-2 print:hidden">
          <button 
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-50 transition-all shadow-sm"
          >
            <Printer size={18} />
            طباعة محضر الجرد
          </button>
          <button 
            onClick={handleSave}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
          >
            <CheckCircle2 size={18} />
            حفظ الجرد الحالي
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6 print:hidden">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-600" />
              تحديد الموقع الحالي
            </h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500">المصلحة / القسم</label>
                <input 
                  type="text" 
                  placeholder="مثال: الأمانة العامة"
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500">رقم المكتب</label>
                <input 
                  type="text" 
                  placeholder="مثال: مكتب رقم 12"
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                  value={officeNumber}
                  onChange={(e) => setOfficeNumber(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <Search className="w-4 h-4 text-indigo-600" />
              ابدأ مسح الأجهزة
            </h3>
            <form onSubmit={handleScan} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500">رمز الباركود / المعرف</label>
                <div className="relative">
                  <input 
                    type="text" 
                    placeholder="امسح الباركود هنا..."
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                    value={currentBarcode}
                    onChange={(e) => setCurrentBarcode(e.target.value)}
                    autoFocus
                  />
                  <Code2 className="absolute left-3 top-3.5 text-slate-400 w-5 h-5" />
                </div>
              </div>
              <button 
                type="submit"
                className="w-full py-3 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-900 transition-all"
              >
                إضافة للجرد
              </button>
            </form>
          </div>

          <div className="bg-indigo-50 p-6 rounded-2xl border border-indigo-100 space-y-3">
            <h4 className="font-bold text-indigo-800 text-sm">تعليمات الجرد</h4>
            <ul className="text-xs text-indigo-700 space-y-2 list-disc list-inside">
              <li>تأكد من اختيار المكتب الصحيح قبل البدء.</li>
              <li>قم بمسح الباركود الملصق على الجهاز أو الأثاث.</li>
              <li>حدد حالة الجهاز (جيدة، معطل، مفقود).</li>
              <li>سيتم تسجيل الوقت والموقع تلقائياً لكل عملية.</li>
            </ul>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <span className="text-sm font-bold text-slate-600">قائمة الوسائل المجرودة</span>
              <span className="px-2 py-1 bg-indigo-100 text-indigo-600 rounded-lg text-[10px] font-bold">العدد: {scannedItems.length}</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-right text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 font-bold text-slate-500">المادة</th>
                    <th className="px-4 py-3 font-bold text-slate-500">الباركود</th>
                    <th className="px-4 py-3 font-bold text-slate-500">الموقع</th>
                    <th className="px-4 py-3 font-bold text-slate-500">الحالة</th>
                    <th className="px-4 py-3 font-bold text-slate-500 print:hidden">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {scannedItems.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-12 text-center text-slate-400 italic">
                        لم يتم جرد أي وسيلة بعد. ابدأ بمسح الباركود.
                      </td>
                    </tr>
                  ) : (
                    scannedItems.map(item => (
                      <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-4">
                          <div className="font-bold text-slate-900">{item.itemName}</div>
                          <div className="text-[10px] text-slate-400">{item.timestamp}</div>
                        </td>
                        <td className="px-4 py-4 font-mono text-xs text-slate-500">{item.barcode}</td>
                        <td className="px-4 py-4 text-xs text-slate-600">{department} / {officeNumber}</td>
                        <td className="px-4 py-4">
                          <select 
                            value={item.status}
                            onChange={(e) => updateStatus(item.id, e.target.value as any)}
                            className={`text-[10px] font-bold px-2 py-1 rounded-full border-0 outline-none cursor-pointer ${
                              item.status === 'good' ? 'bg-emerald-100 text-emerald-700' : 
                              item.status === 'broken' ? 'bg-amber-100 text-amber-700' : 
                              'bg-rose-100 text-rose-700'
                            }`}
                          >
                            <option value="good">جيدة</option>
                            <option value="broken">معطل</option>
                            <option value="missing">مفقود</option>
                          </select>
                        </td>
                        <td className="px-4 py-4 print:hidden">
                          <button 
                            onClick={() => removeItem(item.id)}
                            className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
const DataManagement: React.FC<{ onReset: () => void }> = ({ onReset }) => {
  const { inventory, inboundLogs, outboundLogs, categories, auditLogs, setInventory, setInboundLogs, setOutboundLogs, setCategories, setAuditLogs } = useInventoryStore();
  const [status, setStatus] = useState<{ type: 'success' | 'error' | 'info', message: string } | null>(null);

  useEffect(() => {
    if (status) {
      const timer = setTimeout(() => setStatus(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [status]);

  const handleExport = () => {
    try {
      const data = {
        inventory,
        inboundLogs,
        outboundLogs,
        categories,
        auditLogs,
        exportDate: new Date().toISOString(),
        version: '1.1'
      };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `law_stock_backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      localStorage.setItem('last_backup_date', new Date().toISOString());
      setStatus({ type: 'success', message: 'تم تصدير النسخة الاحتياطية بنجاح!' });
    } catch (err) {
      setStatus({ type: 'error', message: 'فشل تصدير البيانات.' });
    }
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (data.inventory && data.categories) {
          if (confirm('سيتم استبدال جميع البيانات الحالية بالبيانات المستوردة. هل أنت متأكد؟')) {
            setInventory(data.inventory);
            setInboundLogs(data.inboundLogs || []);
            setOutboundLogs(data.outboundLogs || []);
            setCategories(data.categories);
            setAuditLogs(data.auditLogs || []);
            setStatus({ type: 'success', message: 'تم استيراد البيانات بنجاح! سيتم تحديث الصفحة...' });
            setTimeout(() => window.location.reload(), 1500);
          }
        } else {
          setStatus({ type: 'error', message: 'ملف غير صالح. يرجى التأكد من اختيار ملف نسخة احتياطية صحيح.' });
        }
      } catch (err) {
        setStatus({ type: 'error', message: 'حدث خطأ أثناء قراءة الملف.' });
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="p-6 space-y-8 max-w-4xl mx-auto">
      {status && (
        <div className={`fixed top-20 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-top duration-300 ${
          status.type === 'success' ? 'bg-emerald-600 text-white' : 
          status.type === 'error' ? 'bg-rose-600 text-white' : 'bg-indigo-600 text-white'
        }`}>
          {status.type === 'success' ? <CheckCircle2 size={20} /> : <AlertTriangle size={20} />}
          <span className="font-bold">{status.message}</span>
        </div>
      )}

      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Database className="w-6 h-6 text-indigo-600" />
          إدارة المخزن المحلي
        </h2>
        <p className="text-slate-500 text-sm">تحكم كامل في بياناتك المخزنة محلياً على المتصفح. يمكنك نسخها احتياطياً أو استعادتها في أي وقت.</p>
        {localStorage.getItem('last_backup_date') && (
          <p className="text-[10px] text-emerald-600 font-bold">آخر نسخة احتياطية ناجحة: {new Date(localStorage.getItem('last_backup_date')!).toLocaleString('ar-DZ')}</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 rounded-lg">
              <Download className="w-5 h-5 text-indigo-600" />
            </div>
            <h3 className="font-bold text-slate-800">نسخ احتياطي (Export)</h3>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">قم بتحميل نسخة كاملة من بيانات المخزن، السجلات، والإعدادات في ملف JSON آمن.</p>
          <button 
            onClick={handleExport}
            className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
          >
            تصدير البيانات الآن
          </button>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-50 rounded-lg">
              <PlusCircle className="w-5 h-5 text-emerald-600" />
            </div>
            <h3 className="font-bold text-slate-800">استعادة البيانات (Import)</h3>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">استرجع بياناتك من ملف نسخة احتياطية سابق. سيتم استبدال البيانات الحالية بالبيانات المستوردة.</p>
          <label className="block">
            <span className="sr-only">اختر ملف</span>
            <input 
              type="file" 
              accept=".json"
              onChange={handleImport}
              className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer"
            />
          </label>
        </div>
      </div>

      <div className="bg-rose-50 p-8 rounded-2xl border border-rose-100 space-y-4">
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-6 h-6 text-rose-600" />
          <h3 className="font-bold text-rose-800">منطقة الخطر</h3>
        </div>
        <p className="text-sm text-rose-700">مسح جميع البيانات المخزنة محلياً وإعادة النظام إلى حالته الافتراضية. هذا الإجراء نهائي ولا يمكن التراجع عنه.</p>
        <button 
          onClick={() => {
            if (confirm('هل أنت متأكد تماماً من مسح كافة البيانات؟ سيتم فقدان كل شيء!')) {
              onReset();
            }
          }}
          className="px-6 py-3 bg-rose-600 text-white rounded-xl font-bold hover:bg-rose-700 transition-all"
        >
          مسح كافة البيانات
        </button>
      </div>
    </div>
  );
};

const InboundLogItem: React.FC<{ log: InboundLog }> = ({ log }) => (
  <div className="p-4 border-b last:border-0 hover:bg-slate-50 transition-colors">
    <div className="flex justify-between items-start mb-1">
      <h4 className="font-bold text-slate-900">{log.itemName}</h4>
      <span className="text-[10px] font-mono text-slate-400">{log.date}</span>
    </div>
    <div className="flex items-center gap-2 mb-2">
      <span className="text-sm font-bold text-emerald-600">+{log.quantity} {log.unit}</span>
      <span className="text-[10px] text-slate-400">|</span>
      <span className="text-xs text-slate-500">{log.supplier}</span>
    </div>
    {(log.department || log.officeNumber) && (
      <div className="flex flex-col gap-0.5 mb-2">
        {log.department && <p className="text-[10px] text-slate-600 font-bold">{log.department}</p>}
        {log.officeNumber && <p className="text-[10px] text-slate-500">مكتب: {log.officeNumber}</p>}
      </div>
    )}
    <div className="flex flex-wrap gap-2 mb-2">
      {log.orderNo && <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[9px] rounded border border-slate-200">سند: {log.orderNo}</span>}
      {log.invoiceNo && <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[9px] rounded border border-slate-200">فاتورة: {log.invoiceNo}</span>}
      {log.receiptNo && <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[9px] rounded border border-slate-200">وصل: {log.receiptNo}</span>}
    </div>
    <p className="text-[10px] text-slate-400 italic">{log.notes || 'لا توجد ملاحظات'}</p>
  </div>
);

const OutboundLogItem: React.FC<{ log: OutboundLog }> = ({ log }) => (
  <div className="p-4 border-b last:border-0 hover:bg-slate-50 transition-colors">
    <div className="flex justify-between items-start mb-1">
      <h4 className="font-bold text-slate-900">{log.itemName}</h4>
      <span className="text-[10px] font-mono text-slate-400">{log.date}</span>
    </div>
    <div className="flex items-center gap-2 mb-2">
      <span className="text-sm font-bold text-amber-600">-{log.quantity} {log.unit}</span>
      <span className="text-[10px] text-slate-400">|</span>
      <span className="text-xs text-slate-500">{log.recipientName}</span>
    </div>
    <div className="flex flex-col gap-0.5 mb-2">
      <p className="text-[10px] text-slate-600 font-bold">{log.department}</p>
      {log.officeNumber && <p className="text-[10px] text-slate-500">مكتب: {log.officeNumber}</p>}
      {log.recipientEntity && <p className="text-[10px] text-slate-400">الجهة: {log.recipientEntity}</p>}
    </div>
    {log.inventoryNo && (
      <p className="text-[9px] text-indigo-600 font-mono mb-1">رقم الجرد: {log.inventoryNo}</p>
    )}
    <p className="text-[10px] text-slate-400 italic">{log.notes || 'لا توجد ملاحظات'}</p>
  </div>
);

const ErrorBoundary: React.FC<{ children: React.ReactNode, fallback: React.ReactNode }> = ({ children, fallback }) => {
  return <>{children}</>;
};

const App: React.FC = () => {
  const { 
    inventory, setInventory, addItem, updateItem, deleteItem,
    inboundLogs, setInboundLogs, addInboundLog,
    outboundLogs, setOutboundLogs, addOutboundLog,
    categories, setCategories, addCategory, updateCategory, deleteCategory,
    addAuditLog
  } = useInventoryStore();

  const [activeTab, setActiveTab] = useState<'dashboard' | 'inventory' | 'inbound' | 'outbound' | 'history' | 'ai' | 'devkit' | 'report' | 'audit' | 'data' | 'categories'>('dashboard');
  const [role, setRole] = useState<UserRole>(UserRole.STOREKEEPER);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [backupNeeded, setBackupNeeded] = useState(false);

  // Initialize DB
  useEffect(() => {
    const initialize = async () => {
      await initDb();
    };
    initialize();
  }, []);

  useEffect(() => {
    const checkBackup = () => {
      const autoBackupEnabled = localStorage.getItem('auto_backup_enabled') === 'true';
      if (!autoBackupEnabled) return;

      const lastBackupStr = localStorage.getItem('last_backup_date');
      if (!lastBackupStr) {
        // First time, don't nag immediately but set a baseline
        return;
      }

      try {
        // Simple check: if last backup was more than 24h ago
        const lastDate = new Date(lastBackupStr);
        const now = new Date();
        const diffHours = (now.getTime() - lastDate.getTime()) / (1000 * 60 * 60);

        if (diffHours > 24) {
          setBackupNeeded(true);
        } else {
          setBackupNeeded(false);
        }
      } catch (e) {
        console.error('Error checking backup date', e);
      }
    };

    checkBackup();
  }, []);

  useEffect(() => {
    const truncateLogs = () => {
      const MAX_LOGS = 1000; // Keep the most recent 1000 logs
      if (inboundLogs.length > MAX_LOGS) {
        setInboundLogs(inboundLogs.slice(inboundLogs.length - MAX_LOGS));
      }
      if (outboundLogs.length > MAX_LOGS) {
        setOutboundLogs(outboundLogs.slice(outboundLogs.length - MAX_LOGS));
      }
    };

    truncateLogs();
  }, [inboundLogs, outboundLogs]);

  const enrichedInventory = useMemo(() => {
    return inventory.map(item => {
      const totalIn = inboundLogs
        .filter(log => log.itemId === item.id)
        .reduce((sum, log) => sum + log.quantity, 0);
      
      const totalOut = outboundLogs
        .filter(log => log.itemId === item.id)
        .reduce((sum, log) => sum + log.quantity, 0);

      const currentQty = (item.initialStock + totalIn) - totalOut;
      
      return {
        ...item,
        inbound: totalIn,
        outbound: totalOut,
        currentQty: currentQty
      };
    });
  }, [inventory, inboundLogs, outboundLogs]);

  const stats = useMemo(() => {
    const totalItems = enrichedInventory.length;
    const lowStockItems = enrichedInventory.filter(item => item.currentQty <= item.reorderLevel).length;
    const totalInboundCount = inboundLogs.length;
    const totalOutboundCount = outboundLogs.length;

    return { totalItems, lowStockItems, totalInboundCount, totalOutboundCount };
  }, [enrichedInventory, inboundLogs, outboundLogs]);

  const handleDownloadLogs = () => {
    const headers = [
      'النوع', 
      'المعرف', 
      'التاريخ', 
      'اسم المادة', 
      'الكمية', 
      'الوحدة', 
      'المورد/المستلم', 
      'المصلحة',
      'رقم المكتب',
      'رقم الموظف',
      'الرتبة',
      'ملاحظات/رقم الجرد',
      'نوع التسليم'
    ];

    const rows: string[][] = [];

    inboundLogs.forEach(log => {
      rows.push([
        'وارد',
        log.id,
        log.date,
        log.itemName,
        log.quantity.toString(),
        log.unit,
        log.supplier,
        log.department || '/',
        log.officeNumber || '/',
        '/',
        '/',
        log.notes || '/',
        '/'
      ]);
    });

    outboundLogs.forEach(log => {
      rows.push([
        'صادر',
        log.id,
        log.date,
        log.itemName,
        log.quantity.toString(),
        log.unit,
        log.recipientName,
        log.department,
        log.officeNumber || '/',
        log.recipientEmployeeId || '/',
        log.recipientTitle || '/',
        log.inventoryNo || '/',
        log.deliveryType
      ]);
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `سجل_مخزن_الحقوق_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleAddItem = (item: InventoryItem) => {
    addItem(item);
    addAuditLog({
      id: Math.random().toString(36).substr(2, 9),
      userId: role,
      action: 'إضافة صنف جديد',
      details: `تم إضافة الصنف: ${item.name}`,
      timestamp: new Date().toISOString()
    });
  };

  const handleUpdateItem = (updatedItem: InventoryItem) => {
    updateItem(updatedItem);
    addAuditLog({
      id: Math.random().toString(36).substr(2, 9),
      userId: role,
      action: 'تحديث صنف',
      details: `تم تحديث بيانات الصنف: ${updatedItem.name}`,
      timestamp: new Date().toISOString()
    });
  };

  const handleDeleteItem = (id: string) => {
    const item = inventory.find(i => i.id === id);
    if (window.confirm('هل أنت متأكد من حذف هذا الصنف نهائياً؟')) {
      deleteItem(id);
      addAuditLog({
        id: Math.random().toString(36).substr(2, 9),
        userId: role,
        action: 'حذف صنف',
        details: `تم حذف الصنف: ${item?.name || id}`,
        timestamp: new Date().toISOString()
      });
    }
  };

  const handleAddCategory = (category: Category) => {
    addCategory(category);
    addAuditLog({
      id: Math.random().toString(36).substr(2, 9),
      userId: role,
      action: 'إضافة فئة جديدة',
      details: `تم إضافة الفئة: ${category.name}`,
      timestamp: new Date().toISOString()
    });
  };

  const handleUpdateCategory = (category: Category) => {
    updateCategory(category);
    // Also update inventory items that use this category name
    setInventory(enrichedInventory.map(item => {
      const oldCat = categories.find(c => c.id === category.id);
      if (oldCat && item.category === oldCat.name) {
        return { ...item, category: category.name };
      }
      return item;
    }));
    addAuditLog({
      id: Math.random().toString(36).substr(2, 9),
      userId: role,
      action: 'تحديث فئة',
      details: `تم تحديث الفئة: ${category.name}`,
      timestamp: new Date().toISOString()
    });
  };

  const handleDeleteCategory = (id: string) => {
    const catToDelete = categories.find(c => c.id === id);
    if (catToDelete) {
      const hasItems = enrichedInventory.some(item => item.category === catToDelete.name);
      if (hasItems) {
        alert('لا يمكن حذف هذه الفئة لأنها تحتوي على أصناف مرتبطة بها.');
        return;
      }
      deleteCategory(id);
      addAuditLog({
        id: Math.random().toString(36).substr(2, 9),
        userId: role,
        action: 'حذف فئة',
        details: `تم حذف الفئة: ${catToDelete.name}`,
        timestamp: new Date().toISOString()
      });
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard inventory={enrichedInventory} stats={stats} role={role} logs={{inbound: inboundLogs, outbound: outboundLogs}} />;
      case 'inventory':
        return (
          <InventoryTable 
            inventory={enrichedInventory} 
            role={role} 
            categories={categories}
            onAddItem={handleAddItem} 
            onUpdateItem={handleUpdateItem}
            onDeleteItem={handleDeleteItem}
          />
        );
      case 'inbound':
      case 'outbound':
        return (
          <TransactionForms 
            type={activeTab} 
            inventory={enrichedInventory} 
            categories={categories}
            onAddInbound={(log) => {
              addInboundLog(log);
              addAuditLog({
                id: Math.random().toString(36).substr(2, 9),
                userId: role,
                action: 'عملية توريد',
                details: `توريد ${log.quantity} ${log.unit} من ${log.itemName}`,
                timestamp: new Date().toISOString()
              });
            }}
            onAddOutbound={(log) => {
              addOutboundLog(log);
              addAuditLog({
                id: Math.random().toString(36).substr(2, 9),
                userId: role,
                action: 'عملية صرف',
                details: `صرف ${log.quantity} ${log.unit} من ${log.itemName} إلى ${log.recipientName}`,
                timestamp: new Date().toISOString()
              });
            }}
            onAddItem={handleAddItem}
            onManageCategories={() => setActiveTab('categories')}
          />
        );
      case 'categories':
        return (
          <CategoryManager 
            categories={categories}
            onAdd={handleAddCategory}
            onUpdate={handleUpdateCategory}
            onDelete={handleDeleteCategory}
          />
        );
      case 'ai':
        return <AIAssistant inventory={enrichedInventory} inbound={inboundLogs} outbound={outboundLogs} />;
      case 'devkit':
        return <DevKit />;
      case 'report':
        return <DetailedReport inventory={enrichedInventory} inbound={inboundLogs} outbound={outboundLogs} categories={categories} />;
      case 'audit':
        return <AnnualInventory inventory={enrichedInventory} />;
      case 'data':
        return (
          <DataManagement 
            onReset={() => {
              localStorage.clear();
              window.location.reload();
            }} 
          />
        );
      case 'history':
        return (
          <div className="p-6 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
              <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <History className="w-6 h-6 text-indigo-600" />
                سجل العمليات الكامل
              </h2>
              <button 
                onClick={handleDownloadLogs}
                className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-200"
              >
                <Download size={18} />
                تحميل السجل (CSV)
              </button>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
              <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-slate-200">
                <div className="p-4 bg-emerald-50 border-b border-emerald-100 flex justify-between items-center">
                  <span className="font-bold text-emerald-800 flex items-center gap-2">
                    <PlusCircle className="w-4 h-4" />
                    الواردات الأخيرة
                  </span>
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-black rounded-full">المجموع: {inboundLogs.length}</span>
                </div>
                <div className="max-h-[700px] overflow-y-auto custom-scrollbar">
                  {inboundLogs.slice().reverse().map(log => (
                    <InboundLogItem key={log.id} log={log} />
                  ))}
                  {inboundLogs.length === 0 && (
                    <div className="p-12 text-center text-slate-400">لا توجد عمليات واردة بعد.</div>
                  )}
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-slate-200">
                <div className="p-4 bg-amber-50 border-b border-amber-100 flex justify-between items-center">
                  <span className="font-bold text-amber-800 flex items-center gap-2">
                    <MinusCircle className="w-4 h-4" />
                    الصادرات الأخيرة
                  </span>
                  <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-black rounded-full">المجموع: {outboundLogs.length}</span>
                </div>
                <div className="max-h-[700px] overflow-y-auto custom-scrollbar bg-slate-50/30">
                  {outboundLogs.slice().reverse().map(log => (
                    <OutboundLogItem key={log.id} log={log} />
                  ))}
                  {outboundLogs.length === 0 && (
                    <div className="p-12 text-center text-slate-400">لا توجد عمليات صادرة بعد.</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      default:
        return <div>قيد التطوير...</div>;
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900 font-['Tajawal']" dir="rtl">
      <aside className={`fixed inset-y-0 right-0 z-50 w-64 bg-slate-900 text-white transform transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full'} md:relative md:translate-x-0 print:hidden`}>
        <div className="p-6">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2 bg-indigo-600 rounded-lg">
              <Package className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-bold tracking-tight">law.Gh. Stock</h1>
          </div>
          
          <nav className="space-y-1">
            <NavItem icon={<LayoutDashboard />} label="لوحة التحكم" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
            <NavItem icon={<Search />} label="المخزون الحالي" active={activeTab === 'inventory'} onClick={() => setActiveTab('inventory')} />
            {role === UserRole.STOREKEEPER && (
              <>
                <NavItem icon={<Tags />} label="إدارة الفئات" active={activeTab === 'categories'} onClick={() => setActiveTab('categories')} />
                <NavItem icon={<PlusCircle />} label="استلام (وارد)" active={activeTab === 'inbound'} onClick={() => setActiveTab('inbound')} />
                <NavItem icon={<MinusCircle />} label="صرف (صادر)" active={activeTab === 'outbound'} onClick={() => setActiveTab('outbound')} />
              </>
            )}
            <NavItem icon={<History />} label="سجل الحركات" active={activeTab === 'history'} onClick={() => setActiveTab('history')} />
            <NavItem icon={<Database />} label="المخزن المحلي" active={activeTab === 'data'} onClick={() => setActiveTab('data')} />
            <NavItem icon={<ClipboardCheck />} label="الجرد السنوي" active={activeTab === 'audit'} onClick={() => setActiveTab('audit')} />
            <NavItem icon={<FileText />} label="التقرير المفصل" active={activeTab === 'report'} onClick={() => setActiveTab('report')} />
            <NavItem icon={<MessageSquare />} label="المساعد الذكي" active={activeTab === 'ai'} onClick={() => setActiveTab('ai')} />
            <NavItem icon={<Code2 />} label="DevKit (للمطورين)" active={activeTab === 'devkit'} onClick={() => setActiveTab('devkit')} />
          </nav>

          {backupNeeded && (
            <div className="mt-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
              <div className="flex items-center gap-2 text-amber-500 mb-2">
                <AlertTriangle size={16} />
                <span className="text-xs font-bold">تذكير بالنسخ الاحتياطي</span>
              </div>
              <p className="text-[10px] text-slate-400 mb-3 leading-relaxed">لم يتم إجراء نسخة احتياطية منذ أكثر من 24 ساعة.</p>
              <button 
                onClick={() => setActiveTab('data')}
                className="w-full py-2 bg-amber-500 text-slate-900 text-[10px] font-black rounded-lg hover:bg-amber-400 transition-colors"
              >
                إجراء نسخة الآن
              </button>
            </div>
          )}

          <div className="absolute bottom-0 right-0 left-0 p-6 border-t border-slate-800">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center">
                <Users className="w-4 h-4 text-slate-300" />
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-medium text-slate-400 truncate">المستخدم الحالي</p>
                <select 
                  className="bg-transparent text-sm font-bold text-white focus:outline-none appearance-none cursor-pointer w-full"
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                >
                  <option className="bg-slate-900" value={UserRole.STOREKEEPER}>{UserRole.STOREKEEPER}</option>
                  <option className="bg-slate-900" value={UserRole.SECRETARY_GENERAL}>{UserRole.SECRETARY_GENERAL}</option>
                  <option className="bg-slate-900" value={UserRole.DEAN}>{UserRole.DEAN}</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-auto print:overflow-visible">
        <header className="bg-white border-b border-slate-200 sticky top-0 z-30 h-16 flex items-center justify-between px-4 md:px-8 print:hidden">
          <button className="md:hidden p-2 text-slate-500" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
            {isSidebarOpen ? <X /> : <Menu />}
          </button>
          
          <div className="flex items-center gap-4">
            <span className="hidden sm:inline-block px-3 py-1 text-xs font-bold rounded-full bg-indigo-100 text-indigo-700">
              جامعة غرداية
            </span>
            <span className="text-sm font-medium text-slate-500">كلية الحقوق والعلوم السياسية</span>
          </div>

          <div className="flex items-center gap-4">
            {stats.lowStockItems > 0 && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-rose-50 text-rose-600 rounded-lg text-sm font-bold border border-rose-100 animate-pulse">
                <AlertTriangle className="w-4 h-4" />
                <span>{stats.lowStockItems} تنبيهات نقص</span>
              </div>
            )}
          </div>
        </header>

        <div className="min-h-[calc(100vh-4rem)]">
          <ErrorBoundary fallback={<ErrorFallback />}>
            {renderContent()}
          </ErrorBoundary>
        </div>
      </main>
    </div>
  );
};

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}

const NavItem: React.FC<NavItemProps> = ({ icon, label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
      active 
        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 font-bold' 
        : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
    }`}
  >
    {React.isValidElement(icon) ? React.cloneElement(icon as React.ReactElement<any>, { size: 20 }) : icon}
    <span>{label}</span>
  </button>
);

const ErrorFallback = () => (
  <div className="p-12 text-center text-slate-500 flex flex-col items-center justify-center h-full">
    <AlertTriangle className="w-16 h-16 text-rose-400 mb-4" />
    <h2 className="text-2xl font-bold text-slate-800 mb-2">حدث خطأ غير متوقع</h2>
    <p>نأسف، لقد واجه النظام مشكلة. يرجى محاولة تحديث الصفحة.</p>
  </div>
);

export default App;
