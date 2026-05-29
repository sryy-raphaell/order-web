"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

function ProductCard({ product, onAddToCart }) {
  const [added, setAdded] = useState(false);
  function handleClick() {
    onAddToCart(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }
  return (
    <div
      style={{
        background: "var(--bg-primary)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-md)",
        padding: "10px 12px",
        display: "flex",
        flexDirection: "column",
        gap: "7px",
      }}
    >
      <div
        style={{ display: "flex", justifyContent: "space-between", gap: "8px" }}
      >
        <p
          style={{
            fontSize: "12px",
            fontWeight: 600,
            color: "var(--text-primary)",
            lineHeight: 1.3,
            flex: 1,
          }}
        >
          {product.name}
        </p>
        <p
          style={{
            fontSize: "12px",
            fontWeight: 700,
            color: "var(--accent)",
            flexShrink: 0,
          }}
        >
          Rp {product.price?.toLocaleString("id-ID") ?? "-"}
        </p>
      </div>
      {product.reason && (
        <p
          style={{
            fontSize: "11px",
            color: "var(--text-muted)",
            lineHeight: 1.5,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {product.reason}
        </p>
      )}
      <button
        onClick={handleClick}
        style={{
          width: "100%",
          background: added ? "var(--accent)" : "var(--accent-subtle)",
          color: added ? "#000" : "var(--accent)",
          border: "1px solid rgba(74,222,128,0.25)",
          borderRadius: "var(--radius-sm)",
          padding: "6px 0",
          fontSize: "11px",
          fontWeight: 600,
          cursor: "pointer",
          transition: "all 0.2s",
          textAlign: "center",
        }}
      >
        {added ? "✓ Ditambahkan" : "+ Tambah ke Keranjang"}
      </button>
    </div>
  );
}

function ChatPanel({ onAddToCart }) {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      type: "text",
      content:
        "Hi! Saya SyRa 👋\nTanya produk IoT yang kamu butuhkan, saya bantu rekomendasikan.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage() {
    if (!input.trim() || loading) return;
    const userMsg = { role: "user", type: "text", content: input.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });
      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          type: data.type || "text",
          content: data.message,
          products: data.products || [],
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          type: "text",
          content: "Maaf, terjadi kesalahan.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        overflow: "hidden",
      }}
    >
      {/* Chat header */}
      <div
        style={{
          padding: "14px 16px",
          borderBottom: "1px solid var(--border)",
          background: "var(--bg-secondary)",
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "50%",
              background: "var(--accent-subtle)",
              border: "1px solid rgba(74,222,128,0.3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "14px",
            }}
          >
            🤖
          </div>
          <div>
            <p
              style={{
                fontSize: "13px",
                fontWeight: 600,
                color: "var(--text-primary)",
                lineHeight: 1,
              }}
            >
              SyRa
            </p>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "4px",
                marginTop: "3px",
              }}
            >
              <div
                style={{
                  width: "6px",
                  height: "6px",
                  borderRadius: "50%",
                  background: "var(--accent)",
                }}
              />
              <span style={{ fontSize: "10px", color: "var(--text-muted)" }}>
                Asisten IoT
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "12px",
          display: "flex",
          flexDirection: "column",
          gap: "10px",
        }}
      >
        {messages.map((msg, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: msg.role === "user" ? "flex-end" : "flex-start",
              gap: "6px",
            }}
          >
            <div
              style={{
                maxWidth: "88%",
                padding: "8px 12px",
                borderRadius:
                  msg.role === "user"
                    ? "14px 14px 3px 14px"
                    : "14px 14px 14px 3px",
                background:
                  msg.role === "user"
                    ? "var(--accent-subtle)"
                    : "var(--bg-tertiary)",
                border: "1px solid",
                borderColor:
                  msg.role === "user"
                    ? "rgba(74,222,128,0.2)"
                    : "var(--border)",
                fontSize: "12px",
                color:
                  msg.role === "user"
                    ? "var(--accent)"
                    : "var(--text-secondary)",
                lineHeight: 1.65,
                whiteSpace: "pre-wrap",
              }}
            >
              {msg.content}
            </div>
            {msg.role === "assistant" && msg.products?.length > 0 && (
              <div
                style={{
                  width: "88%",
                  display: "flex",
                  flexDirection: "column",
                  gap: "6px",
                }}
              >
                {msg.products.map((p, pi) => (
                  <ProductCard key={pi} product={p} onAddToCart={onAddToCart} />
                ))}
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div style={{ display: "flex", justifyContent: "flex-start" }}>
            <div
              style={{
                padding: "8px 14px",
                borderRadius: "14px 14px 14px 3px",
                background: "var(--bg-tertiary)",
                border: "1px solid var(--border)",
                fontSize: "12px",
                color: "var(--text-muted)",
              }}
            >
              <style>{`
                @keyframes blink { 0%,100%{opacity:.25} 50%{opacity:1} }
                .dot{animation:blink 1.2s infinite;display:inline-block;}
                .dot:nth-child(2){animation-delay:.2s}
                .dot:nth-child(3){animation-delay:.4s}
              `}</style>
              <span className="dot">●</span> <span className="dot">●</span>{" "}
              <span className="dot">●</span>
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Input */}
      <div
        style={{
          padding: "10px 12px",
          borderTop: "1px solid var(--border)",
          background: "var(--bg-secondary)",
          display: "flex",
          gap: "8px",
          flexShrink: 0,
        }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              sendMessage();
            }
          }}
          placeholder="Tanya kebutuhan IoT kamu..."
          disabled={loading}
          style={{
            flex: 1,
            background: "var(--bg-tertiary)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-sm)",
            padding: "8px 12px",
            fontSize: "12px",
            color: "var(--text-primary)",
            outline: "none",
          }}
        />
        <button
          onClick={sendMessage}
          disabled={loading || !input.trim()}
          style={{
            background:
              input.trim() && !loading
                ? "var(--accent-subtle)"
                : "var(--bg-tertiary)",
            border: "1px solid",
            borderRadius: "var(--radius-sm)",
            padding: "8px 14px",
            fontSize: "12px",
            fontWeight: 500,
            cursor: input.trim() && !loading ? "pointer" : "default",
            color:
              input.trim() && !loading ? "var(--accent)" : "var(--text-muted)",
            borderColor:
              input.trim() && !loading
                ? "rgba(74,222,128,0.25)"
                : "var(--border)",
            transition: "all 0.15s",
          }}
        >
          Kirim
        </button>
      </div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

