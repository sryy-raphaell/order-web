import { prisma } from '../../../lib/prisma'

export async function POST(request) {
  const body = await request.json()
  const device = await prisma.iotData.update({
    where: { deviceName: body.deviceName },
    data: { relay: body.relay }
  })
  return Response.json({ success: true, relay: device.relay })
}