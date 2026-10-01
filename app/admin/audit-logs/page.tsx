"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { formatDateTime } from "@/lib/utils";

interface AuditLog {
  id: number;
  user_name: string | null;
  user_role: string | null;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  details: any;
  created_at: string;
}

export default function AuditLogsPage() {
  const router = useRouter();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const limit = 50;

  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    if (!token) {
      router.push("/admin");
      return;
    }
    fetchLogs(page);
  }, [page]);

  const fetchLogs = async (pageNum: number) => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/admin/audit-logs?limit=${limit}&offset=${pageNum * limit}`,
      );
      const data = await res.json();
      if (data.success) {
        setLogs(data.data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const getActionColor = (action: string) => {
    if (action.includes("LOGIN")) return "#3b82f6";
    if (action.includes("ATTENDANCE")) return "#eab308";
    if (action.includes("ORDER")) return "#22c55e";
    if (action.includes("SETTINGS")) return "#a855f7";
    return "#6b7280";
  };

  return (
    <main
      className="container"
      style={{ padding: "2rem 1.5rem", minHeight: "100vh" }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "2rem",
        }}
      >
        <h1>System Activity Log (Audit Trail)</h1>
        <button
          onClick={() => router.push("/admin/dashboard")}
          className="btn btn-ghost"
        >
          ← Back to Dashboard
        </button>
      </div>

      <div className="card" style={{ overflowX: "auto" }}>
        {loading && logs.length === 0 ? (
          <div style={{ padding: "2rem", textAlign: "center" }}>
            Loading logs...
          </div>
        ) : (
          <>
            <table
              className="table"
              style={{
                width: "100%",
                textAlign: "left",
                borderCollapse: "collapse",
              }}
            >
              <thead>
                <tr
                  style={{
                    borderBottom: "1px solid var(--border-color)",
                    backgroundColor: "var(--bg-secondary)",
                  }}
                >
                  <th style={{ padding: "1rem" }}>Time</th>
                  <th style={{ padding: "1rem" }}>User</th>
                  <th style={{ padding: "1rem" }}>Action</th>
                  <th style={{ padding: "1rem" }}>Entity</th>
                  <th style={{ padding: "1rem" }}>Details</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr
                    key={log.id}
                    style={{ borderBottom: "1px solid var(--border-color)" }}
                  >
                    <td style={{ padding: "1rem", whiteSpace: "nowrap" }}>
                      {formatDateTime(log.created_at)}
                    </td>
                    <td style={{ padding: "1rem" }}>
                      {log.user_name ? (
                        <div>
                          <span style={{ fontWeight: 500 }}>
                            {log.user_name}
                          </span>
                          <br />
                          <span
                            style={{
                              fontSize: "0.75rem",
                              color: "var(--text-secondary)",
                            }}
                          >
                            {log.user_role}
                          </span>
                        </div>
                      ) : (
                        "System / Guest"
                      )}
                    </td>
                    <td style={{ padding: "1rem" }}>
                      <span
                        style={{
                          padding: "0.25rem 0.5rem",
                          borderRadius: "4px",
                          fontSize: "0.75rem",
                          fontWeight: "bold",
                          backgroundColor: getActionColor(log.action) + "22",
                          color: getActionColor(log.action),
                        }}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td style={{ padding: "1rem" }}>
                      {log.entity_type}{" "}
                      {log.entity_id ? `(#${log.entity_id})` : ""}
                    </td>
                    <td style={{ padding: "1rem" }}>
                      {log.details && (
                        <pre
                          style={{
                            fontSize: "0.75rem",
                            margin: 0,
                            whiteSpace: "pre-wrap",
                            wordBreak: "break-word",
                            color: "var(--text-secondary)",
                          }}
                        >
                          {JSON.stringify(log.details, null, 2)}
                        </pre>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "1rem",
              }}
            >
              <button
                className="btn btn-secondary"
                disabled={page === 0}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous
              </button>
              <span style={{ display: "flex", alignItems: "center" }}>
                Page {page + 1}
              </span>
              <button
                className="btn btn-secondary"
                disabled={logs.length < limit}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </button>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
