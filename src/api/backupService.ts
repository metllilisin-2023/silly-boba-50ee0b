
import { InventoryItem, InboundLog, OutboundLog, Category } from '../types';

export interface BackupData {
  inventory: InventoryItem[];
  inboundLogs: InboundLog[];
  outboundLogs: OutboundLog[];
  categories: Category[];
  timestamp: string;
  version: string;
}

export const createBackup = (
  inventory: InventoryItem[],
  inboundLogs: InboundLog[],
  outboundLogs: OutboundLog[],
  categories: Category[]
): BackupData => {
  return {
    inventory,
    inboundLogs,
    outboundLogs,
    categories,
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  };
};

export const downloadBackup = (data: BackupData) => {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const date = new Date().toISOString().split('T')[0];
  link.download = `college_inventory_backup_${date}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const validateBackup = (data: any): data is BackupData => {
  return (
    data &&
    Array.isArray(data.inventory) &&
    Array.isArray(data.inboundLogs) &&
    Array.isArray(data.outboundLogs) &&
    Array.isArray(data.categories)
  );
};
