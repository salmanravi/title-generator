export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { productName } = req.body;
  if (!productName) {
    return res.status(400).json({ error: 'Nama produk wajib diisi' });
  }

  const apiKey = process.env.GEMINI_API_KEY || "AQ.Ab8RN6JeYcm_72CkRarms5rfXbXnTbKebdcpKnjxiwlqUJeCSA";

  const systemInstruction = "Kamu adalah pakar YouTube Strategist. Hasilkan ide judul video menarik dengan CTR tinggi berdasarkan nama produk. Berikan output dalam format JSON valid.";

  const prompt = `Buat 8 ide judul video YouTube untuk produk "${productName}". Buat 1 judul untuk masing-masing topik berikut: Edukasi, Tutorial, Solusi Masalah, Perbandingan, Review, Rekomendasi, Eksperimen, Gaya Hidup.

Format JSON yang wajib diikuti:
{
  "results": [
    {
      "topic": "Nama Topik",
      "title": "Judul Video",
      "ctr_score": "Estimasi 85-98%",
      "hook_type": "Jenis Hook",
      "reason": "Alasan judul ini menarik"
    }
  ]
}`;

  const payload = {
    contents: [{ parts: [{ text: prompt }] }],
    systemInstruction: { parts: [{ text: systemInstruction }] },
    generationConfig: {
      responseMimeType: "application/json"
    }
  };

  const maxRetries = 3;
  let delay = 2000; // Mulai dengan delay 2 detik jika gagal

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }
      );

      const data = await response.json();

      if (!response.ok) {
        const errorMessage = data.error?.message || '';
        // Cek jika error berhubungan dengan overload (503) atau rate limit (429)
        if (response.status === 503 || response.status === 429 || errorMessage.toLowerCase().includes('high demand')) {
            if (attempt < maxRetries) {
                // Tunggu sebentar sebelum mencoba lagi (Exponential backoff)
                await new Promise(resolve => setTimeout(resolve, delay));
                delay *= 2; // Gandakan waktu tunggu untuk percobaan berikutnya
                continue;
            }
        }
        throw new Error(errorMessage || 'Gagal memanggil Gemini API');
      }

      const textResponse = data.candidates[0].content.parts[0].text;
      const jsonOutput = JSON.parse(textResponse);

      return res.status(200).json(jsonOutput);
    } catch (error) {
      if (attempt === maxRetries) {
        return res.status(500).json({ error: error.message });
      }
    }
  }
}
