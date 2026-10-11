/**
 * Safe fallback printing utility
 * Uses a hidden iframe so that browser/webview popup blockers NEVER block printing.
 */
export function printHtmlSafely(htmlContent: string) {
  if (typeof window === "undefined") return;

  try {
    const existing = document.getElementById("orderzo-print-iframe");
    if (existing) {
      existing.remove();
    }

    const iframe = document.createElement("iframe");
    iframe.id = "orderzo-print-iframe";
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    iframe.style.visibility = "hidden";
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(htmlContent);
      doc.close();

      setTimeout(() => {
        try {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
        } catch (e) {
          console.warn("Iframe print error:", e);
        }
      }, 350);
      return;
    }
  } catch (e) {
    console.warn("Failed to print via iframe:", e);
  }

  // Secondary fallback to window.open if iframe fails
  const printWindow = window.open("", "_blank", "width=400,height=600");
  if (!printWindow) {
    alert("Print preview could not be opened. If running in a web browser, please allow popups for this site.");
    return;
  }

  printWindow.document.write(htmlContent);
  printWindow.document.close();
  setTimeout(() => {
    printWindow.focus();
    printWindow.print();
    printWindow.onafterprint = () => {
      printWindow.close();
    };
  }, 400);
}
