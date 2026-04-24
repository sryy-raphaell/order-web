"use client";
import { useState, useEffect } from "react";

export default function AdminPage() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({ name: "", type: "product", price: "", description: "" });
  const [editId, setEditId] = useState(null);

  useEffect(() => { loadItems() }, []);

  async function loadItems() {
    const res = await fetch("/api/products");
    const data = await res.json();
    setItems(data);
  }

  async function handleSubmit() {
    if (!form.name || !form.price || !form.description) {
      alert("Semua field wajib diisi");
      return;
    }
    const payload = { ...form, price: parseInt(form.price) };
    if (editId) {
      await fetch(`/api/products/${editId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      setEditId(null);
    } else {
      await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    }
    setForm({ name: "", type: "product", price: "", description: "" });
    loadItems();
  }

  async function handleDelete(id) {
    if (!confirm("Hapus item ini?")) return;
    await fetch(`/api/products/${id}`, { method: "DELETE" });
    loadItems();
  }

  function handleEdit(item) {
    setEditId(item.id);
    setForm({ name: item.name, type: item.type, price: item.price, description: item.description });
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-4">
        <h1 className="text-xl font-medium mb-6">Admin — Kelola Produk</h1>

        {/* Form */}
        <div className="bg-white border border-gray-200 rounded-xl p-4 mb-6">
          <h2 className="text-base font-medium mb-4">
            {editId ? "Edit Item" : "Tambah Item Baru"}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-full"
              placeholder="Nama produk/layanan"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <select
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-full"
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
            >
              <option value="product">Produk</option>
              <option value="service">Layanan</option>
            </select>
            <input
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-full"
              placeholder="Harga (angka)"
              type="number"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
            />
            <input
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-full"
              placeholder="Deskripsi"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <div className="flex gap-3 mt-4">
            <button onClick={handleSubmit} className="bg-gray-900 text-white px-5 py-2 rounded-lg text-sm">
              {editId ? "Simpan Perubahan" : "Tambah"}
            </button>
            {editId && (
              <button
                onClick={() => { setEditId(null); setForm({ name: "", type: "product", price: "", description: "" }); }}
                className="border border-gray-200 px-5 py-2 rounded-lg text-sm"
              >
                Batal
              </button>
            )}
          </div>
        </div>

        {/* List produk — card style untuk mobile */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          {items.length === 0 && (
            <p className="text-center py-8 text-gray-400 text-sm">Belum ada data</p>
          )}
          {items.map((item) => (
            <div key={item.id} className="border-t border-gray-100 p-4">
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1 min-w-0 mr-2">
                  <p className="font-medium text-sm">{item.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5 truncate">{item.description}</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full shrink-0 ${item.type === "product" ? "bg-blue-50 text-blue-700" : "bg-green-50 text-green-700"}`}>
                  {item.type === "product" ? "Produk" : "Layanan"}
                </span>
              </div>
              <div className="flex justify-between items-center mt-3">
                <span className="text-sm font-medium">Rp {item.price.toLocaleString("id-ID")}</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(item)}
                    className="text-xs border border-gray-200 px-3 py-1.5 rounded-lg"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="text-xs border border-red-200 text-red-600 px-3 py-1.5 rounded-lg"
                  >
                    Hapus
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}