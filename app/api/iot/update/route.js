import { prisma } from '../../../../lib/prisma'

export async function POST(request) {
  const body = await request.json()
  const device = await prisma.iotData.upsert({
    where: { deviceName: body.deviceName },
    update: {
      temperature: body.temperature,
      humidity: body.humidity,
      status: 'online',
      updatedAt: new Date()
    },
    create: {
      deviceName: body.deviceName,
      temperature: body.temperature,
      humidity: body.humidity,
      status: 'online',
      relay: false
    }
  })
  return Response.json({ success: true, relay: device.relay })
}