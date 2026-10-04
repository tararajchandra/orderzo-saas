const fs = require('fs');
let content = fs.readFileSync('app/admin/tables/page.tsx', 'utf8');

// 1. Add ReceiptPrinter import
if (!content.includes('ReceiptPrinter')) {
    content = content.replace('import { formatDateTime', 'import { ReceiptPrinter } from "@/lib/receipt-printer";\nimport { formatDateTime');
}

// 2. Add printingOrderId state
if (!content.includes('printingOrderId')) {
    content = content.replace('const [settings, setSettings]', 'const [printingOrderId, setPrintingOrderId] = useState<number | null>(null);\n  const [settings, setSettings]');
}

// 3. Replace handlePrintAllKOTs and handleSaveNote with full KOT printing logic
const oldKOTLogicStart = content.indexOf('  // Print all KOTs for a table');
const oldKOTLogicEnd = content.indexOf('  // Print Bill functionality');

if (oldKOTLogicStart !== -1 && oldKOTLogicEnd !== -1) {
    const newKOTLogic = `  const printKOTFallback = (order: any) => {
    const printWindow = window.open("", "_blank", "width=400,height=600");
    if (!printWindow) {
      alert("Please allow popups to print the KOT.");
      return;
    }
    const itemsHtml = (Array.isArray(order.items) ? order.items : (typeof order.items === "string" ? JSON.parse(order.items) : [])).map((item: any) => {
      return '<tr><td style="padding: 4px 0;">' + item.menuItem.name + '</td><td style="text-align: center; padding: 4px 0;">' + item.quantity + "</td></tr>";
    }).join("");
    const htmlContent = "<!DOCTYPE html><html><head><title>KOT - #" + (order.order_number || order.id || "") + "</title><style>@page { margin: 0; } body { font-family: 'Courier New', Courier, monospace; width: 72mm; margin: 0 auto; padding: 10px; font-size: 16px; font-weight: bold; color: black; background: #fff; } .center { text-align: center; } .bold { font-weight: bold; } table { width: 100%; border-collapse: collapse; margin-top: 10px; } th { border-bottom: 1px dashed #000; padding-bottom: 5px; text-align: left; } .divider { border-top: 1px dashed #000; margin: 10px 0; }</style></head><body><div class=\\"center bold\\" style=\\"font-size: 24px;\\">K.O.T</div><div class=\\"center divider\\"></div><div>Order No: " + (order.order_number || order.id || "N/A") + "</div><div>Type: " + (order.order_type || "").toUpperCase() + "</div>" + (order.table_number ? "<div>Table: " + order.table_number + "</div>" : "") + "<div>Date: " + new Date().toLocaleString() + "</div><table><thead><tr><th>Item</th><th style=\\"text-align: center;\\">Qty</th></tr></thead><tbody>" + itemsHtml + "</tbody></table><div class=\\"divider\\"></div>" + (order.notes ? "<div><strong>Notes:</strong> " + order.notes + "</div>" : "") + "<div style=\\"height: 10px;\\"></div></body></html>";
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    setTimeout(() => { printWindow.focus(); printWindow.print(); printWindow.onafterprint = () => { printWindow.close(); }; }, 500);
  };

  const handlePrintKOT = async (order: any) => {
    setPrintingOrderId(order.id);
    try {
      // @ts-ignore
      if (!navigator.usb) { printKOTFallback(order); return; }
      // @ts-ignore
      const pairedDevices = await navigator.usb.getDevices();
      // @ts-ignore
      const device = pairedDevices.length > 0 ? pairedDevices[0] : await navigator.usb.requestDevice({ filters: [] });
      await device.open(); await device.selectConfiguration(1); await device.claimInterface(0);
      const printer = new ReceiptPrinter();
      printer.alignCenter(); printer.setSize(2, 2); printer.bold(true).textLine("K.O.T").bold(false);
      printer.setSize(1, 1); printer.feed(1); printer.alignLeft();
      printer.textLine("Order No: " + (order.order_number || order.id || "N/A"));
      printer.textLine("Type: " + (order.order_type || "").toUpperCase());
      if (order.table_number) printer.textLine("Table: " + order.table_number);
      printer.textLine("Date: " + new Date().toLocaleString());
      printer.line("-"); printer.textLine("ITEM                       QTY"); printer.line("-");
      const items = Array.isArray(order.items) ? order.items : (typeof order.items === "string" ? JSON.parse(order.items) : []);
      items.forEach((item: any) => {
        const name = item.menuItem.name.substring(0, 24).padEnd(24, " ");
        const qty = String(item.quantity).padStart(5, " ");
        printer.setSize(1, 2); printer.bold(true); printer.textLine(name + " " + qty); printer.bold(false);
      });
      printer.setSize(1, 1); printer.line("-");
      if (order.notes) { printer.feed(1); printer.textLine("Notes: " + order.notes); }
      printer.feed(3); printer.cut();
      const data = printer.getData();
      // @ts-ignore
      await device.transferOut(1, data);
      // @ts-ignore
      await device.close();
    } catch (error: any) {
      console.warn("USB KOT Print failed, falling back:", error);
      printKOTFallback(order);
    } finally {
      setPrintingOrderId(null);
    }
  };

  // Print all KOTs for a table sequentially
  const handlePrintAllKOTs = async (tableNo: string) => {
    const group = tableGroups[tableNo];
    if (!group || group.orders.length === 0) return;
    for (const order of group.orders) {
      await handlePrintKOT(order);
      // add a small delay between prints to allow printer buffer to process
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  };

  // Save a kitchen note for a table (updates the latest order's notes field)
  const handleSaveNote = async (tableNo: string, note: string) => {
    const group = tableGroups[tableNo];
    if (!group || group.orders.length === 0) return;
    const targetOrder = [...group.orders].sort((a: any, b: any) => b.id - a.id)[0];
    try {
      const res = await fetch(\`/api/orders/\${targetOrder.id}\`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: note }),
      });
      const data = await res.json();
      if (data.success) {
        alert(\`Note saved for Table \${tableNo}\`);
        fetchActiveTableOrders(true);
      } else { alert("Failed to save note."); }
    } catch (err) { console.error("Error saving note:", err); alert("Error saving note."); }
  };

`;
    content = content.substring(0, oldKOTLogicStart) + newKOTLogic + content.substring(oldKOTLogicEnd);
} else {
    console.log("Could not find KOT logic bounds.");
}

// 4. Add individual KOT button in the table modal
const orderHeaderTarget = /<strong style=\{\{ fontSize: "0\.85rem" \}\}>\s*Order #\{o\.order_number \|\| o\.id\}\s*<\/strong>/g;

const newOrderHeader = `<div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                      <strong style={{ fontSize: "0.85rem" }}>
                        Order #{o.order_number || o.id}
                      </strong>
                      <button 
                        onClick={(e) => { e.stopPropagation(); handlePrintKOT(o); }}
                        className="btn btn-ghost btn-sm"
                        style={{ padding: "2px 6px", fontSize: "0.75rem", background: "rgba(255,255,255,0.1)", borderRadius: "4px", color: "var(--text-primary)", border: "1px solid rgba(255,255,255,0.2)" }}
                        title="Print KOT"
                        disabled={printingOrderId === o.id}
                      >
                        {printingOrderId === o.id ? "🖨️..." : "🖨️ KOT"}
                      </button>
                    </div>`;

if(content.match(orderHeaderTarget)){
    content = content.replace(orderHeaderTarget, newOrderHeader);
} else {
    console.log("Could not find order header target.");
}


fs.writeFileSync('app/admin/tables/page.tsx', content);
console.log("Patched successfully!");
