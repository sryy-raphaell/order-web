import { prisma } from '../../../lib/prisma'

export async function POST(request) {
  const { messages } = await request.json()

  // Ambil semua produk untuk context
  const products = await prisma.item.findMany()

  const productList = products.map(p =>
    `- ${p.name} (${p.type === 'product' ? 'Produk' : 'Layanan'}): ${p.description}, Harga: Rp ${p.price.toLocaleString('id-ID')}`
  ).join('\n')

  const systemPrompt = `Kamu adalah asisten toko IoT bernama "SyRa" yang membantu pelanggan memilih produk dan layanan IoT yang sesuai kebutuhan mereka.

Daftar produk dan layanan yang tersedia di toko:
${productList}

Panduan:
- Jawab dalam Bahasa Indonesia yang ramah dan profesional
- Rekomendasikan produk yang relevan dari daftar di atas berdasarkan kebutuhan user
- Berikan penjelasan teknis IoT yang mudah dipahami
- Jika ditanya harga, sebutkan harga yang ada di daftar
- Jangan merekomendasikan produk yang tidak ada di daftar
- Jawaban singkat dan to the point, maksimal 3-4 kalimat
- Jika user ingin membeli, arahkan mereka untuk menambahkan ke keranjang`

  try {
    const response = await fetch('http://localhost:11434/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llama3.1:8b-instruct-q4_K_M',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages
        ],
        stream: false,
      })
    })

    if (!response.ok) throw new Error('Ollama tidak merespons')

    const data = await response.json()
    return Response.json({ 
      message: data.message.content 
    })

  } catch (error) {
    return Response.json({ 
      message: 'Maaf, asisten sedang tidak tersedia. Silakan coba lagi.' 
    }, { status: 500 })
  }
}