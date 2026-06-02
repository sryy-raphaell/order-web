"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CheckoutPage() {
  const [form, setForm] = useState({ name: "", address: "", phone: "" });
  const [submitted, setSubmitted] = useState(false);
  const [orderResult, setOrderResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const [cart] = useState(() => {
    if (typeof window === "undefined") return [];
    const saved = localStorage.getItem("cart");
    return saved ? JSON.parse(saved) : [];
  });

  async function handleSubmit() {
    if (!form.name || !form.address || !form.phone) {
      alert("Semua field wajib diisi");
      return;
    }

    setLoading(true);
    const cleanPhone = form.phone.replace(/\D/g, "").replace(/^0/, "62");

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          phone: cleanPhone,
          items: cart,
          total: cart.reduce((sum, c) => sum + c.price * c.qty, 0),
        }),
      });

      const result = await res.json();
      setOrderResult({ ...result, phone: cleanPhone, name: form.name });
      setSubmitted(true);
      localStorage.removeItem("cart");

      // Buka WA Web dengan detail order
      const total = cart.reduce((sum, c) => sum + c.price * c.qty, 0);
      const message = [
        "Halo, saya ingin memesan:",
        "",
        ...cart.map(
          (item) =>
            `- ${item.name} x${item.qty} = Rp ${(item.price * item.qty).toLocaleString("id-ID")}`
        ),
        "",
        `Total: Rp ${total.toLocaleString("id-ID")}`,
        `Nama: ${form.name}`,
        `No HP: ${cleanPhone}`,
        `Alamat: ${form.address}`,
      ].join("\n");

      const encoded = encodeURIComponent(message);
      const waNumber = "6285178336732";
      window.open(`https://wa.me/${waNumber}?text=${encoded}`);
    } catch (err) {
      alert("Terjadi kesalahan, coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  const total = cart.reduce((sum, c) => sum + c.price * c.qty, 0);

  // ── Halaman konfirmasi setelah order berhasil ──
  if (submitted && orderResult) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "var(--bg-primary)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px",
        }}
      >
        <div
          style={{
            background: "var(--bg-secondary)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-lg)",
            padding: "32px",
            maxWidth: "480px",
            width: "100%",
          }}
        >
          {/* Icon sukses */}
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "50%",
              background: "var(--accent-subtle)",
              border: "1px solid rgba(74,222,128,0.3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "22px",
              marginBottom: "16px",
            }}
          >
            ✅
          </div>

          <h2
            style={{
              fontSize: "18px",
              fontWeight: 700,
              color: "var(--text-primary)",
              marginBottom: "6px",
            }}
          >
            Order Berhasil Dibuat!
          </h2>
          <p
            style={{
              fontSize: "13px",
              color: "var(--text-secondary)",
              marginBottom: "24px",
              lineHeight: 1.6,
            }}
          >
            Order{" "}
            <span style={{ color: "var(--text-muted)" }}>
              #{orderResult.orderId}
            </span>{" "}
            atas nama{" "}
            <strong style={{ color: "var(--text-primary)" }}>
              {orderResult.name}
            </strong>{" "}
            sudah masuk.
          </p>

          {/* Token box */}
          <div
            style={{
              background: "var(--bg-tertiary)",
              border: "1px solid rgba(74,222,128,0.25)",
              borderRadius: "var(--radius-md)",
              padding: "16px",
              marginBottom: "12px",
            }}
          >
            <p
              style={{
                fontSize: "11px",
                color: "var(--text-muted)",
                marginBottom: "8px",
                fontWeight: 500,
                letterSpacing: "0.5px",
              }}
            >
              🔑 TOKEN AKUN KAMU
            </p>
            <p
              style={{
                fontSize: "22px",
                fontWeight: 700,
                color: "var(--accent)",
                letterSpacing: "3px",
                fontFamily: "monospace",
                marginBottom: "10px",
              }}
            >
              {orderResult.token}
            </p>
            <p
              style={{
                fontSize: "12px",
                color: "var(--text-secondary)",
                lineHeight: 1.6,
                marginBottom: "8px",
              }}
            >
              Kirim perintah ini ke bot WhatsApp SyRa Store:
            </p>
            <div
              style={{
                background: "var(--bg-primary)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-sm)",
                padding: "10px 14px",
                fontFamily: "monospace",
                fontSize: "13px",
                color: "var(--accent)",
                userSelect: "all",
              }}
            >
              !link {orderResult.token}
            </div>
          </div>

          {/* Status pengiriman WA */}
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "8px",
              padding: "12px",
              background: orderResult.waSent
                ? "var(--accent-subtle)"
                : "rgba(251,191,36,0.08)",
              border: `1px solid ${
                orderResult.waSent
                  ? "rgba(74,222,128,0.2)"
                  : "rgba(251,191,36,0.2)"
              }`,
              borderRadius: "var(--radius-sm)",
              marginBottom: "20px",
            }}
          >
            <span style={{ fontSize: "14px", flexShrink: 0 }}>
              {orderResult.waSent ? "📱" : "⚠️"}
            </span>
            <p
              style={{
                fontSize: "12px",
                color: orderResult.waSent ? "var(--accent)" : "#fbbf24",
                lineHeight: 1.6,
              }}
            >
              {orderResult.waSent
                ? "Token sudah dikirim otomatis ke WhatsApp kamu! Cek WA dan balas dengan perintah di atas."
                : "Gagal kirim otomatis ke WA. Simpan token di atas dan kirim manual ke bot SyRa Store."}
            </p>
          </div>

          <button
            onClick={() => router.push("/")}
            style={{
              width: "100%",
              background: "var(--accent-subtle)",
              color: "var(--accent)",
              border: "1px solid rgba(74,222,128,0.25)",
              borderRadius: "var(--radius-sm)",
              padding: "10px",
              fontSize: "13px",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--accent)";
              e.currentTarget.style.color = "#000";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "var(--accent-subtle)";
              e.currentTarget.style.color = "var(--accent)";
            }}
          >
            Kembali ke Katalog
          </button>
        </div>
      </div>
    );
  }

  // ── Form checkout ──
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg-primary)",
        padding: "28px 40px",
      }}
    >
      <style>{`
        .checkout-input {
          width: 100%;
          background: var(--bg-tertiary);
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          padding: 9px 12px;
          font-size: 13px;
          color: var(--text-primary);
          outline: none;
          transition: border-color 0.15s;
          box-sizing: border-box;
          font-family: inherit;
        }
        .checkout-input:focus { border-color: var(--accent); }
        .checkout-input::placeholder { color: var(--text-muted); }
        .checkout-layout {
          display: flex;
          gap: 20px;
          flex-direction: column;
        }
        @media (min-width: 768px) {
          .checkout-layout { flex-direction: row; }
          .checkout-summary { width: 288px; flex-shrink: 0; }
        }
      `}</style>

      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          marginBottom: "24px",
        }}
      >
        <button
          onClick={() => router.push("/")}
          style={{
            background: "transparent",
            border: "1px solid var(--border)",
            color: "var(--text-secondary)",
            borderRadius: "var(--radius-sm)",
            padding: "6px 14px",
            fontSize: "13px",
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
          ← Kembali
        </button>
        <div>
          <h1
            style={{
              fontSize: "18px",
              fontWeight: 600,
              color: "var(--text-primary)",
              marginBottom: "2px",
            }}
          >
            Checkout
          </h1>
          <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>
            Isi data pemesan untuk melanjutkan
          </p>
        </div>
      </div>

      <div className="checkout-layout">
        {/* Form */}
        <div style={{ flex: 1 }}>
          <div
            style={{
              background: "var(--bg-secondary)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-lg)",
              padding: "20px",
            }}
          >
            <p
              style={{
                fontSize: "13px",
                fontWeight: 500,
                color: "var(--text-primary)",
                marginBottom: "18px",
              }}
            >
              Data Pemesan
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <label
                  style={{
                    fontSize: "12px",
                    color: "var(--text-muted)",
                    display: "block",
                    marginBottom: "6px",
                  }}
                >
                  Nama Lengkap
                </label>
                <input
                  className="checkout-input"
                  placeholder="Masukkan nama lengkap"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>

              <div>
                <label
                  style={{
                    fontSize: "12px",
                    color: "var(--text-muted)",
                    display: "block",
                    marginBottom: "6px",
                  }}
                >
                  No WhatsApp
                </label>
                <input
                  className="checkout-input"
                  placeholder="Contoh: 08123456789"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
                <p
                  style={{
                    fontSize: "11px",
                    color: "#f59e0b",
                    marginTop: "6px",
                    lineHeight: 1.5,
                  }}
                >
                  ⚠ Token akan dikirim ke nomor ini. Pastikan aktif di WhatsApp.
                </p>
              </div>

              <div>
                <label
                  style={{
                    fontSize: "12px",
                    color: "var(--text-muted)",
                    display: "block",
                    marginBottom: "6px",
                  }}
                >
                  Alamat Lengkap
                </label>
                <textarea
                  className="checkout-input"
                  placeholder="Masukkan alamat lengkap"
                  rows={3}
                  value={form.address}
                  onChange={(e) =>
                    setForm({ ...form, address: e.target.value })
                  }
                  style={{ resize: "vertical", minHeight: "80px" }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Order Summary */}
        <div className="checkout-summary">
          <div
            style={{
              background: "var(--bg-secondary)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-lg)",
              padding: "16px",
              position: "sticky",
              top: "16px",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "14px",
              }}
            >
              <p
                style={{
                  fontSize: "13px",
                  fontWeight: 500,
                  color: "var(--text-primary)",
                }}
              >
                Ringkasan Order
              </p>
              {cart.length > 0 && (
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: 600,
                    padding: "2px 8px",
                    borderRadius: "20px",
                    background: "var(--accent-subtle)",
                    color: "var(--accent)",
                    border: "1px solid rgba(74,222,128,0.2)",
                  }}
                >
                  {cart.reduce((s, c) => s + c.qty, 0)} item
                </span>
              )}
            </div>

            {cart.length === 0 ? (
              <p
                style={{
                  fontSize: "12px",
                  color: "var(--text-muted)",
                  textAlign: "center",
                  padding: "24px 0",
                }}
              >
                Keranjang kosong
              </p>
            ) : (
              <>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  {cart.map((item, index) => (
                    <div
                      key={item.id}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        padding: "10px 0",
                        borderBottom:
                          index < cart.length - 1
                            ? "1px solid var(--border)"
                            : "none",
                        gap: "8px",
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p
                          style={{
                            fontSize: "12px",
                            fontWeight: 500,
                            color: "var(--text-primary)",
                            marginBottom: "2px",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {item.name}
                        </p>
                        <p style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                          x{item.qty}
                        </p>
                      </div>
                      <p
                        style={{
                          fontSize: "12px",
                          fontWeight: 500,
                          color: "var(--text-secondary)",
                          flexShrink: 0,
                        }}
                      >
                        Rp {(item.price * item.qty).toLocaleString("id-ID")}
                      </p>
                    </div>
                  ))}
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginTop: "14px",
                    paddingTop: "14px",
                    borderTop: "1px solid var(--border)",
                    marginBottom: "14px",
                  }}
                >
                  <span
                    style={{
                      fontSize: "13px",
                      fontWeight: 600,
                      color: "var(--text-primary)",
                    }}
                  >
                    Total
                  </span>
                  <span
                    style={{
                      fontSize: "14px",
                      fontWeight: 700,
                      color: "var(--accent)",
                    }}
                  >
                    Rp {total.toLocaleString("id-ID")}
                  </span>
                </div>

                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  style={{
                    width: "100%",
                    background: loading ? "var(--bg-tertiary)" : "var(--accent-subtle)",
                    color: loading ? "var(--text-muted)" : "var(--accent)",
                    border: "1px solid rgba(74,222,128,0.25)",
                    borderRadius: "var(--radius-sm)",
                    padding: "10px",
                    fontSize: "13px",
                    fontWeight: 600,
                    cursor: loading ? "default" : "pointer",
                    transition: "all 0.15s",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                  }}
                  onMouseEnter={(e) => {
                    if (!loading) {
                      e.currentTarget.style.background = "var(--accent)";
                      e.currentTarget.style.color = "#000";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!loading) {
                      e.currentTarget.style.background = "var(--accent-subtle)";
                      e.currentTarget.style.color = "var(--accent)";
                    }
                  }}
                >
                  <span>💬</span>
                  {loading ? "Memproses..." : "Kirim ke WhatsApp"}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}