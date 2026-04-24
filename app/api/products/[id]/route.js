import { prisma } from '../../../../lib/prisma'

export async function PUT(request, { params }) {
  const { id } = await params
  const body = await request.json()
  const item = await prisma.item.update({
    where: { id: parseInt(id) },
    data: {
      name: body.name,
      type: body.type,
      price: body.price,
      description: body.description,
    }
  })
  return Response.json(item)
}

export async function DELETE(request, { params }) {
  const { id } = await params
  await prisma.item.delete({
    where: { id: parseInt(id) }
  })
  return Response.json({ success: true })
}