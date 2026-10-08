"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";

export default function DineInCheckoutPage() {
  const router = useRouter();
  const { cart, getCartTotal, clearCart, isLoaded: cartLoaded } = useCart();
  const { user, loading: authLoading } = useAuth(); // We get user if they happen to be logged in, but won't force it
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState<any>(null);
  const [tableNumber, setTableNumber] = useState<string | null>(null);
  const [isPosOnline, setIsPosOnline] = useState<boolean>(true);

  const [formData, setFormData] = useState({
    notes: "",
  });

  useEffect(() => {
    // Fetch settings for GST type
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setSettings(data.data);
      })
      .catch((err) => console.error("Error fetching settings:", err));

    // Check POS counter heartbeat status
    const checkPosStatus = async () => {
      try {
        const res = await fetch("/api/pos/heartbeat", { cache: "no-store" });
        const data = await res.json();
        if (data.success) {
          setIsPosOnline(data.is_pos_online);
        }
      } catch (err) {
        console.error("Error checking POS heartbeat:", err);
      }
    };

    checkPosStatus();
    const heartbeatInterval = setInterval(checkPosStatus, 10000);

    // Get table number
    const storedTable = sessionStorage.getItem("table_number");
    if (storedTable) {
      setTableNumber(storedTable);
    } else {
      // If somehow they reached here without a table number, redirect to cart
      router.push("/cart");
    }

    return () => clearInterval(heartbeatInterval);
  }, [router]);

  const subtotal = getCartTotal();

  const calculateTax = () => {
    if (settings?.gstType !== "regular") return 0;

    return cart.reduce((sum, item) => {
      const itemPrice = item.menuItem.price;
      const gstRate = (item.menuItem.gst_rate || 5) / 100;
      return sum + itemPrice * item.quantity * gstRate;
    }, 0);
  };

  const tax = calculateTax();
  const total = subtotal + tax;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isPosOnline) {
      alert(
        "Restaurant counter currently has no internet facility. Please place your order directly with our waiter / salesman.\n\n" +
        "রেস্তোরাঁর কাউন্টারে বর্তমানে ইন্টারনেট সুবিধা নেই। অনুগ্রহ করে আপনার অর্ডারটি সরাসরি সেলসম্যান বা ওয়েটারকে দিন।\n\n" +
        "रेस्तरां काउंटर पर वर्तमान में इंटरनेट सुविधा नहीं है। कृपया अपना ऑर्डर सीधे हमारे वेटर / सेल्समैन को दें।"
      );
      return;
    }

    if (!tableNumber) return;

    setLoading(true);

    const placeOrder = async (lat: number | null, lng: number | null) => {
      try {
        const orderData = {
          user_id: user?.id,
          customer_name: user?.name || "Walk-in Customer",
          customer_phone: user?.phone || "N/A",
          customer_address: null,
          order_type: "dine_in",
          table_number: tableNumber,
          items: cart.map((item) => ({
            menuItem: {
              id: item.menuItem.id,
              name: item.menuItem.name,
              price: item.menuItem.price,
              gst_rate: item.menuItem.gst_rate,
            },
            quantity: item.quantity,
          })),
          subtotal,
          tax,
          discount: 0,
          delivery_location_id: null,
          delivery_charge: 0,
          total_amount: total,
          payment_method: "cash",
          notes: formData.notes,
          customer_lat: lat,
          customer_lng: lng,
          distance: null,
          prefix: "QR",
        };

        const response = await fetch("/api/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(orderData),
        });

        const data = await response.json();

        if (data.success) {
          clearCart();
          localStorage.removeItem("tableNumber");
          router.push("/order-success");
        } else {
          alert(data.error || "Failed to place order");
          setLoading(false);
        }
      } catch (error) {
        console.error("Error placing order:", error);
        alert("An error occurred. Please try again.");
        setLoading(false);
      }
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          placeOrder(position.coords.latitude, position.coords.longitude);
        },
        (error) => {
          alert(
            "You must allow Location Access (GPS) to place a Dine-in table order.",
          );
          setLoading(false);
        },
        { enableHighAccuracy: true, timeout: 10000 },
      );
    } else {
      alert("Geolocation is not supported by your browser.");
      setLoading(false);
    }
  };

  if (!cartLoaded) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          gap: "1rem",
        }}
      >
        <span className="spinner"></span>
        <p>Loading checkout...</p>
      </div>
    );
  }

  if (cart.length === 0) {
    router.push("/cart");
    return null;
  }

  if (!tableNumber) {
    return null; // Will redirect in useEffect
  }

  return (
    <main
      className="container"
      style={{ padding: "2rem 1.5rem", maxWidth: "900px" }}
    >
      <div className="fade-in">
        <h1 className="text-center mb-4">Dine-In Checkout</h1>

        <form onSubmit={handleSubmit}>
          {!isPosOnline && (
            <div
              style={{
                background: "linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(185, 28, 28, 0.25) 100%)",
                border: "2px solid #ef4444",
                borderRadius: "16px",
                padding: "1.5rem",
                marginBottom: "2rem",
                boxShadow: "0 8px 24px rgba(239, 68, 68, 0.2)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "1rem" }}>
                <span style={{ fontSize: "2.2rem" }}>⚠️</span>
                <div>
                  <h3 style={{ margin: 0, color: "#f87171", fontSize: "1.25rem", fontWeight: 700 }}>
                    Restaurant Counter Offline / রেস্তোরাঁ অফলাইন
                  </h3>
                  <p style={{ margin: 0, fontSize: "0.85rem", opacity: 0.85 }}>
                    Real-time online table ordering is temporarily unavailable.
                  </p>
                </div>
              </div>

              <div
                style={{
                  display: "grid",
                  gap: "0.85rem",
                  background: "rgba(0, 0, 0, 0.35)",
                  padding: "1rem 1.25rem",
                  borderRadius: "12px",
                  lineHeight: "1.5",
                }}
              >
                <div>
                  <strong style={{ color: "#60a5fa" }}>🇬🇧 English:</strong>{" "}
                  Restaurant counter has no internet facility right now. Please place your order directly with our waiter / salesman.
                </div>
                <div>
                  <strong style={{ color: "#fbbf24" }}>🇮🇳 Hindi:</strong>{" "}
                  रेस्तरां काउंटर पर वर्तमान में इंटरनेट सुविधा नहीं है। कृपया अपना ऑर्डर सीधे हमारे वेटर / सेल्समैन को दें।
                </div>
                <div>
                  <strong style={{ color: "#34d399" }}>🇧🇩 Bengali:</strong>{" "}
                  রেস্তোরাঁর কাউন্টারে বর্তমানে ইন্টারনেট সুবিধা নেই। অনুগ্রহ করে আপনার অর্ডারটি সরাসরি সেলসম্যান বা ওয়েটারকে দিন।
                </div>
              </div>
            </div>
          )}

          <div style={{ display: "grid", gap: "2rem" }}>
            {/* Table Information */}
            <div
              className="glass-card"
              style={{
                border: "2px solid var(--primary)",
                backgroundColor: "rgba(var(--primary-rgb), 0.05)",
              }}
            >
              <h3 style={{ marginBottom: "0.5rem", color: "var(--primary)" }}>
                Table Order
              </h3>
              <p style={{ fontSize: "1.25rem", fontWeight: 600 }}>
                Table Number: {tableNumber}
              </p>
              <p
                className="text-muted"
                style={{ fontSize: "0.875rem", marginTop: "0.5rem" }}
              >
                Your order will be served directly to your table. No delivery
                charge applies.
              </p>

              <div style={{ marginTop: "1.5rem" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "0.5rem",
                    fontWeight: 500,
                  }}
                >
                  Special Instructions (Optional)
                </label>
                <textarea
                  className="input"
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  placeholder="Any special requests or instructions for the chef"
                  rows={2}
                  style={{ resize: "vertical" }}
                />
              </div>
            </div>

            {/* Payment Method */}
            <div className="glass-card">
              <h3 style={{ marginBottom: "1.5rem" }}>Payment Method</h3>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
                  gap: "1rem",
                }}
              >
                <button
                  type="button"
                  className="btn btn-primary"
                  style={{
                    padding: "1rem",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "0.5rem",
                    cursor: "default",
                  }}
                >
                  <span style={{ fontSize: "2rem" }}>💵</span>
                  <span style={{ fontSize: "0.875rem" }}>Pay at Counter</span>
                </button>
              </div>
            </div>

            {/* Order Summary */}
            <div className="glass-card">
              <h3 style={{ marginBottom: "1.5rem" }}>Order Summary</h3>

              <div style={{ marginBottom: "1.5rem" }}>
                {cart.map((item) => (
                  <div
                    key={item.menuItem.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: "0.75rem",
                      paddingBottom: "0.75rem",
                      borderBottom: "1px solid var(--border-color)",
                    }}
                  >
                    <span>
                      {item.menuItem.name} × {item.quantity}
                    </span>
                    <span>
                      ₹{(item.menuItem.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>

              <div style={{ marginBottom: "1.5rem" }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "0.5rem",
                  }}
                >
                  <span className="text-muted">Subtotal</span>
                  <span>₹{subtotal.toFixed(2)}</span>
                </div>
                {settings?.gstType === "regular" && (
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: "0.5rem",
                    }}
                  >
                    <span className="text-muted">Tax (GST)</span>
                    <span>₹{tax.toFixed(2)}</span>
                  </div>
                )}
                <div
                  style={{
                    borderTop: "1px solid var(--border-color)",
                    paddingTop: "0.75rem",
                    marginTop: "0.75rem",
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "1.25rem",
                    fontWeight: 700,
                  }}
                >
                  <span>Total</span>
                  <span style={{ color: "var(--primary)" }}>
                    ₹{total.toFixed(2)}
                  </span>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !isPosOnline}
                className="btn btn-primary"
                style={{
                  width: "100%",
                  fontSize: "1.125rem",
                  padding: "1rem",
                  background: !isPosOnline ? "#dc2626" : undefined,
                  borderColor: !isPosOnline ? "#dc2626" : undefined,
                  cursor: !isPosOnline ? "not-allowed" : "pointer",
                }}
              >
                {loading
                  ? "Placing Order..."
                  : !isPosOnline
                  ? "⚠️ Counter Offline - Please Call Waiter"
                  : "Place Order"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </main>
  );
}
