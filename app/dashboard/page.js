"use client";
import { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import Link from "next/link";

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
        initial[d.id] = [
          { time: "00:00", temperature: d.temperature, humidity: d.humidity },
        ];
      });
      setHistory(initial);
    });
  }, []);

  // Simulasi update data setiap 3 detik
  useEffect(() => {
    const interval = setInterval(() => {
      setDevices((prev) =>
        prev.map((d) => {
          if (d.status === "offline") return d;
          return {
            ...d,
            temperature: parseFloat(
              (d.temperature + (Math.random() - 0.5) * 0.8).toFixed(1),
            ),
            humidity: parseFloat(
              (d.humidity + (Math.random() - 0.5) * 1.2).toFixed(1),
            ),
          };
        }),
      );

      const now = new Date();
      const timeLabel = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}:${now.getSeconds().toString().padStart(2, "0")}`;

      setHistory((prev) => {
        const updated = { ...prev };
        devices.forEach((d) => {
          if (d.status === "offline") return;
          const prevArr = prev[d.id] || [];
          const newEntry = {
            time: timeLabel,
            temperature: d.temperature,
            humidity: d.humidity,
          };
          updated[d.id] = [...prevArr.slice(-19), newEntry];
        });
        return updated;
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [devices]);

  const selectedDevice = devices.find((d) => d.id === selected);
  const chartData = selected ? history[selected] || [] : [];

  async function toggleRelay(device) {
    await fetch("/api/relay", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        deviceName: device.deviceName,
        relay: !device.relay,
      }),
    });
    fetchDevices().then((data) => setDevices(data));
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-xl font-medium">IoT Dashboard</h1>
            <p className="text-sm text-gray-500">
              Simulasi monitoring perangkat
            </p>
          </div>
        </div>

        {/* Status cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          {devices.map((device) => (
            <div
              key={device.id}
              onClick={() => setSelected(device.id)}
              className={`bg-white border rounded-xl p-4 cursor-pointer transition-all ${selected === device.id ? "border-gray-900" : "border-gray-200"}`}
            >
              <div className="flex justify-between items-start mb-3">
                <p className="font-medium text-sm">{device.deviceName}</p>
                <span
                  className={`text-xs px-2 py-1 rounded-full ${device.status === "online" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"}`}
                >
                  {device.status}
                </span>
              </div>
              <div className="flex gap-4 flex-wrap">
                <div>
                  <p className="text-xs text-gray-500">Suhu</p>
                  <p className="text-base font-medium">
                    {device.temperature}°C
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Kelembaban</p>
                  <p className="text-base font-medium">{device.humidity}%</p>
                </div>
              </div>
              {device.status === "online" && (
                <div className="mt-3 flex justify-between items-center">
                  <span className="text-xs text-gray-500">Pompa</span>
                  <button
                    onClick={() => toggleRelay(device)}
                    className={`text-xs px-3 py-1.5 rounded-lg font-medium ${
                      device.relay
                        ? "bg-blue-600 text-white"
                        : "border border-gray-200 text-gray-600"
                    }`}
                  >
                    {device.relay ? "ON" : "OFF"}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Grafik */}
        {selectedDevice && (
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h2 className="font-medium mb-1">{selectedDevice.deviceName}</h2>
            <p className="text-xs text-gray-500 mb-6">
              Update otomatis setiap 3 detik
            </p>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="time" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="temperature"
                  stroke="#ef4444"
                  strokeWidth={2}
                  dot={false}
                  name="Suhu (°C)"
                />
                <Line
                  type="monotone"
                  dataKey="humidity"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={false}
                  name="Kelembaban (%)"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
