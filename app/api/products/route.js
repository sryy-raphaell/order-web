import { prisma } from '../../../lib/prisma'

export async function GET() {
  const items = await prisma.item.findMany()
  return Response.json(items)
}

export async function POST(request) {
  const body = await request.json()
  const item = await prisma.item.create({
    data: {
      name: body.name,
      type: body.type,
      price: body.price,
      description: body.description,
    }
  })
  return Response.json(item)
}