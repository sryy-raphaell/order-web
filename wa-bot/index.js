const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  jidNormalizedUser,
} = require("@whiskeysockets/baileys");

const qrcode = require("qrcode-terminal");
const http = require("http");

const API_URL = "http://localhost:3000";
const BOT_PORT = 3002;
  
let sockGlobal = null;

// ─── API helpers ─────────────────────────────────────────────────────────────

async function getOrderStatus(lid) {
  try {
    const res = await fetch(`${API_URL}/api/orders?lid=${encodeURIComponent(lid)}`);
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.log("getOrderStatus error:", err.message);
    return null;
  }
}

async function getOrdersByPhone(phone) {
  try {
    const res = await fetch(`${API_URL}/api/orders?phone=${encodeURIComponent(phone)}`);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

async function linkToken(token, lid) {
  try {
    const res = await fetch(`${API_URL}/api/link-token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, lid }),
    });
    return await res.json();
  } catch (err) {
    console.log("linkToken error:", err.message);
    return null;
  }
}

async function linkLid(phone, lid) {
  try {
    const res = await fetch(`${API_URL}/api/link-lid`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, lid }),
    });
    return await res.json();
  } catch (err) {
    console.log("linkLid error:", err.message);
    return null;
  }
}

async function getOrder(orderId) {
  try {
    const res = await fetch(`${API_URL}/api/orders/${orderId}`);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

async function submitOffer(orderId, amount, message) {
  try {
    const res = await fetch(`${API_URL}/api/orders/${orderId}/offer`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ from: "user", amount, message }),
    });
    return await res.json();
  } catch (err) {
    console.log("submitOffer error:", err.message);
    return null;
  }
}

async function acceptLatestAdminOffer(orderId) {
  try {
    const order = await getOrder(orderId);
    if (!order) return null;
    const offers = Array.isArray(order.priceOffers) ? order.priceOffers : [];
    const adminOffer = [...offers].reverse().find(
      (o) => o.from === "admin" && o.status === "pending"
    );
    if (!adminOffer) return { error: "Tidak ada penawaran admin yang bisa diterima" };
    const res = await fetch(`${API_URL}/api/orders/${orderId}/offer`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ offerId: adminOffer.id, action: "accept" }),
    });
    return await res.json();
  } catch (err) {
    console.log("acceptOffer error:", err.message);
    return null;
  }
}

// ─── HTTP server ──────────────────────────────────────────────────────────────

function startHttpServer() {
  const server = http.createServer(async (req, res) => {
    if (req.method === "GET" && req.url === "/health") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ status: "ok", connected: !!sockGlobal }));
      return;
    }

    if (req.method === "POST" && req.url === "/send-message") {
      let body = "";
      req.on("data", (chunk) => (body += chunk));
      req.on("end", async () => {
        try {
          const { phone, message } = JSON.parse(body);
          if (!phone || !message) {
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "phone and message required" }));
            return;
          }
          if (!sockGlobal) {
            res.writeHead(503, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "Bot not connected yet" }));
            return;
          }
          const cleanPhone = phone.replace(/\D/g, "").replace(/^0/, "62");
          const jid = `${cleanPhone}@s.whatsapp.net`;
          await sockGlobal.sendMessage(jid, { text: message });
          console.log(`Pesan terkirim ke ${cleanPhone}`);
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ success: true }));
        } catch (err) {
          console.log("send-message error:", err.message);
          res.writeHead(500, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: err.message }));
        }
      });
      return;
    }

    res.writeHead(404);
    res.end();
  });

  server.listen(BOT_PORT, () => {
    console.log(`Bot HTTP API aktif di port ${BOT_PORT}`);
  });
}

// ─── Bot ──────────────────────────────────────────────────────────────────────

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState("auth_info");
  const sock = makeWASocket({ auth: state, printQRInTerminal: true });
  sockGlobal = sock;
  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", ({ connection, lastDisconnect, qr }) => {
    if (qr) qrcode.generate(qr, { small: true });
    if (connection === "close") {
      sockGlobal = null;
      const shouldReconnect =
        lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
      if (shouldReconnect) startBot();
    }
    if (connection === "open") { console.log("Bot WA aktif!"); sockGlobal = sock; }
  });

  sock.ev.on("messages.upsert", async ({ messages }) => {
    try {
      const msg = messages[0];
      if (!msg.message || msg.key.fromMe) return;

      const from = msg.key.remoteJid || "";
      const jid = msg.key.participant || msg.key.remoteJid || "";
      const normalized = jidNormalizedUser(jid);
      const lid = normalized.split("@")[0].split(":")[0];
      const phoneFromJid = (msg.key.remoteJid || "").split("@")[0].replace(/\D/g, "");

      console.log("LID:", lid, "| PHONE:", phoneFromJid);

      const text = (
        msg.message.conversation ||
        msg.message.extendedTextMessage?.text ||
        ""
      ).trim().replace(/\s+/g, " ");
      const textLower = text.toLowerCase();

      let reply = "";

      async function resolveUser() {
        let data = await getOrderStatus(lid);
        if (!data || data.error) data = await getOrdersByPhone(phoneFromJid);
        return data;
      }

      if (["halo", "hi", "hello", "mulai"].includes(textLower)) {
        reply = `Halo! Selamat datang di *SyRa Store* 

Perintah yang tersedia:
- *!status* - order terakhir
- *!histori* - semua riwayat order
- *!produk* - lihat katalog
- *!tawar [id] [harga] [pesan]* - tawar harga
- *!terima [id]* - terima penawaran admin

Belum terhubung? Ketik *!link TOKEN* atau *!verify NOMORHP*`;
      }

      else if (textLower.startsWith("!link ")) {
        const token = text.replace(/!link /i, "").trim().toUpperCase();
        const result = await linkToken(token, lid);
        if (result?.success) {
          reply = `Berhasil terhubung, ${result.name}!\n\n- *!status* - cek order terakhir\n- *!histori* - riwayat order`;
        } else {
          reply = `Token tidak valid atau sudah digunakan.\n\nToken ada di halaman konfirmasi saat order. Ketik *!verify NOMORHP* jika tidak punya token.`;
        }
      }

      else if (textLower.startsWith("!verify ")) {
        const inputPhone = text.replace(/!verify /i, "").trim();
        const result = await linkLid(inputPhone, lid);
        if (result?.success) {
          reply = `Nomor *${inputPhone}* berhasil diverifikasi!\n\n- *!status* - cek order\n- *!histori* - riwayat`;
        } else {
          reply = `Nomor *${inputPhone}* tidak ditemukan.\nFormat: *!verify 08123456789*`;
        }
      }

      else if (textLower === "!status" || textLower === "status") {
        const data = await resolveUser();
        if (!data || data.error || !data.orders?.length) {
          reply = `Belum ada order atau akun belum terhubung.\nKetik *!link TOKEN* atau *!verify NOMORHP*.`;
        } else {
          const last = data.orders[0];
          const items = last.items.map((i) => `- ${i.name} x${i.qty}`).join("\n");
          const finalPrice = last.negotiatedPrice ?? last.total;
          const hasService = last.items.some((i) => i.type === "service");
          const statusMap = {
            pending: "Menunggu konfirmasi",
            negosiasi: "Sedang negosiasi harga",
            pembayaran: "Menunggu pembayaran",
            pembuatan: "Sedang dibuat",
            pengiriman: "Dalam pengiriman",
            selesai: "Selesai",
            dibatalkan: "Dibatalkan",
          };

          reply = `*Order Terakhir - ${data.name}*\n\n${items}\n\nTotal: Rp ${finalPrice.toLocaleString("id-ID")}`;
          if (last.negotiatedPrice && last.negotiatedPrice !== last.total) {
            reply += ` (dinegosiasi dari Rp ${last.total.toLocaleString("id-ID")})`;
          }
          reply += `\nStatus: *${statusMap[last.status] || last.status}*`;
          reply += `\nTanggal: ${new Date(last.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}`;

          if (last.status === "pembayaran" && hasService) {
            reply += `\n\n*DP yang harus dibayar: Rp ${Math.ceil(finalPrice / 2).toLocaleString("id-ID")}* (50%)`;
          }

          const offers = Array.isArray(last.priceOffers) ? last.priceOffers : [];
          const pendingAdminOffer = [...offers].reverse().find(
            (o) => o.from === "admin" && o.status === "pending"
          );
          if (pendingAdminOffer) {
            reply += `\n\n*Ada penawaran dari admin:*\nRp ${pendingAdminOffer.amount.toLocaleString("id-ID")}`;
            if (pendingAdminOffer.message) reply += `\n"${pendingAdminOffer.message}"`;
            reply += `\n\nBalas *!terima ${last.id}* untuk menerima\natau *!tawar ${last.id} [harga]* untuk counter.`;
          }
        }
      }

      else if (textLower === "!histori" || textLower === "histori") {
        const data = await resolveUser();
        if (!data || data.error || !data.orders?.length) {
          reply = "Belum ada riwayat order.\nKetik *!link TOKEN* atau *!verify NOMORHP*.";
        } else {
          const statusEmoji = { pending: "⏳", negosiasi: "🤝", pembayaran: "💳", pembuatan: "🔧", pengiriman: "🚚", selesai: "✅", dibatalkan: "❌" };
          const list = data.orders.map((o, i) => {
            const price = (o.negotiatedPrice ?? o.total).toLocaleString("id-ID");
            return `${i + 1}. #${o.id} | ${new Date(o.createdAt).toLocaleDateString("id-ID")} | Rp ${price} ${statusEmoji[o.status] || ""} ${o.status}`;
          }).join("\n");
          reply = `*Riwayat Order - ${data.name}*\n\n${list}`;
        }
      }

      else if (textLower.startsWith("!tawar ")) {
        const parts = text.replace(/!tawar /i, "").trim().split(" ");
        const orderId = parseInt(parts[0]);
        const amount = parseInt(parts[1]?.replace(/\./g, "").replace(/,/g, ""));
        const message = parts.slice(2).join(" ");

        if (isNaN(orderId) || isNaN(amount) || amount <= 0) {
          reply = `Format tidak valid.\nContoh: *!tawar 5 150000 bisa kurang gak?*`;
        } else {
          const userData = await resolveUser();
          if (!userData || !userData.orders?.length) {
            reply = "Akun belum terhubung. Ketik *!link TOKEN* atau *!verify NOMORHP*.";
          } else {
            const ownOrder = userData.orders.find((o) => o.id === orderId);
            if (!ownOrder) {
              reply = `Order #${orderId} tidak ditemukan.\nKetik *!histori* untuk lihat daftar order kamu.`;
            } else if (!["pending", "negosiasi"].includes(ownOrder.status)) {
              reply = `Order #${orderId} tidak bisa dinegosiasi lagi (status: ${ownOrder.status}).`;
            } else {
              const result = await submitOffer(orderId, amount, message);
              if (result && !result.error) {
                reply = `Penawaran terkirim!\n\nOrder #${orderId}\nHarga tawar: *Rp ${amount.toLocaleString("id-ID")}*${message ? `\nPesan: "${message}"` : ""}\n\nAdmin akan merespons segera.`;
              } else {
                reply = `Gagal mengirim penawaran: ${result?.error || "coba lagi"}.`;
              }
            }
          }
        }
      }

      else if (textLower.startsWith("!terima ")) {
        const orderId = parseInt(text.replace(/!terima /i, "").trim());
        if (isNaN(orderId)) {
          reply = `Format tidak valid.\nContoh: *!terima 5*`;
        } else {
          const userData = await resolveUser();
          if (!userData || !userData.orders?.length) {
            reply = "Akun belum terhubung. Ketik *!link TOKEN*.";
          } else {
            const ownOrder = userData.orders.find((o) => o.id === orderId);
            if (!ownOrder) {
              reply = `Order #${orderId} tidak ditemukan di akunmu.`;
            } else {
              const result = await acceptLatestAdminOffer(orderId);
              if (result && !result.error) {
                const accepted = Array.isArray(result.priceOffers)
                  ? [...result.priceOffers].reverse().find((o) => o.status === "accepted" && o.from === "admin")
                  : null;
                const price = accepted?.amount ?? result.negotiatedPrice ?? ownOrder.total;
                reply = `Penawaran diterima!\n\nOrder #${orderId}\nHarga disepakati: *Rp ${price.toLocaleString("id-ID")}*\n\nAdmin akan segera memproses ke tahap berikutnya.`;
              } else {
                reply = result?.error
                  ? `${result.error}`
                  : `Tidak ada penawaran admin yang bisa diterima pada order #${orderId}.`;
              }
            }
          }
        }
      }

      else if (textLower === "!produk" || textLower === "produk") {
        reply = `Lihat katalog lengkap:\nhttps://order-web-dun.vercel.app`;
      }

      else {
        reply = `Perintah yang tersedia:\n\n- *!status*\n- *!histori*\n- *!produk*\n- *!tawar [id] [harga]*\n- *!terima [id]*\n- *!link TOKEN*\n- *!verify NOMORHP*`;
      }

      if (reply) await sock.sendMessage(from, { text: reply });
    } catch (err) {
      console.log("MESSAGE ERROR:", err);
    }
  });
}

startHttpServer();
startBot();