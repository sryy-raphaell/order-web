const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  jidNormalizedUser,
} = require("@whiskeysockets/baileys");

const qrcode = require("qrcode-terminal");
const http = require("http");

// URL API Next.js
const API_URL = "http://localhost:3001";
const BOT_PORT = 3002;

// Simpan referensi socket global supaya HTTP server bisa akses
let sockGlobal = null;

// =========================
// Ambil data order user
// =========================
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

// =========================
// HTTP server internal
// Dipakai oleh Next.js untuk suruh bot kirim pesan
// =========================
function startHttpServer() {
  const server = http.createServer(async (req, res) => {
    // Health check
    if (req.method === "GET" && req.url === "/health") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ status: "ok", connected: !!sockGlobal }));
      return;
    }

    // Send message endpoint
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

          // Normalisasi phone → JID
          const cleanPhone = phone.replace(/\D/g, "").replace(/^0/, "62");
          const jid = `${cleanPhone}@s.whatsapp.net`;

          await sockGlobal.sendMessage(jid, { text: message });

          console.log(`📤 Pesan terkirim ke ${cleanPhone}`);
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
    console.log(`🌐 Bot HTTP API aktif di port ${BOT_PORT}`);
  });
}

// =========================
// Start Bot
// =========================
async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState("auth_info");

  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: true,
  });

  // Simpan referensi global
  sockGlobal = sock;

  // =========================
  // Save session
  // =========================
  sock.ev.on("creds.update", saveCreds);

  // =========================
  // Connection update
  // =========================
  sock.ev.on("connection.update", ({ connection, lastDisconnect, qr }) => {
    if (qr) {
      qrcode.generate(qr, { small: true });
    }

    if (connection === "close") {
      sockGlobal = null;
      const shouldReconnect =
        lastDisconnect?.error?.output?.statusCode !==
        DisconnectReason.loggedOut;

      console.log("WA Closed. Reconnect:", shouldReconnect);

      if (shouldReconnect) {
        startBot();
      }
    }

    if (connection === "open") {
      console.log("Bot WA aktif!");
      sockGlobal = sock;
    }
  });

  // =========================
  // Message handler
  // =========================
  sock.ev.on("messages.upsert", async ({ messages }) => {
    try {
      const msg = messages[0];

      if (!msg.message || msg.key.fromMe) return;

      // =========================
      // JID & identitas
      // =========================
      const from = msg.key.remoteJid || "";
      const jid = msg.key.participant || msg.key.remoteJid || "";

      console.log("RAW JID:", jid);

      const normalized = jidNormalizedUser(jid);
      console.log("NORMALIZED:", normalized);

      // LID
      const lid = normalized.split("@")[0].split(":")[0];
      console.log("LID:", lid);

      // Phone dari remoteJid (lebih reliable untuk nomor asli)
      const remoteJid = msg.key.remoteJid || "";
      const phoneFromJid = remoteJid.split("@")[0].replace(/\D/g, "");
      console.log("PHONE FROM JID:", phoneFromJid);

      // =========================
      // Text
      // =========================
      const text = (
        msg.message.conversation ||
        msg.message.extendedTextMessage?.text ||
        ""
      )
        .trim()
        .replace(/\s+/g, " ");

      const textLower = text.toLowerCase();
      console.log("TEXT:", text);

      let reply = "";

      // =========================
      // Menu
      // =========================
      if (["halo", "hi", "hello", "mulai"].includes(textLower)) {
        reply = `Halo! 👋 Selamat datang di *SyRa Store*

Saya bisa membantu kamu dengan:
• Ketik *!status* — cek order terakhir
• Ketik *!histori* — semua riwayat order
• Ketik *!produk* — lihat katalog

Belum terhubung? Ketik *!link TOKEN* setelah order, atau *!verify NOMORHP* untuk verifikasi manual.`;
      }

      // =========================
      // LINK via token (dikirim otomatis saat order)
      // =========================
      else if (textLower.startsWith("!link ")) {
        const token = text.replace(/!link /i, "").trim().toUpperCase();
        console.log("LINK TOKEN:", token, "LID:", lid);

        const result = await linkToken(token, lid);

        if (result?.success) {
          reply = `WhatsApp berhasil terhubung, ${result.name}! 🎉

Sekarang kamu bisa menggunakan:
• *!status* — cek order terakhir
• *!histori* — riwayat semua order`;
        } else {
          reply = `Token tidak valid atau sudah digunakan.

Pastikan token yang kamu masukkan benar. Token tampil di halaman konfirmasi setelah order.

Ketik *!verify NOMORHP* jika kamu tidak punya token.`;
        }
      }

      // =========================
      // VERIFY via phone (fallback manual)
      // =========================
      else if (textLower.startsWith("!verify ")) {
        const inputPhone = text.replace(/!verify /i, "").trim();
        console.log("VERIFY PHONE:", inputPhone, "LID:", lid);

        const result = await linkLid(inputPhone, lid);
        console.log("VERIFY RESULT:", JSON.stringify(result));

        if (result?.success) {
          reply = `✅ Nomor *${inputPhone}* berhasil diverifikasi!

Sekarang kamu bisa menggunakan:
• *!status* — cek order terakhir
• *!histori* — riwayat semua order`;
        } else {
          reply = `❌ Nomor *${inputPhone}* tidak ditemukan di database order.

Pastikan format nomor benar:
• Contoh: *!verify 08123456789*
• Atau: *!verify 628123456789*

Hubungi admin jika masalah berlanjut.`;
        }
      }

      // =========================
      // STATUS
      // =========================
      else if (textLower === "!status" || textLower === "status") {
        let data = await getOrderStatus(lid);
        console.log("STATUS by LID result:", JSON.stringify(data));

        // Fallback: coba cari by phone jika LID tidak ketemu
        if ((!data || data.error) && phoneFromJid) {
          console.log("Fallback to phone:", phoneFromJid);
          try {
            const res = await fetch(
              `${API_URL}/api/orders?phone=${phoneFromJid}`
            );
            if (res.ok) data = await res.json();
          } catch {}
          console.log("STATUS by phone result:", JSON.stringify(data));
        }

        if (!data || data.error || !data.orders?.length) {
          reply = `Kamu belum memiliki order atau akun belum terhubung. 🛒

Untuk menghubungkan akun, ketik:
*!link TOKEN* (token ada di halaman konfirmasi order)
atau
*!verify NOMORHP*`;
        } else {
          const last = data.orders[0];
          const items = last.items.map((i) => `• ${i.name} x${i.qty}`).join("\n");

          const statusMap = {
            pending: "⏳ Pending konfirmasi",
            pembayaran: "💳 Menunggu pembayaran",
            pembuatan: "🔧 Sedang dibuat",
            pengiriman: "🚚 Dalam pengiriman",
            selesai: "✅ Selesai",
          };
          const statusText = statusMap[last.status] || `📋 ${last.status}`;

          reply = `📦 *Order Terakhir — ${data.name}*

${items}

💰 Total: Rp ${last.total.toLocaleString("id-ID")}
${statusText}
🕐 ${new Date(last.createdAt).toLocaleDateString("id-ID", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}`;
        }
      }

      // =========================
      // HISTORI
      // =========================
      else if (textLower === "!histori" || textLower === "histori") {
        let data = await getOrderStatus(lid);

        // Fallback phone
        if ((!data || data.error) && phoneFromJid) {
          try {
            const res = await fetch(
              `${API_URL}/api/orders?phone=${phoneFromJid}`
            );
            if (res.ok) data = await res.json();
          } catch {}
        }

        console.log("HISTORY RESULT:", JSON.stringify(data));

        if (!data || data.error || !data.orders?.length) {
          reply = "Belum ada riwayat order, atau akun belum terhubung.\n\nKetik *!link TOKEN* atau *!verify NOMORHP* untuk menghubungkan akun.";
        } else {
          const statusEmoji = {
            pending: "⏳",
            pembayaran: "💳",
            pembuatan: "🔧",
            pengiriman: "🚚",
            selesai: "✅",
          };

          const list = data.orders
            .map((o, i) => {
              const emoji = statusEmoji[o.status] || "📋";
              return `${i + 1}. ${new Date(o.createdAt).toLocaleDateString("id-ID")} — Rp ${o.total.toLocaleString("id-ID")} ${emoji} ${o.status}`;
            })
            .join("\n");

          reply = `📋 *Riwayat Order — ${data.name}*\n\n${list}`;
        }
      }

      // =========================
      // PRODUK
      // =========================
      else if (textLower === "!produk" || textLower === "produk") {
        reply = `Lihat katalog lengkap kami di:\nhttps://order-web-dun.vercel.app`;
      }

      // =========================
      // Unknown command
      // =========================
      else {
        reply = `Ketik salah satu perintah berikut:

• *!status* — order terakhir
• *!histori* — riwayat order
• *!produk* — lihat katalog
• *!link TOKEN* — hubungkan akun via token
• *!verify NOMORHP* — verifikasi manual`;
      }

      // =========================
      // Send reply
      // =========================
      if (reply) {
        await sock.sendMessage(from, { text: reply });
      }
    } catch (err) {
      console.log("MESSAGE ERROR:", err);
    }
  });
}

// Jalankan HTTP server & bot
startHttpServer();
startBot();