use std::ffi::c_void;
use std::ptr;
use serde::{Deserialize, Serialize};

#[cfg(windows)]
mod winspool {
    use super::*;

    pub const PRINTER_ENUM_LOCAL: u32 = 0x00000002;
    pub const PRINTER_ENUM_CONNECTIONS: u32 = 0x00000004;

    #[repr(C)]
    pub struct DOC_INFO_1_W {
        pub p_doc_name: *const u16,
        pub p_output_file: *const u16,
        pub p_data_type: *const u16,
    }

    #[repr(C)]
    pub struct PRINTER_INFO_1_W {
        pub flags: u32,
        pub p_description: *const u16,
        pub p_name: *const u16,
        pub p_comment: *const u16,
    }

    #[link(name = "winspool")]
    unsafe extern "system" {
        pub fn OpenPrinterW(
            p_printer_name: *const u16,
            ph_printer: *mut isize,
            p_default: *const c_void,
        ) -> i32;

        pub fn StartDocPrinterW(
            h_printer: isize,
            level: u32,
            p_doc_info: *const DOC_INFO_1_W,
        ) -> u32;

        pub fn StartPagePrinter(h_printer: isize) -> i32;

        pub fn WritePrinter(
            h_printer: isize,
            p_buf: *const c_void,
            cb_buf: u32,
            pc_written: *mut u32,
        ) -> i32;

        pub fn EndPagePrinter(h_printer: isize) -> i32;

        pub fn EndDocPrinter(h_printer: isize) -> i32;

        pub fn ClosePrinter(h_printer: isize) -> i32;

        pub fn EnumPrintersW(
            flags: u32,
            name: *const u16,
            level: u32,
            p_printer_enum: *mut u8,
            cb_buf: u32,
            pcb_needed: *mut u32,
            pc_returned: *mut u32,
        ) -> i32;
    }
}

fn to_wide_chars(s: &str) -> Vec<u16> {
    use std::os::windows::ffi::OsStrExt;
    std::ffi::OsStr::new(s)
        .encode_wide()
        .chain(std::iter::once(0))
        .collect()
}

