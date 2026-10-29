export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { productName } = req.body;
  if (!productName) {
    return res.status(400).json({ error: 'Nama produk wajib diisi' });
  }

  // Menggunakan API Key yang diberikan
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

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          systemInstruction: { parts: [{ text: systemInstruction }] },
          generationConfig: {
            responseMimeType: "application/json"
          }
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || 'Gagal memanggil Gemini API');
    }

    const textResponse = data.candidates[0].content.parts[0].text;
    const jsonOutput = JSON.parse(textResponse);

    return res.status(200).json(jsonOutput);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