async function fetchItems() {
  const res = await fetch("/api/products");
  return res.json();
}

export default function CatalogPage() {
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState("all");
  const [chatCollapsed, setChatCollapsed] = useState(false);
  const [mobileTab, setMobileTab] = useState("catalog"); // "catalog" | "chat"
  const router = useRouter();

  const [cart, setCart] = useState(() => {
    if (typeof window === "undefined") return [];
    const saved = localStorage.getItem("cart");
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cart));
  }, [cart]);
  useEffect(() => {
    fetchItems().then(setItems);
  }, []);

  const addToCart = useCallback((item) => {
    setCart((prev) => {
      const exists = prev.find((c) => c.id === item.id);
      if (exists)
        return prev.map((c) =>
          c.id === item.id ? { ...c, qty: c.qty + 1 } : c,
        );
      return [...prev, { ...item, qty: 1 }];
    });
  }, []);

  function removeFromCart(id) {
    setCart((c) => c.filter((x) => x.id !== id));
  }

  function goToCheckout() {
    if (cart.length === 0) {
      alert("Keranjang masih kosong");
      return;
    }
    router.push("/checkout");
  }

  const filtered =
    filter === "all" ? items : items.filter((i) => i.type === filter);
  const totalItems = cart.reduce((s, c) => s + c.qty, 0);
  const totalPrice = cart.reduce((s, c) => s + c.price * c.qty, 0);

  const CHAT_W = chatCollapsed ? 52 : 300;

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-primary)" }}>
      <style>{`
        /* ── desktop layout ── */
        .main-shell {
          display: flex;
          height: calc(100vh - 52px);
          overflow: hidden;
        }
        /* chat panel */
        .chat-panel {
          width: ${CHAT_W}px;
          min-width: ${CHAT_W}px;
          border-right: 1px solid var(--border);
          background: var(--bg-secondary);
          display: flex;
          flex-direction: column;
          transition: width 0.25s ease, min-width 0.25s ease;
          position: relative;
          overflow: hidden;
        }
        /* catalog + cart panel */
        .right-panel {
          flex: 1;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
        }
        /* mobile tab bar */
        .mobile-tabs { display: none; }

        /* ── mobile ── */
        @media (max-width: 767px) {
          .main-shell { flex-direction: column; height: auto; overflow: visible; }
          .chat-panel { width: 100% !important; min-width: 100% !important; border-right: none;
            border-bottom: 1px solid var(--border);
            height: 480px; display: ${mobileTab === "chat" ? "flex" : "none"} !important; }
          .right-panel { display: ${mobileTab === "catalog" ? "flex" : "none"} !important; overflow-y: visible; }
          .mobile-tabs { display: flex !important; }
          .collapse-btn { display: none !important; }
        }

        /* product grid */
        .product-grid { display: grid; grid-template-columns: 1fr; gap: 12px; }
        @media (min-width: 640px) { .product-grid { grid-template-columns: repeat(2,1fr); } }
        @media (min-width: 1280px) { .product-grid { grid-template-columns: repeat(3,1fr); } }

        /* cart sidebar */
        @media (min-width: 1024px) {
          .catalog-area { flex-direction: row !important; }
          .cart-sidebar { width: 260px !important; flex-shrink: 0; }
        }

        .banner-stats { display: flex; }
        @media (max-width: 640px) { .banner-stats { display: none !important; } }

        /* scrollbar */
        .right-panel::-webkit-scrollbar { width: 4px; }
        .right-panel::-webkit-scrollbar-thumb { background: var(--border-light); border-radius: 2px; }
      `}</style>

      {/* ── Mobile tab bar ── */}
      <div
        className="mobile-tabs"
        style={{
          position: "sticky",
          top: "52px",
          zIndex: 40,
          background: "var(--bg-secondary)",
          borderBottom: "1px solid var(--border)",
          display: "none",
          gap: "0",
        }}
      >
        {["catalog", "chat"].map((tab) => (
          <button
            key={tab}
            onClick={() => setMobileTab(tab)}
            style={{
              flex: 1,
              padding: "10px",
              fontSize: "13px",
              fontWeight: 500,
              background:
                mobileTab === tab ? "var(--bg-tertiary)" : "transparent",
              color:
                mobileTab === tab
                  ? "var(--text-primary)"
                  : "var(--text-secondary)",
              border: "none",
              borderBottom:
                mobileTab === tab
                  ? "2px solid var(--accent)"
                  : "2px solid transparent",
              cursor: "pointer",
              transition: "all 0.15s",
            }}
          >
            {tab === "catalog"
              ? `🛍 Katalog${totalItems > 0 ? ` (${totalItems})` : ""}`
              : "🤖 SyRa Chat"}
          </button>
        ))}
      </div>

      {/* ── Main shell ── */}
      <div className="main-shell">
        {/* ── Left: Chat Panel ── */}
        <div className="chat-panel">
          {/* Collapse toggle button */}
          <button
            className="collapse-btn"
            onClick={() => setChatCollapsed((v) => !v)}
            title={chatCollapsed ? "Buka chat" : "Tutup chat"}
            style={{
              position: "absolute",
              top: "50%",
              right: "-12px",
              transform: "translateY(-50%)",
              zIndex: 10,
              width: "24px",
              height: "48px",
              background: "var(--bg-tertiary)",
              border: "1px solid var(--border)",
              borderRadius: "0 8px 8px 0",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--text-muted)",
              fontSize: "10px",
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--bg-hover)";
              e.currentTarget.style.color = "var(--text-primary)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "var(--bg-tertiary)";
              e.currentTarget.style.color = "var(--text-muted)";
            }}
          >
            {chatCollapsed ? "›" : "‹"}
          </button>

          {/* Collapsed state — just icon */}
          {chatCollapsed ? (
            <div
              onClick={() => setChatCollapsed(false)}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                height: "100%",
                gap: "8px",
                cursor: "pointer",
                padding: "0 8px",
              }}
            >
              <span style={{ fontSize: "18px" }}>🤖</span>
              <span
                style={{
                  fontSize: "10px",
                  color: "var(--text-muted)",
                  writingMode: "vertical-rl",
                  textOrientation: "mixed",
                  letterSpacing: "1px",
                }}
              >
                SyRa
              </span>
            </div>
          ) : (
            <ChatPanel onAddToCart={addToCart} />
          )}
        </div>

        {/* ── Right: Catalog + Cart ── */}
        <div className="right-panel">
          {/* Banner */}
          <div style={{ padding: "28px 28px 0 28px" }}>
            <div
              style={{
                background: "var(--bg-secondary)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-lg)",
                padding: "28px 32px",
                marginBottom: "14px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: "24px",
                position: "relative",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: "-60px",
                  right: "-60px",
                  width: "200px",
                  height: "200px",
                  background: "var(--accent-glow)",
                  borderRadius: "50%",
                  filter: "blur(60px)",
                  pointerEvents: "none",
                }}
              />
              <div style={{ position: "relative", zIndex: 1 }}>
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    background: "var(--accent-subtle)",
                    border: "1px solid rgba(74,222,128,0.2)",
                    borderRadius: "20px",
                    padding: "3px 10px",
                    marginBottom: "10px",
                  }}
                >
                  <div
                    style={{
                      width: "6px",
                      height: "6px",
                      borderRadius: "50%",
                      background: "var(--accent)",
                    }}
                  />
                  <span
                    style={{
                      fontSize: "11px",
                      color: "var(--accent)",
                      fontWeight: 500,
                    }}
                  >
                    IoT Solutions
                  </span>
                </div>
                <h2
                  style={{
                    fontSize: "22px",
                    fontWeight: 700,
                    color: "var(--text-primary)",
                    letterSpacing: "-0.5px",
                    marginBottom: "6px",
                  }}
                >
                  SyRa Store
                </h2>
                <p
                  style={{
                    fontSize: "13px",
                    color: "var(--text-secondary)",
                    maxWidth: "360px",
                    lineHeight: 1.6,
                    marginBottom: "16px",
                  }}
                >
                  Pembuatan & Pembelian Perangkat IoT, Dashboard, Sensor,
                  Microcontroller, 3D Modelling.
                </p>
                <button
                  onClick={() =>
                    document
                      .getElementById("katalog-section")
                      ?.scrollIntoView({ behavior: "smooth" })
                  }
                  style={{
                    background: "var(--accent-subtle)",
                    color: "var(--accent)",
                    border: "1px solid rgba(74,222,128,0.25)",
                    borderRadius: "var(--radius-sm)",
                    padding: "8px 18px",
                    fontSize: "12px",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Lihat Produk →
                </button>
              </div>
              <div
                className="banner-stats"
                style={{
                  display: "flex",
                  gap: "28px",
                  flexShrink: 0,
                  position: "relative",
                  zIndex: 1,
                }}
              >
                {[
                  { value: items.length, label: "Total Item" },
                  {
                    value: items.filter((i) => i.type === "product").length,
                    label: "Hardware",
                  },
                  {
                    value: items.filter((i) => i.type === "service").length,
                    label: "Layanan",
                  },
                ].map((s, i) => (
                  <div key={i} style={{ textAlign: "center" }}>
                    <p
                      style={{
                        fontSize: "24px",
                        fontWeight: 700,
                        color: "var(--text-primary)",
                        letterSpacing: "-1px",
                      }}
                    >
                      {s.value}
                    </p>
                    <p style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                      {s.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Hot products */}
            {items.length > 0 && (
              <div
                style={{
                  background: "var(--bg-secondary)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius-lg)",
                  padding: "14px 18px",
                  marginBottom: "14px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    marginBottom: "12px",
                  }}
                >
                  <span style={{ fontSize: "13px" }}>🔥</span>
                  <p
                    style={{
                      fontSize: "12px",
                      fontWeight: 500,
                      color: "var(--text-primary)",
                    }}
                  >
                    Hot Produk
                  </p>
                  <span
                    style={{ fontSize: "11px", color: "var(--text-muted)" }}
                  >
                    — harga tertinggi
                  </span>
                </div>
                <div
                  style={{
                    display: "flex",
                    gap: "8px",
                    overflowX: "auto",
                    paddingBottom: "4px",
                  }}
                >
                  {[...items]
                    .sort((a, b) => b.price - a.price)
                    .slice(0, 5)
                    .map((item) => (
                      <div
                        key={item.id}
                        onClick={() => addToCart(item)}
                        style={{
                          background: "var(--bg-tertiary)",
                          border: "1px solid var(--border)",
                          borderRadius: "var(--radius-md)",
                          padding: "10px 14px",
                          minWidth: "160px",
                          flexShrink: 0,
                          cursor: "pointer",
                          transition: "border-color 0.15s",
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.borderColor =
                            "var(--border-light)")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.borderColor = "var(--border)")
                        }
                      >
                        <span
                          style={{
                            fontSize: "10px",
                            fontWeight: 500,
                            padding: "2px 6px",
                            borderRadius: "4px",
                            background:
                              item.type === "product"
                                ? "var(--blue-subtle)"
                                : "var(--accent-subtle)",
                            color:
                              item.type === "product"
                                ? "var(--blue)"
                                : "var(--accent)",
                            border: `1px solid ${item.type === "product" ? "rgba(96,165,250,0.2)" : "rgba(74,222,128,0.2)"}`,
                          }}
                        >
                          {item.type === "product" ? "Produk" : "Layanan"}
                        </span>
                        <p
                          style={{
                            fontSize: "12px",
                            fontWeight: 500,
                            color: "var(--text-primary)",
                            margin: "6px 0 3px",
                          }}
                        >
                          {item.name}
                        </p>
                        <p
                          style={{
                            fontSize: "11px",
                            fontWeight: 600,
                            color: "var(--accent)",
                          }}
                        >
                          Rp {item.price.toLocaleString("id-ID")}
                        </p>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>

          {/* Catalog + Cart area */}
          <div
            id="katalog-section"
            className="catalog-area"
            style={{
              padding: "0 28px 28px 28px",
              display: "flex",
              flexDirection: "column",
              gap: "16px",
              flex: 1,
            }}
          >
            {/* Filter + grid */}
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", gap: "6px", margin: "16px 0" }}>
                {["all", "product", "service"].map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    style={{
                      padding: "5px 13px",
                      borderRadius: "var(--radius-sm)",
                      fontSize: "12px",
                      border: "1px solid",
                      cursor: "pointer",
                      transition: "all 0.15s",
                      fontWeight: filter === f ? 500 : 400,
                      borderColor:
                        filter === f ? "var(--accent)" : "var(--border)",
                      background:
                        filter === f ? "var(--accent-subtle)" : "transparent",
                      color:
                        filter === f
                          ? "var(--accent)"
                          : "var(--text-secondary)",
                    }}
                  >
                    {f === "all"
                      ? "Semua"
                      : f === "product"
                        ? "Produk"
                        : "Layanan"}
                  </button>
                ))}
              </div>
              <div className="product-grid">
                {filtered.map((item) => (
                  <Link
                    key={item.id}
                    href={`/product/${item.id}`}
                    style={{ textDecoration: "none" }}
                  >
                    <div
                      style={{
                        background: "var(--bg-secondary)",
                        border: "1px solid var(--border)",
                        borderRadius: "var(--radius-lg)",
                        padding: "14px",
                        display: "flex",
                        flexDirection: "column",
                        gap: "9px",
                        transition: "border-color 0.15s",
                        cursor: "default",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.borderColor =
                          "var(--border-light)")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.borderColor = "var(--border)")
                      }
                    >
                      <span
                        style={{
                          fontSize: "10px",
                          fontWeight: 500,
                          padding: "2px 8px",
                          borderRadius: "4px",
                          background:
                            item.type === "product"
                              ? "var(--blue-subtle)"
                              : "var(--accent-subtle)",
                          color:
                            item.type === "product"
                              ? "var(--blue)"
                              : "var(--accent)",
                          border: `1px solid ${item.type === "product" ? "rgba(59,130,246,0.2)" : "rgba(34,197,94,0.2)"}`,
                          width: "fit-content",
                        }}
                      >
                        {item.type === "product" ? "Produk" : "Layanan"}
                      </span>
                      <div>
                        <p
                          style={{
                            fontWeight: 500,
                            fontSize: "13px",
                            color: "var(--text-primary)",
                            marginBottom: "3px",
                          }}
                        >
                          {item.name}
                        </p>
                        <p
                          style={{
                            fontSize: "12px",
                            color: "var(--text-secondary)",
                            lineHeight: 1.5,
                          }}
                        >
                          {item.description}
                        </p>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginTop: "2px",
                        }}
                      >
                        <span
                          style={{
                            fontWeight: 600,
                            fontSize: "13px",
                            color: "var(--text-primary)",
                          }}
                        >
                          Rp {item.price.toLocaleString("id-ID")}
                        </span>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            addToCart(item);
                          }}
                          style={{
                            background: "var(--accent-subtle)",
                            color: "var(--accent)",
                            border: "1px solid rgba(74,222,128,0.25)",
                            borderRadius: "var(--radius-sm)",
                            padding: "5px 12px",
                            fontSize: "11px",
                            fontWeight: 600,
                            cursor: "pointer",
                          }}
                        >
                          + Tambah
                        </button>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Cart sidebar */}
            <div className="cart-sidebar" style={{ width: "100%" }}>
              <div
                style={{
                  background: "var(--bg-secondary)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius-lg)",
                  padding: "14px",
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
                      fontWeight: 600,
                      fontSize: "13px",
                      color: "var(--text-primary)",
                    }}
                  >
                    Keranjang
                  </p>
                  {totalItems > 0 && (
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
                      {totalItems} item
                    </span>
                  )}
                </div>
                {cart.length === 0 && (
                  <p
                    style={{
                      color: "var(--text-muted)",
                      fontSize: "12px",
                      textAlign: "center",
                      padding: "20px 0",
                    }}
                  >
                    Belum ada item
                  </p>
                )}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "2px",
                  }}
                >
                  {cart.map((item) => (
                    <div
                      key={item.id}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "9px 0",
                        borderBottom: "1px solid var(--border)",
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 0, marginRight: "8px" }}>
                        <p
                          style={{
                            fontSize: "12px",
                            fontWeight: 500,
                            color: "var(--text-primary)",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {item.name}
                        </p>
                        <p
                          style={{
                            fontSize: "11px",
                            color: "var(--text-secondary)",
                            marginTop: "2px",
                          }}
                        >
                          Rp {(item.price * item.qty).toLocaleString("id-ID")}
                        </p>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "5px",
                          flexShrink: 0,
                        }}
                      >
                        <button
                          onClick={() =>
                            item.qty === 1
                              ? removeFromCart(item.id)
                              : setCart((c) =>
                                  c.map((x) =>
                                    x.id === item.id
                                      ? { ...x, qty: x.qty - 1 }
                                      : x,
                                  ),
                                )
                          }
                          style={{
                            width: "24px",
                            height: "24px",
                            borderRadius: "var(--radius-sm)",
                            border: "1px solid var(--border)",
                            fontSize: "13px",
                            fontWeight: 600,
                            background:
                              item.qty === 1
                                ? "var(--red-subtle)"
                                : "var(--bg-tertiary)",
                            color:
                              item.qty === 1
                                ? "var(--red)"
                                : "var(--text-secondary)",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          −
                        </button>
                        <span
                          style={{
                            fontSize: "12px",
                            fontWeight: 600,
                            color: "var(--text-primary)",
                            minWidth: "18px",
                            textAlign: "center",
                          }}
                        >
                          {item.qty}
                        </span>
                        <button
                          onClick={() =>
                            setCart((c) =>
                              c.map((x) =>
                                x.id === item.id ? { ...x, qty: x.qty + 1 } : x,
                              ),
                            )
                          }
                          style={{
                            width: "24px",
                            height: "24px",
                            borderRadius: "var(--radius-sm)",
                            border: "1px solid rgba(74,222,128,0.25)",
                            background: "var(--accent-subtle)",
                            color: "var(--accent)",
                            cursor: "pointer",
                            fontSize: "13px",
                            fontWeight: 600,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                {cart.length > 0 && (
                  <div style={{ marginTop: "14px" }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: "13px",
                        fontWeight: 600,
                        color: "var(--text-primary)",
                        marginBottom: "12px",
                      }}
                    >
                      <span>Total</span>
                      <span>Rp {totalPrice.toLocaleString("id-ID")}</span>
                    </div>
                    <button
                      onClick={goToCheckout}
                      style={{
                        width: "100%",
                        background: "var(--accent-subtle)",
                        color: "var(--accent)",
                        border: "1px solid rgba(74,222,128,0.25)",
                        borderRadius: "var(--radius-sm)",
                        padding: "9px",
                        fontSize: "12px",
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      Pesan via WhatsApp
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
