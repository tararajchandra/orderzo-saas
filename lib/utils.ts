export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return "";
  const d = new Date(date);
  // metrics: 'en-IN' uses dd/mm/yyyy
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return "";
  const d = new Date(date);
  return d.toLocaleString("en-IN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
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
