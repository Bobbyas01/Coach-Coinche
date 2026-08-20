export default async function handler(req, res) {
    // 1. Headers de sécurité (CORS)
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    // 2. On dit OUI à la vérification du navigateur
    if (req.method === 'OPTIONS') return res.status(200).end();

    // 3. On bloque si ce n'est pas un POST
    if (req.method !== 'POST') return res.status(405).json({ error: 'Méthode non autorisée' });

    const { fileUri } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!fileUri) return res.status(400).json({ error: "L'URI du fichier est requise." });

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ 
                    parts: [
                        { fileData: { mimeType: "video/mp4", fileUri: fileUri } }, 
                        { text: "Arbitre de Coinche : Analyse le pli. Joueur en BAS. Réponse JSON : { 'analyse': '', 'erreurs': [] }" }
                    ] 
                }]
            })
        });
        
        const data = await response.json();
        res.status(200).json(data);
    } catch (error) { 
        res.status(500).json({ error: error.message }); 
    }
}
