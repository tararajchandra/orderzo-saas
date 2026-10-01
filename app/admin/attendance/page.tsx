"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { formatDate } from "@/lib/utils";

interface AttendanceRecord {
  id: number;
  user_name: string;
  user_role: string;
  date: string;
  check_in_time: string;
  check_out_time: string | null;
  total_working_hours: string | null;
  status: string;
  break_count: string;
  total_break_minutes: string | null;
}

export default function AttendanceReportPage() {
  const router = useRouter();
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState(
    () => new Date().toISOString().split("T")[0],
  );

  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    if (!token) {
      router.push("/admin");
      return;
    }
    fetchData();
  }, [dateFilter]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/attendance?date=${dateFilter}`);
      const data = await res.json();
      if (data.success) {
        setRecords(data.data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (isoString: string) => {
    if (!isoString) return "-";
    return new Date(isoString).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
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
        <h1>Staff Attendance Report</h1>
        <input
          type="date"
          className="form-input"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          style={{ maxWidth: "200px" }}
        />
      </div>

      <div className="card" style={{ overflowX: "auto" }}>
        {loading ? (
          <div style={{ padding: "2rem", textAlign: "center" }}>Loading...</div>
        ) : (
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
                <th style={{ padding: "1rem" }}>Staff Name</th>
                <th style={{ padding: "1rem" }}>Role</th>
                <th style={{ padding: "1rem" }}>Check-In</th>
                <th style={{ padding: "1rem" }}>Check-Out</th>
                <th style={{ padding: "1rem" }}>Breaks</th>
                <th style={{ padding: "1rem" }}>Total Break Time</th>
                <th style={{ padding: "1rem" }}>Working Hours</th>
                <th style={{ padding: "1rem" }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {records.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    style={{
                      padding: "2rem",
                      textAlign: "center",
                      color: "var(--text-secondary)",
                    }}
                  >
                    No attendance records for this date.
                  </td>
                </tr>
              ) : (
                records.map((record) => (
                  <tr
                    key={record.id}
                    style={{ borderBottom: "1px solid var(--border-color)" }}
                  >
                    <td style={{ padding: "1rem", fontWeight: 500 }}>
                      {record.user_name}
                    </td>
                    <td
                      style={{ padding: "1rem", textTransform: "capitalize" }}
                    >
                      {record.user_role.replace("_", " ")}
                    </td>
                    <td style={{ padding: "1rem", color: "#166534" }}>
                      {formatTime(record.check_in_time)}
                    </td>
                    <td style={{ padding: "1rem", color: "#991b1b" }}>
                      {formatTime(record.check_out_time || "")}
                    </td>
                    <td style={{ padding: "1rem" }}>{record.break_count}</td>
                    <td style={{ padding: "1rem" }}>
                      {record.total_break_minutes
                        ? `${Math.round(parseFloat(record.total_break_minutes))} mins`
                        : "-"}
                    </td>
                    <td style={{ padding: "1rem", fontWeight: "bold" }}>
                      {record.total_working_hours
                        ? `${parseFloat(record.total_working_hours).toFixed(2)} hrs`
                        : record.status === "checked_out"
                          ? "0 hrs"
                          : "Active"}
                    </td>
                    <td style={{ padding: "1rem" }}>
                      <span
                        style={{
                          padding: "0.25rem 0.5rem",
                          borderRadius: "4px",
                          fontSize: "0.875rem",
                          backgroundColor:
                            record.status === "present"
                              ? "#dcfce7"
                              : record.status === "on_break"
                                ? "#ffedd5"
                                : "#f3f4f6",
                          color:
                            record.status === "present"
                              ? "#166534"
                              : record.status === "on_break"
                                ? "#c2410c"
                                : "#4b5563",
                        }}
                      >
                        {record.status.replace("_", " ").toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </main>
  );
}
