export default async function handler(req, res) {
  // 1. Headers de sécurité (CORS)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // 2. On dit OUI à la vérification du navigateur
  if (req.method === 'OPTIONS') return res.status(200).end();
  
  // 3. On bloque si ce n'est pas un POST
  if (req.method !== 'POST') return res.status(405).json({ error: 'Méthode non autorisée' });
  
  const { fileName } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/${fileName}?key=${apiKey}`);
    const data = await response.json();
    if (!response.ok) throw new Error(JSON.stringify(data));
    
    res.status(200).json({ state: data.state });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
