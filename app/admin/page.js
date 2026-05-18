"use client";
import { useState, useEffect } from "react";
import Image from "next/image";

const inputStyle = {
  background: "var(--bg-tertiary)",
  border: "1px solid var(--border)",
  borderRadius: "var(--radius-sm)",
  padding: "8px 12px",
  fontSize: "13px",
  color: "var(--text-primary)",
  width: "100%",
  outline: "none",
  transition: "border-color 0.15s",
};

export default function AdminPage() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({
    name: "",
    type: "product",
    price: "",
    description: "",
    longDescription: "",
    images: [],
  });

  const [editId, setEditId] = useState(null);

  const [imageUrl, setImageUrl] = useState("")

function addImageUrl() {
  if (!imageUrl.trim()) return
  setForm({ ...form, images: [...(form.images || []), imageUrl.trim()] })
  setImageUrl("")
}

function removeImage(index) {
  setForm({ ...form, images: form.images.filter((_, i) => i !== index) })
}

async function handleImageUpload(e) {
  const files = Array.from(e.target.files)
  const uploaded = []
  for (const file of files) {
    const data = new FormData()
    data.append("file", file)
    const res = await fetch("/api/upload", { method: "POST", body: data })
    const result = await res.json()
    if (result.url) uploaded.push(result.url)
  }
  setForm({ ...form, images: [...(form.images || []), ...uploaded] })
}

  useEffect(() => {
    loadItems();
  }, []);

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
    setForm({ name: "", type: "product", price: "", description: "", longDescription: "", images: [] });
    loadItems();
  }

  async function handleDelete(id) {
    if (!confirm("Hapus item ini?")) return;
    await fetch(`/api/products/${id}`, { method: "DELETE" });
    loadItems();
  }

  function handleEdit(item) {
    setEditId(item.id);
    setForm({
      name: item.name,
      type: item.type,
      price: item.price,
      description: item.description,
      longDescription: item.longDescription || "",
      images: item.images || [],
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg-primary)",
        padding: "28px 40px",
      }}
    >
      <style>{`
  .admin-grid { display: grid; grid-template-columns: 1fr; gap: 12px; }
  @media (min-width: 640px) { .admin-grid { grid-template-columns: 1fr 1fr; } }
  input:focus, select:focus { border-color: var(--accent) !important; }
  input::placeholder { color: var(--text-muted); }
  input[type=number]::-webkit-inner-spin-button,
  input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
  input[type=number] { -moz-appearance: textfield; }
`}</style>

      {/* Header */}
      <div style={{ marginBottom: "24px" }}>
        <h1
          style={{
            fontSize: "18px",
            fontWeight: 600,
            color: "var(--text-primary)",
            marginBottom: "4px",
          }}
        >
          Admin
        </h1>
        <p style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
          Kelola produk dan layanan
        </p>
      </div>

      {/* Form */}
      <div
        style={{
          background: "var(--bg-secondary)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-lg)",
          padding: "20px",
          marginBottom: "16px",
        }}
      >
        <p
          style={{
            fontSize: "13px",
            fontWeight: 500,
            color: "var(--text-primary)",
            marginBottom: "16px",
          }}
        >
          {editId ? "Edit Item" : "Tambah Item Baru"}
        </p>

        <div className="admin-grid">
          <input
            style={inputStyle}
            placeholder="Nama produk/layanan"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <select
            style={{ ...inputStyle, cursor: "pointer" }}
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
          >
            <option value="product">Produk</option>
            <option value="service">Layanan</option>
          </select>
          <input
            style={inputStyle}
            placeholder="Harga (angka)"
            type="number"
            value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })}
          />
          <input
            style={inputStyle}
            placeholder="Deskripsi"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          {/* Long Description */}
          <div style={{ gridColumn: "1 / -1" }}>
            <textarea
              style={{ ...inputStyle, minHeight: "80px", resize: "vertical" }}
              placeholder="Deskripsi lengkap produk (opsional)"
              value={form.longDescription || ""}
              onChange={(e) =>
                setForm({ ...form, longDescription: e.target.value })
              }
            />
          </div>

          {/* Images */}
          <div style={{ gridColumn: "1 / -1" }}>
            <p
              style={{
                fontSize: "12px",
                color: "var(--text-muted)",
                marginBottom: "8px",
              }}
            >
              Gambar produk — paste URL atau upload file
            </p>

            {/* URL input */}
            <div style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
              <input
                style={{ ...inputStyle, flex: 1 }}
                placeholder="Paste URL gambar (https://...)"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
              />
              <button
                onClick={addImageUrl}
                style={{
                  background: "var(--bg-tertiary)",
                  border: "1px solid var(--border)",
                  color: "var(--text-secondary)",
                  borderRadius: "var(--radius-sm)",
                  padding: "8px 14px",
                  fontSize: "12px",
                  cursor: "pointer",
                  flexShrink: 0,
                }}
              >
                + URL
              </button>
            </div>

            {/* Upload file */}
            <label
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                background: "var(--bg-tertiary)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-sm)",
                padding: "7px 14px",
                fontSize: "12px",
                color: "var(--text-secondary)",
                cursor: "pointer",
                marginBottom: "10px",
              }}
            >
              📁 Upload Gambar
              <input
                type="file"
                accept="image/*"
                multiple
                style={{ display: "none" }}
                onChange={handleImageUpload}
              />
            </label>

            {/* Preview gambar */}
            {(form.images || []).length > 0 && (
              <div
                style={{
                  display: "flex",
                  gap: "8px",
                  flexWrap: "wrap",
                  marginTop: "8px",
                }}
              >
                {(form.images || []).map((img, i) => (
                  <div key={i} style={{ position: "relative" }}>
                    <Image
                      src={img}
                      alt=""
                      fill
                      style={{
                        objectFit: "cover",
                        borderRadius: "var(--radius-sm)",
                        border: "1px solid var(--border)",
                      }}
                    />
                    <button
                      onClick={() => removeImage(i)}
                      style={{
                        position: "absolute",
                        top: "-6px",
                        right: "-6px",
                        background: "var(--red)",
                        color: "#fff",
                        border: "none",
                        borderRadius: "50%",
                        width: "18px",
                        height: "18px",
                        fontSize: "10px",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div style={{ display: "flex", gap: "8px", marginTop: "14px" }}>
          <button
            onClick={handleSubmit}
            style={{
              background: "var(--accent-subtle)",
              color: "var(--accent)",
              border: "1px solid rgba(74,222,128,0.25)",
              borderRadius: "var(--radius-sm)",
              padding: "8px 18px",
              fontSize: "13px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {editId ? "Simpan Perubahan" : "Tambah"}
          </button>
          {editId && (
            <button
              onClick={() => {
                setEditId(null);
                setForm({
                  name: "",
                  type: "product",
                  price: "",
                  description: "",
                  longDescription: "",
                  images: [],
                });
              }}
              style={{
                background: "transparent",
                color: "var(--text-secondary)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-sm)",
                padding: "8px 18px",
                fontSize: "13px",
                cursor: "pointer",
              }}
            >
              Batal
            </button>
          )}
        </div>
      </div>

      {/* List */}
      <div
        style={{
          background: "var(--bg-secondary)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-lg)",
          overflow: "hidden",
        }}
      >
        {/* List header */}
        <div
          style={{
            padding: "12px 16px",
            borderBottom: "1px solid var(--border)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <p
            style={{
              fontSize: "13px",
              fontWeight: 500,
              color: "var(--text-primary)",
            }}
          >
            Daftar Item
          </p>
          <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
            {items.length} item
          </span>
        </div>

        {items.length === 0 && (
          <p
            style={{
              textAlign: "center",
              padding: "40px",
              color: "var(--text-muted)",
              fontSize: "13px",
            }}
          >
            Belum ada data
          </p>
        )}

        {items.map((item, index) => (
          <div
            key={item.id}
            style={{
              padding: "14px 16px",
              borderTop: index === 0 ? "none" : "1px solid var(--border)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "12px",
              transition: "background 0.1s",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = "var(--bg-hover)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = "transparent")
            }
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  marginBottom: "3px",
                }}
              >
                <p
                  style={{
                    fontSize: "13px",
                    fontWeight: 500,
                    color: "var(--text-primary)",
                  }}
                >
                  {item.name}
                </p>
                <span
                  style={{
                    fontSize: "10px",
                    fontWeight: 500,
                    padding: "2px 7px",
                    borderRadius: "4px",
                    background:
                      item.type === "product"
                        ? "var(--blue-subtle)"
                        : "var(--accent-subtle)",
                    color:
                      item.type === "product" ? "var(--blue)" : "var(--accent)",
                    border: `1px solid ${item.type === "product" ? "rgba(96,165,250,0.2)" : "rgba(74,222,128,0.2)"}`,
                    flexShrink: 0,
                  }}
                >
                  {item.type === "product" ? "Produk" : "Layanan"}
                </span>
              </div>
              <div
                style={{ display: "flex", gap: "12px", alignItems: "center" }}
              >
                <p
                  style={{
                    fontSize: "12px",
                    color: "var(--text-secondary)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {item.description}
                </p>
                <span
                  style={{
                    fontSize: "12px",
                    fontWeight: 600,
                    color: "var(--text-primary)",
                    flexShrink: 0,
                  }}
                >
                  Rp {item.price.toLocaleString("id-ID")}
                </span>
              </div>
            </div>

            <div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
              <button
                onClick={() => handleEdit(item)}
                style={{
                  background: "transparent",
                  border: "1px solid var(--border)",
                  color: "var(--text-secondary)",
                  borderRadius: "var(--radius-sm)",
                  padding: "5px 12px",
                  fontSize: "12px",
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "var(--border-light)";
                  e.currentTarget.style.color = "var(--text-primary)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "var(--border)";
                  e.currentTarget.style.color = "var(--text-secondary)";
                }}
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(item.id)}
                style={{
                  background: "transparent",
                  border: "1px solid rgba(248,113,113,0.2)",
                  color: "var(--red)",
                  borderRadius: "var(--radius-sm)",
                  padding: "5px 12px",
                  fontSize: "12px",
                  cursor: "pointer",
                }}
              >
                Hapus
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
