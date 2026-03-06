
import Database from "@tauri-apps/plugin-sql";

// Check if we are running in Tauri
const isTauri = !!(window as any).__TAURI_INTERNALS__;

let dbInstance: Database | null = null;

export async function getDb() {
  if (!isTauri) {
    console.warn("Not running in Tauri. SQLite will not be available.");
    return null;
  }
  if (!dbInstance) {
    dbInstance = await Database.load("sqlite:college_inventory.db");
  }
  return dbInstance;
}

export async function initDb() {
  const db = await getDb();
  if (!db) return;

  await db.execute(`
    CREATE TABLE IF NOT EXISTS inventory (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      category TEXT,
      unit TEXT,
      initialStock REAL,
      currentQty REAL,
      reorderLevel REAL,
      barcode TEXT,
      inbound REAL,
      outbound REAL
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS inbound_logs (
      id TEXT PRIMARY KEY,
      itemId TEXT,
      itemName TEXT,
      quantity REAL,
      unit TEXT,
      date TEXT,
      supplier TEXT,
      orderNo TEXT,
      invoiceNo TEXT,
      receiptNo TEXT,
      notes TEXT
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS outbound_logs (
      id TEXT PRIMARY KEY,
      itemId TEXT,
      itemName TEXT,
      quantity REAL,
      unit TEXT,
      date TEXT,
      recipientName TEXT,
      department TEXT,
      officeNumber TEXT,
      recipientEmployeeId TEXT,
      recipientTitle TEXT,
      inventoryNo TEXT,
      notes TEXT,
      deliveryType TEXT,
      recipientEntity TEXT,
      signature TEXT
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL
    )
  `);
}

export async function saveToDb(table: string, data: any[]) {
  const db = await getDb();
  if (!db || data.length === 0) return;

  try {
    await db.execute("BEGIN TRANSACTION");
    
    // Clear table
    await db.execute(`DELETE FROM ${table}`);

    // Get table columns to avoid inserting invalid ones
    const columnInfo = await db.select(`PRAGMA table_info(${table})`) as any[];
    const validColumns = columnInfo.map(c => c.name);

    for (const item of data) {
      const filteredItem: any = {};
      validColumns.forEach(col => {
        if (item[col] !== undefined) {
          filteredItem[col] = item[col];
        }
      });

      const keys = Object.keys(filteredItem);
      const placeholders = keys.map(() => "?").join(", ");
      const columns = keys.join(", ");
      const values = Object.values(filteredItem);
      
      await db.execute(
        `INSERT INTO ${table} (${columns}) VALUES (${placeholders})`,
        values
      );
    }
    
    await db.execute("COMMIT");
  } catch (e) {
    await db.execute("ROLLBACK");
    console.error(`Error saving to table ${table}`, e);
  }
}

export async function loadFromDb(table: string): Promise<any[]> {
  const db = await getDb();
  if (!db || !isTauri) return [];

  try {
    return await db.select(`SELECT * FROM ${table}`);
  } catch (e) {
    console.error(`Error loading from table ${table}`, e);
    return [];
  }
}
