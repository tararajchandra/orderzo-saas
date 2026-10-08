"use client";

import { useState, useEffect, Suspense } from "react";
import { MenuItem } from "@/types";
import { useCart } from "@/contexts/CartContext";
import { useSearchParams } from "next/navigation";
import Image from "next/image";

function MenuContent() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const { addToCart } = useCart();
  const [addedItems, setAddedItems] = useState<Set<number>>(new Set());
  const [tableNumber, setTableNumber] = useState<string | null>(null);
  const [isPosOnline, setIsPosOnline] = useState<boolean>(true);

  const searchParams = useSearchParams();

  useEffect(() => {
    // Capture table number from URL and save to sessionStorage
    const table = searchParams.get("table") || (typeof window !== "undefined" ? sessionStorage.getItem("table_number") : null);
    if (table) {
      sessionStorage.setItem("table_number", table);
      setTableNumber(table);

      // Check POS counter heartbeat
      fetch("/api/pos/heartbeat", { cache: "no-store" })
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setIsPosOnline(data.is_pos_online);
          }
        })
        .catch(() => {});
    }

    fetchMenuItems();
  }, [searchParams]);

  const fetchMenuItems = async () => {
    try {
      const response = await fetch("/api/menu?available=true");
      const data = await response.json();
      if (data.success) {
        setMenuItems(data.data);
      }
    } catch (error) {
      console.error("Error fetching menu:", error);
    } finally {
      setLoading(false);
    }
  };

  const categories: string[] = [
    "all",
    ...Array.from(
      new Set(
        menuItems
          .map((item) => item.category_name)
          .filter((name): name is string => Boolean(name)),
      ),
    ),
  ];

  const filteredItems = menuItems.filter((item) => {
    const matchesCategory =
      selectedCategory === "all" || item.category_name === selectedCategory;
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.description?.toLowerCase() ?? "").includes(
        searchQuery.toLowerCase(),
      );
    return matchesCategory && matchesSearch;
  });

  const handleAddToCart = (item: MenuItem) => {
    addToCart(item);
    setAddedItems((prev) => new Set(prev).add(item.id));
    setTimeout(() => {
      setAddedItems((prev) => {
        const newSet = new Set(prev);
        newSet.delete(item.id);
        return newSet;
      });
    }, 1500);
  };

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "80vh",
        }}
      >
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <main className="container" style={{ padding: "2rem 1.5rem" }}>
      <div className="fade-in">
        <h1 className="text-center mb-3">Our Menu</h1>
        <p
          className="text-center text-muted mb-5"
          style={{ fontSize: "1.125rem" }}
        >
          Discover our delicious selection of authentic dishes
        </p>

        {/* Counter POS Offline Alert for Table Orders */}
        {tableNumber && !isPosOnline && (
          <div
            style={{
              background: "linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(185, 28, 28, 0.25) 100%)",
              border: "2px solid #ef4444",
              borderRadius: "14px",
              padding: "1.2rem 1.5rem",
              marginBottom: "2rem",
              boxShadow: "0 6px 18px rgba(239, 68, 68, 0.2)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "0.6rem" }}>
              <span style={{ fontSize: "1.8rem" }}>⚠️</span>
              <div>
                <h3 style={{ margin: 0, color: "#f87171", fontSize: "1.1rem", fontWeight: 700 }}>
                  Table {tableNumber}: Counter POS Offline / রেস্তোরাঁ কাউন্টার অফলাইন
                </h3>
                <p style={{ margin: 0, fontSize: "0.8rem", opacity: 0.85 }}>
                  QR Online ordering is temporarily paused because the restaurant counter has no internet.
                </p>
              </div>
            </div>
            <div
              style={{
                display: "grid",
                gap: "0.5rem",
                background: "rgba(0, 0, 0, 0.35)",
                padding: "0.85rem 1rem",
                borderRadius: "10px",
                fontSize: "0.875rem",
                lineHeight: "1.4",
              }}
            >
              <div>
                <strong style={{ color: "#60a5fa" }}>🇬🇧 English:</strong> Restaurant counter has no internet facility right now. Please place your order directly with our waiter / salesman.
              </div>
              <div>
                <strong style={{ color: "#fbbf24" }}>🇮🇳 Hindi:</strong> रेस्तरां काउंटर पर वर्तमान में इंटरनेट सुविधा नहीं है। कृपया अपना ऑर्डर सीधे हमारे वेटर / सेल्सম্যান को दें।
              </div>
              <div>
                <strong style={{ color: "#34d399" }}>🇧🇩 Bengali:</strong> রেস্তোরাঁর কাউন্টারে বর্তমানে ইন্টারনেট সুবিধা নেই। অনুগ্রহ করে আপনার অর্ডারটি সরাসরি আমাদের সেলসম্যান বা ওয়েটারকে দিন।
              </div>
            </div>
          </div>
        )}

        {/* Search and Filter */}
        <div style={{ marginBottom: "2rem" }}>
          <input
            type="text"
            placeholder="Search menu items..."
            className="input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ marginBottom: "1.5rem" }}
          />

          <div
            style={{
              display: "flex",
              gap: "0.75rem",
              flexWrap: "wrap",
              justifyContent: "center",
            }}
          >
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={
                  selectedCategory === category
                    ? "btn btn-primary"
                    : "btn btn-ghost"
                }
                style={{
                  padding: "0.625rem 1.25rem",
                  textTransform: "capitalize",
                }}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Menu Grid */}
        <div key={selectedCategory} className="grid grid-3">
          {filteredItems.map((item, index) => (
            <div
              key={item.id}
              className="glass-card slide-up"
              style={{
                animationDelay: `${index * 0.05}s`,
                display: "flex",
                flexDirection: "column",
              }}
            >
              <div
                style={{
                  width: "100%",
                  height: "200px",
                  position: "relative",
                  background: item.image_url
                    ? "transparent"
                    : "linear-gradient(135deg, rgba(255,100,50,0.2) 0%, rgba(150,50,255,0.2) 100%)",
                  borderRadius: "var(--radius-md)",
                  marginBottom: "1rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "4rem",
                  overflow: "hidden",
                }}
              >
                {item.image_url ? (
                  <Image
                    src={item.image_url}
                    alt={item.name}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    style={{ objectFit: "cover" }}
                    loading="lazy"
                  />
                ) : (
                  "🍽️"
                )}
              </div>

              <div style={{ flex: 1 }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "start",
                    marginBottom: "0.5rem",
                  }}
                >
                  <h3 style={{ fontSize: "1.25rem", marginBottom: "0.25rem" }}>
                    {item.name}
                  </h3>
                  <span className="badge badge-primary">₹{item.price}</span>
                </div>

                <p
                  className="text-muted"
                  style={{ fontSize: "0.9375rem", marginBottom: "1rem" }}
                >
                  {item.description}
                </p>

                <span
                  className="badge badge-success"
                  style={{ marginBottom: "1rem" }}
                >
                  {item.category_name || "Unknown"}
                </span>
              </div>

              <button
                onClick={() => handleAddToCart(item)}
                className={
                  addedItems.has(item.id)
                    ? "btn btn-secondary"
                    : "btn btn-primary"
                }
                style={{ width: "100%", marginTop: "auto" }}
              >
                {addedItems.has(item.id) ? "✓ Added!" : "+ Add to Cart"}
              </button>
            </div>
          ))}
        </div>

        {filteredItems.length === 0 && (
          <div className="text-center" style={{ padding: "4rem 0" }}>
            <p style={{ fontSize: "1.25rem", color: "var(--text-muted)" }}>
              No items found. Try a different search or category.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}

export default function MenuPage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: "80vh",
          }}
        >
          <div className="spinner"></div>
        </div>
      }
    >
      <MenuContent />
    </Suspense>
  );
}
