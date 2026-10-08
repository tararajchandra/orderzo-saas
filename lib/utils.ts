export function formatDate(date: string | number | Date | null | undefined): string {
  if (!date) return "";
  let d: Date;
  if (typeof date === "number") {
    d = new Date(date);
  } else if (typeof date === "string" && /^\d+$/.test(date.trim())) {
    d = new Date(parseInt(date.trim(), 10));
  } else {
    d = new Date(date);
  }
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function formatDateTime(date: string | number | Date | null | undefined): string {
  if (!date) return "";
  let d: Date;
  if (typeof date === "number") {
    d = new Date(date);
  } else if (typeof date === "string" && /^\d+$/.test(date.trim())) {
    d = new Date(parseInt(date.trim(), 10));
  } else {
    d = new Date(date);
  }
  if (isNaN(d.getTime())) return "";
  return d.toLocaleString("en-IN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

export function getLocalDateStr(d: Date = new Date()): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}${month}${day}`;
}

export function sortOrdersDesc(a: any, b: any): number {
  if (!a && !b) return 0;
  if (!a) return 1;
  if (!b) return -1;

  // 1. Try extracting standard POS order number parts: [PREFIX]-[YYYYMMDD]-[SEQ]
  const parseOrderNum = (order: any) => {
    const raw = String(order?.order_number || order?.id || "").trim();
    const match = raw.match(/^([A-Za-z0-9]+)-(\d{8})-(\d+)$/);
    if (match) {
      return {
        prefix: match[1].toUpperCase(),
        dateStr: match[2],
        seq: parseInt(match[3], 10),
      };
    }
    const lastNumMatch = raw.match(/-(\d+)$/);
    if (lastNumMatch) {
      return {
        prefix: "",
        dateStr: "",
        seq: parseInt(lastNumMatch[1], 10),
      };
    }
    return null;
  };

  const parsedA = parseOrderNum(a);
  const parsedB = parseOrderNum(b);

  // If both have structured order numbers
  if (parsedA && parsedB) {
    // If dates differ (e.g. 20261008 vs 20261007), newer date comes first
    if (parsedA.dateStr && parsedB.dateStr && parsedA.dateStr !== parsedB.dateStr) {
      return parsedB.dateStr.localeCompare(parsedA.dateStr);
    }
    // If same prefix and date, higher sequence number ALWAYS comes first
    if (parsedA.prefix === parsedB.prefix && parsedA.seq !== parsedB.seq) {
      return parsedB.seq - parsedA.seq;
    }
  }

  // 2. Compare created_at / timestamp
  const getTime = (order: any): number => {
    if (!order) return 0;
    const val = order.created_at || order.timestamp;
    if (!val) return 0;
    if (typeof val === "number") return val;
    if (typeof val === "string" && /^\d+$/.test(val.trim())) return parseInt(val.trim(), 10);
    const t = new Date(val).getTime();
    return isNaN(t) ? 0 : t;
  };

  const timeA = getTime(a);
  const timeB = getTime(b);
  if (timeA !== timeB && timeA > 0 && timeB > 0) {
    return timeB - timeA;
  }

  // 3. Fallback: if one has higher sequence number
  if (parsedA && parsedB && parsedA.seq !== parsedB.seq) {
    return parsedB.seq - parsedA.seq;
  }

  // 4. Fallback: numeric database ID comparison (e.g. id: 15 vs 14)
  const idA = typeof a.id === "number" ? a.id : parseInt(String(a.id), 10);
  const idB = typeof b.id === "number" ? b.id : parseInt(String(b.id), 10);
  if (!isNaN(idA) && !isNaN(idB) && idA !== idB) {
    return idB - idA;
  }

  // 5. Final tie-breaker: string comparison
  return String(b.order_number || b.id || "").localeCompare(
    String(a.order_number || a.id || "")
  );
}

export function getTableList(settings: any): string[] {
  if (!settings) return [];

  // If tableZones is defined, parse it. Format: "Cafe:10, Lawn:5, Couple:3"
  if (
    settings.tableZones &&
    typeof settings.tableZones === "string" &&
    settings.tableZones.trim() !== ""
  ) {
    try {
      const zones = settings.tableZones
        .split(",")
        .map((z: string) => z.trim())
        .filter(Boolean);
      const tables: string[] = [];

      zones.forEach((zone: string) => {
        const parts = zone.split(":");
        if (parts.length === 2) {
          const zoneName = parts[0].trim();
          const count = parseInt(parts[1].trim(), 10);
          if (!isNaN(count) && count > 0) {
            for (let i = 1; i <= count; i++) {
              tables.push(`${zoneName} ${i}`);
            }
          }
        }
      });

      if (tables.length > 0) return tables;
    } catch (e) {
      console.error("Error parsing table zones:", e);
    }
  }

  // Fallback to simple totalTables
  const total = parseInt(settings.totalTables || "16", 10);
  return Array.from({ length: total }, (_, i) => (i + 1).toString());
}

export function getGroupedTableList(settings: any): { zone: string, tables: string[] }[] {
    if (!settings) return [];
  
    if (
      settings.tableZones &&
      typeof settings.tableZones === "string" &&
      settings.tableZones.trim() !== ""
    ) {
      try {
        const zones = settings.tableZones
          .split(",")
          .map((z: string) => z.trim())
          .filter(Boolean);
        const groups: { zone: string, tables: string[] }[] = [];
  
        zones.forEach((zone: string) => {
          const parts = zone.split(":");
          if (parts.length === 2) {
            const zoneName = parts[0].trim();
            const count = parseInt(parts[1].trim(), 10);
            if (!isNaN(count) && count > 0) {
              const tables = [];
              for (let i = 1; i <= count; i++) {
                tables.push(`${zoneName} ${i}`);
              }
              groups.push({ zone: zoneName, tables });
            }
          }
        });
  
        if (groups.length > 0) return groups;
      } catch (e) {
        console.error("Error parsing table zones for groups:", e);
      }
    }
  
    // Fallback
    const total = parseInt(settings.totalTables || "16", 10);
    const tables = Array.from({ length: total }, (_, i) => (i + 1).toString());
    return [{ zone: "Main", tables }];
}
