"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

async function fetchItems() {
  const res = await fetch("/api/products");
  return res.json();
}

export default function CatalogPage() {
  const [items, setItems] = useState([]);
  const [cart, setCart] = useState([]);
  const [filter, setFilter] = useState("all");
  const router = useRouter();

  useEffect(() => {
    fetchItems().then((data) => setItems(data));
  }, []);

  function addToCart(item) {
    const exists = cart.find((c) => c.id === item.id);
    if (exists) {
      setCart(cart.map((c) => (c.id === item.id ? { ...c, qty: c.qty + 1 } : c)));
    } else {
      setCart([...cart, { ...item, qty: 1 }]);
    }
  }

  function removeFromCart(id) {
    setCart(cart.filter((c) => c.id !== id));
  }

  function goToCheckout() {
    if (cart.length === 0) {
      alert("Keranjang masih kosong");
      return;
    }
    localStorage.setItem("cart", JSON.stringify(cart));
    router.push("/checkout");
  }

  const filtered = filter === "all" ? items : items.filter((i) => i.type === filter);
  const totalItems = cart.reduce((sum, c) => sum + c.qty, 0);
  const totalPrice = cart.reduce((sum, c) => sum + c.price * c.qty, 0);

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Sub header */}
      <div className="bg-white border-b border-gray-200 px-6 py-3 flex justify-between items-center">
        <p className="text-sm text-gray-500">Produk & Layanan IoT</p>
        <div className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm">
          Cart ({totalItems})
        </div>
      </div>

      <div className="max-w-5xl mx-auto p-4 flex flex-col lg:flex-row gap-6">

        {/* Katalog */}
        <div className="flex-1">
          {/* Filter */}
          <div className="flex gap-2 mb-4">
            {["all", "product", "service"].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-lg text-sm border ${filter === f ? "bg-gray-900 text-white border-gray-900" : "bg-white border-gray-200"}`}
              >
                {f === "all" ? "Semua" : f === "product" ? "Produk" : "Layanan"}
              </button>
            ))}
          </div>

          {/* Grid produk */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filtered.map((item) => (
              <div key={item.id} className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col justify-between">
                <div>
                  <span className={`text-xs px-2 py-1 rounded-full ${item.type === "product" ? "bg-blue-50 text-blue-700" : "bg-green-50 text-green-700"}`}>
                    {item.type === "product" ? "Produk" : "Layanan"}
                  </span>
                  <h3 className="font-medium text-sm mt-2 mb-1">{item.name}</h3>
                  <p className="text-xs text-gray-500 mb-3">{item.description}</p>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-medium text-sm">Rp {item.price.toLocaleString("id-ID")}</span>
                  <button
                    onClick={() => addToCart(item)}
                    className="bg-gray-900 text-white text-xs px-3 py-1.5 rounded-lg"
                  >
                    + Tambah
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Cart */}
        <div className="w-full lg:w-72">
          <div className="bg-white border border-gray-200 rounded-xl p-4 lg:sticky lg:top-16">
            <h2 className="font-medium mb-4">Keranjang</h2>
            {cart.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-4">Belum ada item</p>
            )}
            {cart.map((item) => (
              <div key={item.id} className="flex justify-between items-center py-2 border-b border-gray-100">
                <div>
                  <p className="text-sm font-medium">{item.name}</p>
                  <p className="text-xs text-gray-500">x{item.qty} · Rp {(item.price * item.qty).toLocaleString("id-ID")}</p>
                </div>
                <button onClick={() => removeFromCart(item.id)} className="text-red-400 text-xs">
                  Hapus
                </button>
              </div>
            ))}
            {cart.length > 0 && (
              <div className="mt-4">
                <div className="flex justify-between text-sm font-medium mb-4">
                  <span>Total</span>
                  <span>Rp {totalPrice.toLocaleString("id-ID")}</span>
                </div>
                <button onClick={goToCheckout} className="w-full bg-green-600 text-white py-2 rounded-lg text-sm">
                  Pesan via WhatsApp
                </button>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}