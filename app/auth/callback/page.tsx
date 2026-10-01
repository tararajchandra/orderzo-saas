"use client";

import { Suspense, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

export const dynamic = "force-dynamic";

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();

  const processed = useRef(false);

  useEffect(() => {
    if (processed.current) return;

    const token = searchParams.get("token");
    const userStr = searchParams.get("user");

    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        login(token, user);
        processed.current = true;

        if (user.role === "admin") {
          window.location.href = "/admin/dashboard";
        } else if (user.role === "salesman") {
          window.location.href = "/salesman";
        } else if (user.role === "delivery_boy") {
          window.location.href = "/delivery";
        } else if (user.role === "kitchen") {
          window.location.href = "/kitchen";
        } else {
          window.location.href = "/menu";
        }
      } catch (error) {
        console.error("Error parsing user data:", error);
        router.push("/login?error=Invalid user data");
      }
    } else {
      router.push("/login?error=Authentication failed");
    }
  }, [searchParams, login, router]);

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
      }}
    >
      <div className="spinner"></div>
      <p style={{ marginLeft: "1rem" }}>Completing login...</p>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "100vh",
          }}
        >
          <div className="spinner"></div>
          <p style={{ marginLeft: "1rem" }}>Loading...</p>
        </div>
      }
    >
      <AuthCallbackContent />
    </Suspense>
  );
}
