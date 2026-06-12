import { prisma } from "../../../../lib/prisma";

// POST /api/iot/update
// Dipanggil oleh ESP32 setiap interval
// Body: { authToken, deviceName, temperature?, humidity?, pins?: { V0: val, ... }, relays?: { "0": bool, ... } }
export async function POST(request) {
  try {
    const body = await request.json();
    const { authToken, deviceName, temperature, humidity, pins, relays } = body;

    if (!deviceName) {
      return Response.json({ error: "deviceName required" }, { status: 400 });
    }

    // Resolve project via authToken (opsional)
    let projectId = null;
    if (authToken) {
      const project = await prisma.project.findUnique({
        where: { authToken },
      });
      if (!project) {
        return Response.json({ error: "Invalid authToken" }, { status: 401 });
      }
      projectId = project.id;
    }

    // Build update data
    const updateData = {
      status: "online",
      updatedAt: new Date(),
    };
    if (temperature !== undefined) updateData.temperature = temperature;
    if (humidity !== undefined) updateData.humidity = humidity;
    if (projectId !== null) updateData.projectId = projectId;

    // Merge virtual pins (tidak overwrite semua, hanya update yang dikirim)
    if (pins && typeof pins === "object") {
      const existing = await prisma.iotData.findUnique({ where: { deviceName } });
      const currentPins = existing?.pins ?? {};
      updateData.pins = { ...currentPins, ...pins };
    }

    // Merge relays
    if (relays && typeof relays === "object") {
      const existing = await prisma.iotData.findUnique({ where: { deviceName } });
      const currentRelays = existing?.relays ?? {};
      updateData.relays = { ...currentRelays, ...relays };
      // Backward compat: relay field = channel 0
      if (relays["0"] !== undefined) updateData.relay = relays["0"];
    }

    const device = await prisma.iotData.upsert({
      where: { deviceName },
      update: updateData,
      create: {
        deviceName,
        projectId,
        temperature: temperature ?? 0,
        humidity: humidity ?? 0,
        status: "online",
        pins: pins ?? {},
        relays: relays ?? {},
        relay: false,
      },
    });

    // Return relay state ke ESP32 (semua channel)
    return Response.json({
      success: true,
      relay: device.relay,
      relays: device.relays,
    });
  } catch (err) {
    console.error("IoT update error:", err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}