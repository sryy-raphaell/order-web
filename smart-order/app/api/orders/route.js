import { prisma } from "../../../lib/prisma";

function generateToken() {
  return "SRY-" + Math.random().toString(36).substring(2, 8).toUpperCase();
}

export async function POST(request) {
  const { name, phone, items, total, lid } = await request.json();

  const cleanPhone = phone.replace(/\D/g, "").replace(/^0/, "62");

  const user = await prisma.user.upsert({
    where: {
      phone: cleanPhone,
    },

    update: {
      name,
      linkToken: generateToken(),
    },

    create: {
      phone: cleanPhone,
      name,
      linkToken: generateToken(),
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

  return Response.json({
    success: true,
    orderId: order.id,
    token: user.linkToken,
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
          orderBy: {
            createdAt: "desc",
          },
          take: 10,
        },
      },
    });
  }

  // Fallback ke phone
  if (!user && phone) {
    const cleanPhone = phone.replace(/\D/g, "").replace(/^0/, "62");

    user = await prisma.user.findUnique({
      where: { phone: cleanPhone },
      include: {
        orders: {
          orderBy: {
            createdAt: "desc",
          },
          take: 10,
        },
      },
    });
  }

  if (!user) {
    return Response.json({ error: "User not found" }, { status: 404 });
  }

  return Response.json(user);
}
