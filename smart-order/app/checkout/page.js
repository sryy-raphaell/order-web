import { prisma } from "../../../lib/prisma";

function generateToken() {
  return "SRY-" + Math.random().toString(36).substring(2, 8).toUpperCase();
}

// Kirim pesan ke user via wa-bot HTTP API (port 3002)
async function notifyUser(phone, message) {
  try {
    const res = await fetch("http://localhost:3002/send-message", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, message }),
    });
    const result = await res.json();
    console.log("WA notify result:", result);
    return result.success === true;
  } catch (err) {
    // Bot mungkin belum connect — order tetap dibuat, token tampil di UI
    console.log("WA notify failed (bot offline?):", err.message);
    return false;
  }
}

export async function POST(request) {
  const { name, phone, items, total } = await request.json();

  const cleanPhone = phone.replace(/\D/g, "").replace(/^0/, "62");
  const token = generateToken();

  const user = await prisma.user.upsert({
    where: { phone: cleanPhone },
    update: {
      name,
      linkToken: token,
    },
    create: {
      phone: cleanPhone,
      name,
      linkToken: token,
    },
  });

  // Simpan order
  const order = await prisma.order.create({
    data: {
      userId: user.id,
      items,
      total,
      status: "pending",
    },
  });

  // Pesan WA yang dikirim ke user
  const waMessage = `Halo ${name}! 👋

Terima kasih sudah memesan di *SyRa Store* 

*Order #${order.id}* berhasil dibuat
Total: Rp ${total.toLocaleString("id-ID")}

*Token akun kamu:*
${token}

Balas pesan ini dengan perintah:
*!link ${token}*

untuk menghubungkan WhatsApp kamu agar bisa cek status order kapan saja.`;

  const waSent = await notifyUser(cleanPhone, waMessage);

  return Response.json({
    success: true,
    orderId: order.id,
    token: token,
    waSent, // true = bot berhasil kirim, false = bot offline (token tetap tampil di UI)
  });
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);

  const lid = searchParams.get("lid");
  const phone = searchParams.get("phone");

  let user = null;

  // Cari berdasarkan LID dulu
  if (lid) {
    user = await prisma.user.findUnique({
      where: { lid },
      include: {
        orders: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
    });
    console.log("GET orders by lid:", lid, "→", user ? "found" : "not found");
  }

  // Fallback ke phone
  if (!user && phone) {
    const cleanPhone = phone.replace(/\D/g, "").replace(/^0/, "62");
    user = await prisma.user.findUnique({
      where: { phone: cleanPhone },
      include: {
        orders: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
    });
    console.log(
      "GET orders by phone:",
      cleanPhone,
      "→",
      user ? "found" : "not found"
    );
  }

  if (!user) {
    return Response.json({ error: "User not found" }, { status: 404 });
  }

  return Response.json(user);
}