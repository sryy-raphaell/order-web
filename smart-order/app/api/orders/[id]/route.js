import { prisma } from "../../../../lib/prisma";

export async function PATCH(request, { params }) {
  try {
    const id = parseInt(params.id);

    const body = await request.json();

    const { status } = body;

    const order = await prisma.order.update({
      where: { id },
      data: { status },
    });

    return Response.json(order);
  } catch (err) {
    return Response.json(
      { error: "Failed update status" },
      { status: 500 }
    );
  }
}