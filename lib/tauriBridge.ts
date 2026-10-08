/**
 * Tauri Desktop Native Bridge
 * Seamlessly interfaces with Rust backend for:
 * - Silent thermal ESC/POS printing (Bill & KOT)
 * - Cash drawer kick
 * - Local SQLite database operations
 * - Windows printer detection
 * 
 * Safe for web: automatically degrades to browser mode if running in browser.
 */

export const isTauri = (): boolean => {
  if (typeof window === 'undefined') return false;
  return '__TAURI_INTERNALS__' in window || '__TAURI__' in window;
};

export interface PrinterInfo {
  name: string;
  is_default: boolean;
}

export interface BillPrintItem {
  name: string;
  qty: number;
  rate: number;
  amount: number;
}

export interface BillPrintPayload {
  printer_name: string;
  restaurant_name: string;
  address?: string;
  phone?: string;
  gstin?: string;
  order_number: string;
  date: string;
  time: string;
  table_or_type: string;
  items: BillPrintItem[];
  subtotal: number;
  discount?: number;
  tax?: number;
  total: number;
  payment_mode?: string;
  footer_note?: string;
}

export interface KotPrintItem {
  name: string;
  qty: number;
  variant?: string;
  note?: string;
}

export interface KotPrintPayload {
  printer_name: string;
  kot_number: string;
  order_number: string;
  table_or_type: string;
  date: string;
  time: string;
  waiter_name?: string;
  items: KotPrintItem[];
  notes?: string;
}

// Dynamically import invoke from @tauri-apps/api/core only in browser when in Tauri
async function getInvoker() {
  if (!isTauri()) return null;
  try {
    const { invoke } = await import('@tauri-apps/api/core');
    return invoke;
  } catch (err) {
    console.warn('[TauriBridge] Could not load @tauri-apps/api/core:', err);
    return null;
  }
}

/**
 * List all printers installed on Windows
 */
export async function getInstalledPrinters(): Promise<PrinterInfo[]> {
  const invoke = await getInvoker();
  if (!invoke) return [];
  try {
    return await invoke<PrinterInfo[]>('list_printers');
  } catch (err) {
    console.error('[TauriBridge] list_printers error:', err);
    return [];
  }
}

/**
 * Print customer receipt/bill silently using ESC/POS
 */
export async function printSilentBill(payload: BillPrintPayload): Promise<boolean> {
  const invoke = await getInvoker();
  if (!invoke) {
    console.warn('[TauriBridge] Not in Tauri environment, skipping silent bill print');
    return false;
  }
  try {
    return await invoke<boolean>('print_bill', { payload });
  } catch (err) {
    console.error('[TauriBridge] print_bill error:', err);
    throw err;
  }
}

/**
 * Print Kitchen Order Ticket (KOT) silently
 */
export async function printSilentKot(payload: KotPrintPayload): Promise<boolean> {
  const invoke = await getInvoker();
  if (!invoke) {
    console.warn('[TauriBridge] Not in Tauri environment, skipping silent KOT print');
    return false;
  }
  try {
    return await invoke<boolean>('print_kot', { payload });
  } catch (err) {
    console.error('[TauriBridge] print_kot error:', err);
    throw err;
  }
}

/**
 * Pulse cash drawer to open
 */
export async function openCashDrawer(printerName: string): Promise<boolean> {
  const invoke = await getInvoker();
  if (!invoke) return false;
  try {
    return await invoke<boolean>('kick_cash_drawer', { printerName });
  } catch (err) {
    console.error('[TauriBridge] kick_cash_drawer error:', err);
    return false;
  }
}

/**
 * High-level helper: Print order bill silently in Tauri
 */
