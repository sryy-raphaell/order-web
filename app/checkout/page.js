"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function CheckoutPage() {
  const [form, setForm] = useState({ name: "", address: "", phone: "" });
  const router = useRouter();

  const [cart, setCart] = useState(() => {
    if (typeof window === "undefined") return [];
    const saved = localStorage.getItem("cart");
    return saved ? JSON.parse(saved) : [];
  });

  function handleSubmit() {
    if (!form.name || !form.address || !form.phone) {
      alert("Semua field wajib diisi");
      return;
    }

    const total = cart.reduce((sum, c) => sum + c.price * c.qty, 0);

    const message = [
      "Halo, saya ingin memesan:",
      "",
      ...cart.map(
        (item) =>
          `- ${item.name} x${item.qty} = Rp ${(item.price * item.qty).toLocaleString("id-ID")}`,
      ),
      "",
      `Total: Rp ${total.toLocaleString("id-ID")}`,
      `Nama: ${form.name}`,
      `No HP: ${form.phone}`,
      `Alamat: ${form.address}`,
    ].join("\n");

    const encoded = encodeURIComponent(message);
    const waNumber = "6283180647083"; // ganti dengan nomor WA penjual tanpa tanda + atau 0 di depan
    window.open(`https://wa.me/${waNumber}?text=${encoded}`);
  }

  const total = cart.reduce((sum, c) => sum + c.price * c.qty, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => router.push("/")}
            className="text-sm border border-gray-200 px-3 py-2 rounded-lg bg-cyan-50 text-cyan-700 hover:bg-cyan-100 transition-colors"
          >
            ← Kembali
          </button>
          <h1 className="text-xl font-medium">Checkout</h1>
        </div>

        <div className="flex gap-6">
          {/* Form */}
          <div className="flex-1 bg-white border border-gray-200 rounded-xl p-6">
            <h2 className="font-medium mb-4">Data Pemesan</h2>
            <div className="flex flex-col gap-4">
              <div>
                <label className="text-sm text-gray-500 mb-1 block">
                  Nama Lengkap
                </label>
                <input
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                  placeholder="Masukkan nama lengkap"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm text-gray-500 mb-1 block">
                  No WhatsApp
                </label>
                <input
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                  placeholder="Contoh: 08123456789"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm text-gray-500 mb-1 block">
                  Alamat Lengkap
                </label>
                <textarea
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                  placeholder="Masukkan alamat lengkap"
                  rows={3}
                  value={form.address}
                  onChange={(e) =>
                    setForm({ ...form, address: e.target.value })
                  }
                />
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="w-72">
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <h2 className="font-medium mb-4">Ringkasan Order</h2>
              {cart.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-4">
                  Keranjang kosong
                </p>
              )}
              {cart.map((item) => (
                <div
                  key={item.id}
                  className="flex justify-between py-2 border-b border-gray-100"
                >
                  <div>
                    <p className="text-sm font-medium">{item.name}</p>
                    <p className="text-xs text-gray-500">x{item.qty}</p>
                  </div>
                  <p className="text-sm">
                    Rp {(item.price * item.qty).toLocaleString("id-ID")}
                  </p>
                </div>
              ))}
              {cart.length > 0 && (
                <>
                  <div className="flex justify-between text-sm font-medium mt-4 mb-6">
                    <span>Total</span>
                    <span>Rp {total.toLocaleString("id-ID")}</span>
                  </div>
                  <button
                    onClick={handleSubmit}
                    className="w-full bg-green-600 text-white py-2.5 rounded-lg text-sm font-medium"
                  >
                    Kirim ke WhatsApp
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
