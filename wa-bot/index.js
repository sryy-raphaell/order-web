const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  jidNormalizedUser,
} = require("@whiskeysockets/baileys");

const qrcode = require("qrcode-terminal");

// URL API Next.js
const API_URL = "http://localhost:3001";

// =========================
// Ambil data order user
// =========================
async function getOrderStatus(lid) {
  try {
    const res = await fetch(`${API_URL}/api/orders?lid=${lid}`);

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

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        token,
        lid,
      }),
    });

    return await res.json();
  } catch {
    return null;
  }
}

async function linkLid(phone, lid) {
  try {
    const res = await fetch(`${API_URL}/api/link-lid`, {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        phone,
        lid,
      }),
    });

    return await res.json();
  } catch {
    return null;
  }
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
      const shouldReconnect =
        lastDisconnect?.error?.output?.statusCode !==
        DisconnectReason.loggedOut;

      console.log("WA Closed. Reconnect:", shouldReconnect);

      if (shouldReconnect) {
        startBot();
      }
    }

    if (connection === "open") {
      console.log("✅ Bot WA aktif!");
    }
  });

  // =========================
  // Message handler
  // =========================
  sock.ev.on("messages.upsert", async ({ messages }) => {
    try {
      const msg = messages[0];

      if (!msg.message || msg.key.fromMe) {
        return;
      }

      // =========================
      // JID
      // =========================
      const from = msg.key.remoteJid || "";

      const jid = msg.key.participant || msg.key.remoteJid || "";

      console.log("RAW JID:", jid);

      // Normalize JID
      const normalized = jidNormalizedUser(jid);

      console.log("NORMALIZED:", normalized);

      // Extract LID
      const lid = normalized.split("@")[0].split(":")[0];

      console.log("LID:", lid);

      // Extract phone (fallback/debug only)
      const phone = normalized.split("@")[0].split(":")[0].replace(/\D/g, "");

      console.log("PHONE:", phone);

      // =========================
      // Text
      // =========================
      const text = (
        msg.message.conversation ||
        msg.message.extendedTextMessage?.text ||
        ""
      )
        .toLowerCase()
        .trim()
        .replace(/\s+/g, " ");

      console.log("TEXT:", text);

      let reply = "";

      // =========================
      // Menu
      // =========================
      if (["halo", "hi", "hello", "mulai"].includes(text)) {
        reply = `Halo! 👋 Selamat datang di *SyRa Store*

Saya bisa membantu kamu dengan:
- Ketik *!status* — cek order terakhir
- Ketik *!histori* — semua riwayat order
- Ketik *!produk* — lihat katalog

Ada yang bisa dibantu?`;
      }

      // =========================
      // VERIFY
      // =========================
      else if (text.startsWith("!link ")) {
        const token = text.replace("!link ", "").trim().toUpperCase();

        const result = await linkToken(token, lid);

        if (result?.success) {
          reply = `✅ WhatsApp berhasil terhubung!

Halo ${result.name} 👋

Sekarang kamu bisa memakai:
- !status
- !histori`;
        } else {
          reply = "❌ Token tidak valid atau sudah digunakan.";
        }
      } else if (text.startsWith("!verify ")) {
        const inputPhone = text.replace("!verify ", "").trim();

        const result = await linkLid(inputPhone, lid);

        if (result?.success) {
          reply = `✅ Nomor berhasil diverifikasi!

Sekarang kamu bisa memakai:
- !status
- !histori`;
        } else {
          reply = "❌ Nomor tidak ditemukan di database order.";
        }
      }

      // =========================
      // STATUS
      // =========================
      else if (text === "!status" || text === "status") {
        const data = await getOrderStatus(lid);

        console.log("STATUS RESULT:", JSON.stringify(data, null, 2));

        if (!data || !data.orders?.length) {
          reply =
            "Kamu belum memiliki order. Kunjungi toko kami untuk memesan! 🛒";
        } else {
          const last = data.orders[0];

          const items = last.items
            .map((i) => `• ${i.name} x${i.qty}`)
            .join("\n");

          reply = `📦 *Order Terakhir*

${items}

💰 Total: Rp ${last.total.toLocaleString("id-ID")}

📋 Status:
${last.status === "pending" ? "⏳ Pending konfirmasi" : "✅ " + last.status}

🕐 ${new Date(last.createdAt).toLocaleDateString("id-ID")}`;
        }
      }

      // =========================
      // HISTORI
      // =========================
      else if (text === "!histori" || text === "histori") {
        const data = await getOrderStatus(lid);

        console.log("HISTORY RESULT:", JSON.stringify(data, null, 2));

        if (!data || !data.orders?.length) {
          reply = "Belum ada riwayat order.";
        } else {
          const list = data.orders
            .map((o, i) => {
              return `${i + 1}. ${new Date(o.createdAt).toLocaleDateString(
                "id-ID",
              )} — Rp ${o.total.toLocaleString("id-ID")} (${o.status})`;
            })
            .join("\n");

          reply = `📋 *Riwayat Order ${data.name}*

${list}`;
        }
      }

      // =========================
      // PRODUK
      // =========================
      else if (text === "!produk" || text === "produk") {
        reply = `Lihat katalog lengkap kami di:
https://order-web-dun.vercel.app`;
      }

      // =========================
      // Unknown command
      // =========================
      else {
        reply = `Ketik salah satu perintah berikut:

- *!status* — order terakhir
- *!histori* — riwayat order
- *!produk* — lihat katalog`;
      }

      // =========================
      // Send reply
      // =========================
      await sock.sendMessage(from, {
        text: reply,
      });
    } catch (err) {
      console.log("MESSAGE ERROR:", err);
    }
  });
}

startBot();