export async function printOrderBill(order: any, settings: any): Promise<boolean> {
  if (!isTauri()) return false;

  const savedPrinter = localStorage.getItem('tauri_receipt_printer');
  let printerName = savedPrinter;
  if (!printerName) {
    const list = await getInstalledPrinters();
    if (list.length > 0) {
      printerName = list[0].name;
    }
  }

  if (!printerName) {
    throw new Error('No printer found. Please select a printer in Settings.');
  }

  let rawItems: any[] = [];
  try {
    rawItems = Array.isArray(order.items)
      ? order.items
      : typeof order.items === 'string'
      ? JSON.parse(order.items)
      : [];
  } catch (e) {
    rawItems = [];
  }

  const items: BillPrintItem[] = rawItems.map((item: any) => {
    const qty = Number(item.quantity || item.qty || 1);
    const rate = Number(item.price || item.menuItem?.price || 0);
    return {
      name: item.menuItem?.name || item.name || 'Item',
      qty,
      rate,
      amount: rate * qty,
    };
  });

  const payload: BillPrintPayload = {
    printer_name: printerName,
    restaurant_name: settings?.restaurantName || 'OrderZo',
    address: settings?.restaurantAddress || '',
    phone: settings?.restaurantPhone || '',
    gstin: settings?.gstNumber || '',
    order_number: String(order.order_number || order.id || 'N/A'),
    date: new Date(order.created_at || Date.now()).toLocaleDateString(),
    time: new Date(order.created_at || Date.now()).toLocaleTimeString(),
    table_or_type: order.table_number
      ? `Table ${order.table_number}`
      : String(order.order_type || 'Takeaway').toUpperCase(),
    items,
    subtotal: Number(order.subtotal || order.total || 0),
    discount: Number(order.discount || 0),
    tax: Number(order.tax || 0),
    total: Number(order.total || 0),
    payment_mode:
      order.payment_method ||
      (order.payment_status === 'PAID' ? 'PAID' : 'PENDING'),
    footer_note: settings?.footerText || 'Thank you for your business!',
  };

  return await printSilentBill(payload);
}

/**
 * High-level helper: Print kitchen KOT silently in Tauri
 */
export async function printOrderKOT(order: any, settings: any): Promise<boolean> {
  if (!isTauri()) return false;

  const savedPrinter =
    localStorage.getItem('tauri_kot_printer') ||
    localStorage.getItem('tauri_receipt_printer');
  let printerName = savedPrinter;
  if (!printerName) {
    const list = await getInstalledPrinters();
    if (list.length > 0) {
      printerName = list[0].name;
    }
  }

  if (!printerName) {
    throw new Error('No printer found. Please select a printer in Settings.');
  }

  let rawItems: any[] = [];
  try {
    rawItems = Array.isArray(order.items)
      ? order.items
      : typeof order.items === 'string'
      ? JSON.parse(order.items)
      : [];
  } catch (e) {
    rawItems = [];
  }

  const items: KotPrintItem[] = rawItems.map((item: any) => ({
    name: item.menuItem?.name || item.name || 'Item',
    qty: Number(item.quantity || item.qty || 1),
    variant: item.variant?.name || item.variant || undefined,
    note: item.notes || item.specialInstructions || undefined,
  }));

  const payload: KotPrintPayload = {
    printer_name: printerName,
    kot_number: String(order.kot_number || order.order_number || order.id || '1'),
    order_number: String(order.order_number || order.id || 'N/A'),
    table_or_type: order.table_number
      ? `Table ${order.table_number}`
      : String(order.order_type || 'Takeaway').toUpperCase(),
    date: new Date(order.created_at || Date.now()).toLocaleDateString(),
    time: new Date(order.created_at || Date.now()).toLocaleTimeString(),
    waiter_name: order.waiter_name || order.salesman || undefined,
    items,
    notes: order.notes || undefined,
  };

  return await printSilentKot(payload);
}

/**
 * Get a local setting from SQLite
 */
export async function getLocalSetting(key: string): Promise<string | null> {
  const invoke = await getInvoker();
  if (!invoke) {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(`tauri_${key}`);
    }
    return null;
  }
  try {
    return await invoke<string | null>('get_setting', { key });
  } catch (err) {
    console.error('[TauriBridge] get_setting error:', err);
    return null;
  }
}

/**
 * Set a local setting in SQLite
 */
export async function setLocalSetting(key: string, value: string): Promise<boolean> {
  const invoke = await getInvoker();
  if (!invoke) {
    if (typeof window !== 'undefined') {
      localStorage.setItem(`tauri_${key}`, value);
      return true;
    }
    return false;
  }
  try {
    return await invoke<boolean>('set_setting', { key, value });
  } catch (err) {
    console.error('[TauriBridge] set_setting error:', err);
    return false;
  }
}
