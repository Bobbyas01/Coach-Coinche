export default async function handler(req, res) {
    // 1. En-têtes CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Méthode non autorisée' });

    const { fileUri } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!fileUri) return res.status(400).json({ error: "L'URI du fichier est requise." });
    if (!apiKey) return res.status(500).json({ error: "Clé API Gemini introuvable." });

    try {
        // Utilisation du modèle Gemini Flash (v1beta)
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ 
                    parts: [
                        { fileData: { mimeType: "video/mp4", fileUri: fileUri } }, 
                        { text: "Tu es un arbitre et coach expert de Coinche. Analyse la vidéo du pli. Le joueur que tu dois coacher se trouve EN BAS. Fournis un retour au format JSON valide uniquement avec cette structure : {\"analyse\": \"ton analyse globale du coup joué\", \"erreurs\": [\"erreur ou conseil 1\", \"conseil 2\"]}" }
                    ] 
                }],
                generationConfig: {
                    responseMimeType: "application/json"
                }
            })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error?.message || JSON.stringify(data));
        }

        res.status(200).json(data);
    } catch (error) { 
        res.status(500).json({ error: error.message }); 
    }
}
