export const OFFLINE_SUPPORTED_ROUTES = [
  "/admin/quick-bill",
  "/admin/tables",
  "/admin/orders",
  "/admin/orders/create",
  "/admin/cashbook",
  "/admin/sales",
  "/admin/dashboard",
  "/admin",
  "/menu",
  "/cart",
  "/login",
  "/help",
  "/",
];

export function isRouteSupportedOffline(pathname: string): boolean {
  if (!pathname) return false;
  const cleanPath = pathname.split("?")[0].split("#")[0].replace(/\/+$/, "") || "/";
  return OFFLINE_SUPPORTED_ROUTES.includes(cleanPath);
}

export function showOfflineRouteWarning(featureName?: string) {
  const target = featureName ? `"${featureName}"` : "এই পেজটি";
  alert(
    `⚠️ ইন্টারনেট সংযোগ নেই!\n\n${target} ব্যবহারের জন্য ইন্টারনেট সংযোগ প্রয়োজন।\n\nঅফলাইনে আপনি Quick Bill, Active Tables, Orders, Cash Book এবং Sale Book ব্যবহার করতে পারবেন।`
  );
}
