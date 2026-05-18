"use client";
import { useState, useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

function fetchDevices() {
  return fetch("/api/iot").then((res) => res.json());
}

export default function DashboardPage() {
  const [devices, setDevices] = useState([]);
  const [history, setHistory] = useState({});
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    fetchDevices().then((data) => {
      setDevices(data);
      if (data.length > 0) setSelected(data[0].id);
      const initial = {};
      data.forEach((d) => {
        initial[d.id] = [{ time: "00:00", temperature: d.temperature, humidity: d.humidity }];
      });
      setHistory(initial);
    });
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setDevices((prev) => prev.map((d) => {
        if (d.status === "offline") return d;
        return {
          ...d,
          temperature: parseFloat((d.temperature + (Math.random() - 0.5) * 0.8).toFixed(1)),
          humidity: parseFloat((d.humidity + (Math.random() - 0.5) * 1.2).toFixed(1)),
        };
      }));

      const now = new Date();
      const timeLabel = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}:${now.getSeconds().toString().padStart(2, "0")}`;

      setHistory((prev) => {
        const updated = { ...prev };
        devices.forEach((d) => {
          if (d.status === "offline") return;
          const prevArr = prev[d.id] || [];
          updated[d.id] = [...prevArr.slice(-19), { time: timeLabel, temperature: d.temperature, humidity: d.humidity }];
        });
        return updated;
      });
    }, 3000);
    return () => clearInterval(interval);
  }, [devices]);

  async function toggleRelay(e, device) {
    e.stopPropagation();
    await fetch("/api/relay", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ deviceName: device.deviceName, relay: !device.relay }),
    });
    fetchDevices().then((data) => setDevices(data));
  }

  const selectedDevice = devices.find((d) => d.id === selected);
  const chartData = selected ? history[selected] || [] : [];

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-primary)", padding: "28px 40px" }}>

      {/* Header */}
      <div style={{ marginBottom: "24px" }}>
        <h1 style={{ fontSize: "18px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "4px" }}>
          IoT Dashboard
        </h1>
        <p style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
          Monitoring perangkat realtime
        </p>
      </div>

      {/* Device cards */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
        gap: "12px",
        marginBottom: "20px",
      }}>
        {devices.map((device) => (
          <div key={device.id} onClick={() => setSelected(device.id)} style={{
            background: "var(--bg-secondary)",
            border: `1px solid ${selected === device.id ? "var(--accent)" : "var(--border)"}`,
            borderRadius: "var(--radius-lg)",
            padding: "16px",
            cursor: "pointer",
            transition: "border-color 0.15s",
            boxShadow: selected === device.id ? "0 0 0 1px var(--accent-glow)" : "none",
          }}>
            {/* Device header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "14px" }}>
              <p style={{ fontSize: "13px", fontWeight: 500, color: "var(--text-primary)" }}>
                {device.deviceName}
              </p>
              <span style={{
                fontSize: "11px",
                padding: "2px 8px",
                borderRadius: "20px",
                background: device.status === "online" ? "var(--accent-subtle)" : "var(--red-subtle)",
                color: device.status === "online" ? "var(--accent)" : "var(--red)",
                border: `1px solid ${device.status === "online" ? "rgba(74,222,128,0.2)" : "rgba(248,113,113,0.2)"}`,
                fontWeight: 500,
              }}>
                {device.status}
              </span>
            </div>

            {/* Sensor values */}
            <div style={{ display: "flex", gap: "20px", marginBottom: "14px" }}>
              <div>
                <p style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "2px" }}>Suhu</p>
                <p style={{ fontSize: "20px", fontWeight: 600, color: "var(--text-primary)", letterSpacing: "-0.5px" }}>
                  {device.temperature}
                  <span style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: 400 }}>°C</span>
                </p>
              </div>
              <div>
                <p style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "2px" }}>Kelembaban</p>
                <p style={{ fontSize: "20px", fontWeight: 600, color: "var(--text-primary)", letterSpacing: "-0.5px" }}>
                  {device.humidity}
                  <span style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: 400 }}>%</span>
                </p>
              </div>
            </div>

            {/* Relay */}
            {device.status === "online" && (
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                paddingTop: "12px",
                borderTop: "1px solid var(--border)",
              }}>
                <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>Pompa</span>
                <button onClick={(e) => toggleRelay(e, device)} style={{
                  fontSize: "11px",
                  fontWeight: 600,
                  padding: "4px 12px",
                  borderRadius: "var(--radius-sm)",
                  cursor: "pointer",
                  transition: "all 0.15s",
                  background: device.relay ? "var(--accent-subtle)" : "var(--bg-tertiary)",
                  color: device.relay ? "var(--accent)" : "var(--text-secondary)",
                  border: device.relay ? "1px solid rgba(74,222,128,0.25)" : "1px solid var(--border)",
                }}>
                  {device.relay ? "ON" : "OFF"}
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Chart */}
      {selectedDevice && (
        <div style={{
          background: "var(--bg-secondary)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-lg)",
          padding: "20px 24px",
        }}>
          <div style={{ marginBottom: "20px" }}>
            <h2 style={{ fontSize: "14px", fontWeight: 500, color: "var(--text-primary)", marginBottom: "2px" }}>
              {selectedDevice.deviceName}
            </h2>
            <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>
              Update otomatis setiap 3 detik
            </p>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="time" tick={{ fontSize: 11, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{
                  background: "var(--bg-tertiary)",
                  border: "1px solid var(--border)",
                  borderRadius: "8px",
                  fontSize: "12px",
                  color: "var(--text-primary)",
                }}
              />
              <Legend wrapperStyle={{ fontSize: "12px", color: "var(--text-secondary)" }} />
              <Line type="monotone" dataKey="temperature" stroke="#f87171" strokeWidth={1.5} dot={false} name="Suhu (°C)" />
              <Line type="monotone" dataKey="humidity" stroke="#4ade80" strokeWidth={1.5} dot={false} name="Kelembaban (%)" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

    </div>
  );
}