"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

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
      setCart(
        cart.map((c) => (c.id === item.id ? { ...c, qty: c.qty + 1 } : c)),
      );
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

  const filtered =
    filter === "all" ? items : items.filter((i) => i.type === filter);
  const totalItems = cart.reduce((sum, c) => sum + c.qty, 0);
  const totalPrice = cart.reduce((sum, c) => sum + c.price * c.qty, 0);

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-primary)" }}>
      {/* Sub header */}

      {/* Banner */}
      <div
        style={{
          padding: "40px 40px 0 40px",
          marginBottom: "0",
        }}
      >
        {/* Hero */}
        <div
          style={{
            background: "var(--bg-secondary)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-lg)",
            padding: "32px 40px",
            marginBottom: "16px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "24px",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Glow effect */}
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
                marginBottom: "12px",
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
                fontSize: "26px",
                fontWeight: 700,
                color: "var(--text-primary)",
                lineHeight: 1.2,
                marginBottom: "8px",
                letterSpacing: "-0.5px",
              }}
            >
              Smart IoT Store
            </h2>
            <p
              style={{
                fontSize: "14px",
                color: "var(--text-secondary)",
                marginBottom: "20px",
                maxWidth: "400px",
                lineHeight: 1.6,
              }}
            >
              Solusi perangkat IoT dan layanan instalasi terpercaya. Dari sensor
              hingga dashboard monitoring.
            </p>
            <button
              onClick={() =>
                document
                  .getElementById("katalog-section")
                  .scrollIntoView({ behavior: "smooth" })
              }
              style={{
                background: "var(--accent-subtle)",
                color: "var(--accent)",
                border: "1px solid rgba(74,222,128,0.25)",
                borderRadius: "var(--radius-sm)",
                padding: "9px 20px",
                fontSize: "13px",
                fontWeight: 600,
                cursor: "pointer",
                transition: "opacity 0.15s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
            >
              Lihat Produk →
            </button>
          </div>

          {/* Stats */}
          <div
            style={{
              display: "flex",
              gap: "32px",
              flexShrink: 0,
              position: "relative",
              zIndex: 1,
            }}
            className="banner-stats"
          >
            {[
              { value: items.length, label: "Produk & Layanan" },
              {
                value: items.filter((i) => i.type === "product").length,
                label: "Hardware",
              },
              {
                value: items.filter((i) => i.type === "service").length,
                label: "Layanan",
              },
            ].map((stat, i) => (
              <div key={i} style={{ textAlign: "center" }}>
                <p
                  style={{
                    fontSize: "28px",
                    fontWeight: 700,
                    color: "var(--text-primary)",
                    letterSpacing: "-1px",
                  }}
                >
                  {stat.value}
                </p>
                <p style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Hot Products */}
        {items.length > 0 && (
          <div
            style={{
              background: "var(--bg-secondary)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-lg)",
              padding: "16px 20px",
              marginBottom: "16px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                marginBottom: "14px",
              }}
            >
              <span style={{ fontSize: "14px" }}>🔥</span>
              <p
                style={{
                  fontSize: "13px",
                  fontWeight: 500,
                  color: "var(--text-primary)",
                }}
              >
                Hot Produk
              </p>
              <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                — harga tertinggi
              </span>
            </div>
            <div
              style={{
                display: "flex",
                gap: "10px",
                overflowX: "auto",
                paddingBottom: "4px",
              }}
            >
              {[...items]
                .sort((a, b) => b.price - a.price)
                .slice(0, 4)
                .map((item) => (
                  <div
                    key={item.id}
                    style={{
                      background: "var(--bg-tertiary)",
                      border: "1px solid var(--border)",
                      borderRadius: "var(--radius-md)",
                      padding: "12px 16px",
                      minWidth: "180px",
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
                    onClick={() => addToCart(item)}
                  >
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
                        fontSize: "13px",
                        fontWeight: 500,
                        color: "var(--text-primary)",
                        margin: "8px 0 4px",
                      }}
                    >
                      {item.name}
                    </p>
                    <p
                      style={{
                        fontSize: "12px",
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

      <div
        style={{
          padding: "16px 40px 28px 40px",
          display: "flex",
          flexDirection: "column",
          gap: "24px",
        }}
        className="catalog-layout"
      >
        <style>{`
  @media (min-width: 1024px) {
    .catalog-layout { flex-direction: row !important; }
    .cart-sidebar { width: 280px !important; flex-shrink: 0; }
  }
  @media (min-width: 640px) {
    .product-grid { grid-template-columns: repeat(2, 1fr) !important; }
  }
  @media (min-width: 1280px) {
    .product-grid { grid-template-columns: repeat(3, 1fr) !important; }
  }
    .banner-stats { display: flex !important; }
  @media (max-width: 640px) { .banner-stats { display: none !important; } }
`}</style>

        {/* Katalog */}
        <div id="katalog-section" style={{ flex: 1 }}>
          {/* Filter tabs */}
          <div style={{ display: "flex", gap: "6px", marginBottom: "20px" }}>
            {["all", "product", "service"].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                style={{
                  padding: "6px 14px",
                  borderRadius: "var(--radius-sm)",
                  fontSize: "13px",
                  border: "1px solid",
                  borderColor: filter === f ? "var(--accent)" : "var(--border)",
                  background:
                    filter === f ? "var(--accent-subtle)" : "transparent",
                  color:
                    filter === f ? "var(--accent)" : "var(--text-secondary)",
                  cursor: "pointer",
                  transition: "all 0.15s",
                  fontWeight: filter === f ? 500 : 400,
                }}
              >
                {f === "all" ? "Semua" : f === "product" ? "Produk" : "Layanan"}
              </button>
            ))}
          </div>

          {/* Grid */}
          <div
            className="product-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "1fr",
              gap: "12px",
            }}
          >
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
                    padding: "16px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                    transition: "border-color 0.15s",
                    cursor: "default",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.borderColor = "var(--border-light)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.borderColor = "var(--border)")
                  }
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: 500,
                        padding: "3px 8px",
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
                      }}
                    >
                      {item.type === "product" ? "Produk" : "Layanan"}
                    </span>
                  </div>
                  <div>
                    <p
                      style={{
                        fontWeight: 500,
                        fontSize: "14px",
                        color: "var(--text-primary)",
                        marginBottom: "4px",
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
                      marginTop: "4px",
                    }}
                  >
                    <span
                      style={{
                        fontWeight: 600,
                        fontSize: "14px",
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
                        padding: "6px 14px",
                        fontSize: "12px",
                        fontWeight: 600,
                        cursor: "pointer",
                        transition: "opacity 0.15s",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.opacity = "0.85")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.opacity = "1")
                      }
                    >
                      + Tambah
                    </button>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Cart */}
        <div className="cart-sidebar" style={{ width: "100%" }}>
          <div
            style={{
              background: "var(--bg-secondary)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-lg)",
              padding: "16px",
              position: "sticky",
              top: "68px",
            }}
          >
            <p
              style={{
                fontWeight: 600,
                fontSize: "14px",
                marginBottom: "16px",
                color: "var(--text-primary)",
              }}
            >
              Keranjang
            </p>

            {cart.length === 0 && (
              <p
                style={{
                  color: "var(--text-muted)",
                  fontSize: "13px",
                  textAlign: "center",
                  padding: "24px 0",
                }}
              >
                Belum ada item
              </p>
            )}

            <div
              style={{ display: "flex", flexDirection: "column", gap: "2px" }}
            >
              {cart.map((item) => (
                <div
                  key={item.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "10px 0",
                    borderBottom: "1px solid var(--border)",
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0, marginRight: "8px" }}>
                    <p
                      style={{
                        fontSize: "13px",
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

                  {/* Quantity control */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      flexShrink: 0,
                    }}
                  >
                    <button
                      onClick={() => {
                        if (item.qty === 1) {
                          removeFromCart(item.id);
                        } else {
                          setCart(
                            cart.map((c) =>
                              c.id === item.id ? { ...c, qty: c.qty - 1 } : c,
                            ),
                          );
                        }
                      }}
                      style={{
                        width: "26px",
                        height: "26px",
                        borderRadius: "var(--radius-sm)",
                        border: "1px solid var(--border)",
                        background:
                          item.qty === 1
                            ? "var(--red-subtle)"
                            : "var(--bg-tertiary)",
                        color:
                          item.qty === 1
                            ? "var(--red)"
                            : "var(--text-secondary)",
                        cursor: "pointer",
                        fontSize: "14px",
                        fontWeight: 600,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        transition: "all 0.15s",
                        lineHeight: 1,
                      }}
                    >
                      −
                    </button>

                    <span
                      style={{
                        fontSize: "13px",
                        fontWeight: 600,
                        color: "var(--text-primary)",
                        minWidth: "20px",
                        textAlign: "center",
                      }}
                    >
                      {item.qty}
                    </span>

                    <button
                      onClick={() =>
                        setCart(
                          cart.map((c) =>
                            c.id === item.id ? { ...c, qty: c.qty + 1 } : c,
                          ),
                        )
                      }
                      style={{
                        width: "26px",
                        height: "26px",
                        borderRadius: "var(--radius-sm)",
                        border: "1px solid rgba(74,222,128,0.25)",
                        background: "var(--accent-subtle)",
                        color: "var(--accent)",
                        cursor: "pointer",
                        fontSize: "14px",
                        fontWeight: 600,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        transition: "all 0.15s",
                        lineHeight: 1,
                      }}
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {cart.length > 0 && (
              <div style={{ marginTop: "16px" }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "14px",
                    fontWeight: 600,
                    color: "var(--text-primary)",
                    marginBottom: "14px",
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
                    padding: "10px",
                    fontSize: "13px",
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "opacity 0.15s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
                  onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
                >
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
