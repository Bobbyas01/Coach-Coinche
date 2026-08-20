export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Méthode non autorisée' });
  
  const { fileName } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/${fileName}?key=${apiKey}`);
    const data = await response.json();
    
    if (!response.ok) throw new Error(JSON.stringify(data));
    
    // Renvoie "PROCESSING" ou "ACTIVE"
    res.status(200).json({ state: data.state });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