unsafe fn from_wide_ptr(ptr: *const u16) -> String {
    if ptr.is_null() {
        return String::new();
    }
    let mut len = 0;
    unsafe {
        while *ptr.add(len) != 0 {
            len += 1;
        }
        let slice = std::slice::from_raw_parts(ptr, len);
        String::from_utf16_lossy(slice)
    }
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PrinterInfo {
    pub name: String,
    pub is_default: bool,
}

#[tauri::command]
pub fn list_printers() -> Result<Vec<PrinterInfo>, String> {
    #[cfg(windows)]
    {
        use winspool::*;
        let flags = PRINTER_ENUM_LOCAL | PRINTER_ENUM_CONNECTIONS;
        let mut needed: u32 = 0;
        let mut returned: u32 = 0;

        unsafe {
            EnumPrintersW(flags, ptr::null(), 1, ptr::null_mut(), 0, &mut needed, &mut returned);
        }

        if needed == 0 {
            return Ok(Vec::new());
        }

        let mut buffer: Vec<u8> = vec![0; needed as usize];
        let res = unsafe {
            EnumPrintersW(
                flags,
                ptr::null(),
                1,
                buffer.as_mut_ptr(),
                needed,
                &mut needed,
                &mut returned,
            )
        };

        if res == 0 {
            return Err("Failed to enumerate printers from Windows Spooler".to_string());
        }

        let printer_infos = buffer.as_ptr() as *const PRINTER_INFO_1_W;
        let mut list = Vec::new();

        for i in 0..returned {
            let info = unsafe { &*printer_infos.add(i as usize) };
            let name = unsafe { from_wide_ptr(info.p_name) };
            if !name.is_empty() {
                list.push(PrinterInfo {
                    name,
                    is_default: false,
                });
            }
        }

        Ok(list)
    }

    #[cfg(not(windows))]
    {
        Ok(vec![PrinterInfo {
            name: "Mock-POS-Printer".to_string(),
            is_default: true,
        }])
    }
}

pub fn send_raw_bytes_to_printer(printer_name: &str, data: &[u8]) -> Result<bool, String> {
    #[cfg(windows)]
    {
        use winspool::*;
        let printer_w = to_wide_chars(printer_name);
        let doc_name_w = to_wide_chars("OrderZo-Receipt");
        let data_type_w = to_wide_chars("RAW");

        let mut h_printer: isize = 0;
        let open_res = unsafe {
            OpenPrinterW(printer_w.as_ptr(), &mut h_printer, ptr::null())
        };

        if open_res == 0 || h_printer == 0 {
            return Err(format!("Could not open printer '{}'. Is it installed and turned on?", printer_name));
        }

        let doc_info = DOC_INFO_1_W {
            p_doc_name: doc_name_w.as_ptr(),
            p_output_file: ptr::null(),
            p_data_type: data_type_w.as_ptr(),
        };

        let job_id = unsafe { StartDocPrinterW(h_printer, 1, &doc_info) };
        if job_id == 0 {
            unsafe { ClosePrinter(h_printer) };
            return Err("Failed to start print job on printer".to_string());
        }

        unsafe { StartPagePrinter(h_printer) };

        let mut written: u32 = 0;
        let write_res = unsafe {
            WritePrinter(
                h_printer,
                data.as_ptr() as *const c_void,
                data.len() as u32,
                &mut written,
            )
        };

        unsafe {
            EndPagePrinter(h_printer);
            EndDocPrinter(h_printer);
            ClosePrinter(h_printer);
        }

        if write_res == 0 {
            return Err("Failed writing raw data to printer".to_string());
        }

        Ok(true)
    }

    #[cfg(not(windows))]
    {
        println!("[MOCK PRINT to {}] {} bytes", printer_name, data.len());
        Ok(true)
    }
}

#[derive(Debug, Serialize, Deserialize)]
pub struct BillPrintPayload {
    pub printer_name: String,
    pub restaurant_name: String,
    pub address: Option<String>,
    pub phone: Option<String>,
    pub gstin: Option<String>,
    pub order_number: String,
    pub date: String,
    pub time: String,
    pub table_or_type: String,
    pub items: Vec<BillItemPayload>,
    pub subtotal: f64,
    pub discount: Option<f64>,
    pub tax: Option<f64>,
    pub total: f64,
    pub payment_mode: Option<String>,
    pub footer_note: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct BillItemPayload {
    pub name: String,
    pub qty: f64,
    pub rate: f64,
    pub amount: f64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct KotPrintPayload {
    pub printer_name: String,
    pub kot_number: String,
    pub order_number: String,
    pub table_or_type: String,
    pub date: String,
    pub time: String,
    pub waiter_name: Option<String>,
    pub items: Vec<KotItemPayload>,
    pub notes: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct KotItemPayload {
    pub name: String,
    pub qty: f64,
    pub variant: Option<String>,
    pub note: Option<String>,
}

// ESC/POS Commands
const ESC: u8 = 0x1B;
const GS: u8 = 0x1D;

pub struct EscPosBuilder {
    bytes: Vec<u8>,
}

impl EscPosBuilder {
    pub fn new() -> Self {
        let mut b = Self { bytes: Vec::new() };
        b.init();
        b
    }

    pub fn init(&mut self) -> &mut Self {
        self.bytes.extend_from_slice(&[ESC, b'@']);
        self
    }

    pub fn align_left(&mut self) -> &mut Self {
        self.bytes.extend_from_slice(&[ESC, b'a', 0]);
        self
    }

    pub fn align_center(&mut self) -> &mut Self {
        self.bytes.extend_from_slice(&[ESC, b'a', 1]);
        self
    }

    pub fn align_right(&mut self) -> &mut Self {
        self.bytes.extend_from_slice(&[ESC, b'a', 2]);
        self
    }

    pub fn bold_on(&mut self) -> &mut Self {
        self.bytes.extend_from_slice(&[ESC, b'E', 1]);
        self
    }

    pub fn bold_off(&mut self) -> &mut Self {
        self.bytes.extend_from_slice(&[ESC, b'E', 0]);
        self
    }

    pub fn double_size(&mut self) -> &mut Self {
        self.bytes.extend_from_slice(&[GS, b'!', 0x11]);
        self
    }

    pub fn normal_size(&mut self) -> &mut Self {
        self.bytes.extend_from_slice(&[GS, b'!', 0x00]);
        self
    }

    pub fn line_feed(&mut self, lines: u8) -> &mut Self {
        for _ in 0..lines {
            self.bytes.push(b'\n');
        }
        self
    }

    pub fn text(&mut self, s: &str) -> &mut Self {
        self.bytes.extend_from_slice(s.as_bytes());
        self
    }

    pub fn text_ln(&mut self, s: &str) -> &mut Self {
        self.text(s);
        self.bytes.push(b'\n');
        self
    }

    pub fn cut(&mut self) -> &mut Self {
        self.line_feed(3);
        // Full cut with feed
        self.bytes.extend_from_slice(&[GS, b'V', 65, 0]);
        self
    }

    pub fn cash_drawer(&mut self) -> &mut Self {
        // ESC p 0 25 250 (pulse pin 2)
        self.bytes.extend_from_slice(&[ESC, b'p', 0, 25, 250]);
        self
    }

    pub fn build(self) -> Vec<u8> {
        self.bytes
    }
}

#[tauri::command]
pub fn print_bill(payload: BillPrintPayload) -> Result<bool, String> {
    let mut esc = EscPosBuilder::new();

    // Header
    esc.align_center();
    esc.double_size();
    esc.bold_on();
    esc.text_ln(&payload.restaurant_name);
    esc.normal_size();
    esc.bold_off();

    if let Some(addr) = &payload.address {
        if !addr.is_empty() {
            esc.text_ln(addr);
        }
    }
    if let Some(ph) = &payload.phone {
        if !ph.is_empty() {
            esc.text_ln(&format!("Tel: {}", ph));
        }
    }
    if let Some(gst) = &payload.gstin {
        if !gst.is_empty() {
            esc.text_ln(&format!("GSTIN: {}", gst));
        }
    }

    esc.text_ln("================================");
    esc.align_left();
    esc.text_ln(&format!("Order: #{}", payload.order_number));
    esc.text_ln(&format!("Date : {}  {}", payload.date, payload.time));
    esc.text_ln(&format!("Type : {}", payload.table_or_type));
    esc.text_ln("--------------------------------");

    // Item Table (32 chars line for standard 58mm/80mm)
    // Item (18) Qty (4) Total (10)
    esc.bold_on();
    esc.text_ln("Item              Qty     Amount");
    esc.bold_off();
    esc.text_ln("--------------------------------");

    for item in &payload.items {
        let name_display = if item.name.len() > 16 {
            &item.name[0..16]
        } else {
            &item.name
        };
        let line = format!(
            "{:<16} {:>4.0} {:>10.2}",
            name_display, item.qty, item.amount
        );
        esc.text_ln(&line);
    }

    esc.text_ln("--------------------------------");
    esc.align_right();
    esc.text_ln(&format!("Sub Total: {:>10.2}", payload.subtotal));

    if let Some(disc) = payload.discount {
        if disc > 0.0 {
            esc.text_ln(&format!("Discount: -{:>9.2}", disc));
        }
    }

    if let Some(tax) = payload.tax {
        if tax > 0.0 {
            esc.text_ln(&format!("Tax/GST : {:>10.2}", tax));
        }
    }

    esc.bold_on();
    esc.double_size();
    esc.text_ln(&format!("NET: INR {:.2}", payload.total));
    esc.normal_size();
    esc.bold_off();

    if let Some(pay) = &payload.payment_mode {
        esc.align_left();
        esc.text_ln(&format!("Payment: {}", pay));
    }

    esc.align_center();
    esc.text_ln("================================");
    let note = payload.footer_note.unwrap_or_else(|| "Thank You! Visit Again".to_string());
    esc.text_ln(&note);

    // If cash payment, kick drawer
    if let Some(pay) = &payload.payment_mode {
        if pay.to_lowercase().contains("cash") {
            esc.cash_drawer();
        }
    }

    esc.cut();

    send_raw_bytes_to_printer(&payload.printer_name, &esc.build())
}

#[tauri::command]
pub fn print_kot(payload: KotPrintPayload) -> Result<bool, String> {
    let mut esc = EscPosBuilder::new();

    esc.align_center();
    esc.double_size();
    esc.bold_on();
    esc.text_ln("*** K. O. T. ***");
    esc.normal_size();
    esc.bold_off();

    esc.text_ln("================================");
    esc.align_left();
    esc.bold_on();
    esc.text_ln(&format!("KOT #: {}", payload.kot_number));
    esc.double_size();
    esc.text_ln(&format!("TABLE: {}", payload.table_or_type));
    esc.normal_size();
    esc.bold_off();

    esc.text_ln(&format!("Order: #{}", payload.order_number));
    esc.text_ln(&format!("Time : {} {}", payload.date, payload.time));
    if let Some(w) = &payload.waiter_name {
        esc.text_ln(&format!("Server: {}", w));
    }

    esc.text_ln("--------------------------------");
    esc.bold_on();
    esc.text_ln("Qty  Item Description");
    esc.bold_off();
    esc.text_ln("--------------------------------");

    for item in &payload.items {
        esc.bold_on();
        esc.double_size();
        let qty_str = format!("{:.0}x", item.qty);
        esc.text_ln(&format!("{:<4} {}", qty_str, item.name));
        esc.normal_size();
        esc.bold_off();

        if let Some(v) = &item.variant {
            if !v.is_empty() {
                esc.text_ln(&format!("     [{}]", v));
            }
        }
        if let Some(n) = &item.note {
            if !n.is_empty() {
                esc.text_ln(&format!("     Note: {}", n));
            }
        }
    }

    esc.text_ln("--------------------------------");
    if let Some(notes) = &payload.notes {
        if !notes.is_empty() {
            esc.bold_on();
            esc.text_ln(&format!("Instructions: {}", notes));
            esc.bold_off();
            esc.text_ln("--------------------------------");
        }
    }

    esc.cut();

    send_raw_bytes_to_printer(&payload.printer_name, &esc.build())
}

#[tauri::command]
pub fn kick_cash_drawer(printer_name: String) -> Result<bool, String> {
    let mut esc = EscPosBuilder::new();
    esc.cash_drawer();
    send_raw_bytes_to_printer(&printer_name, &esc.build())
}
