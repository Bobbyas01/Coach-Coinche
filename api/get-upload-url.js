export default async function handler(req, res) {
    // Gestion CORS obligatoire pour Android
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Goog-Upload-Header-Content-Length, X-Goog-Upload-Header-Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Méthode non autorisée' });

    const apiKey = process.env.GEMINI_API_KEY;
    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/upload/v1beta/files?key=${apiKey}`, {
            method: 'POST',
            headers: {
                'X-Goog-Upload-Protocol': 'resumable',
                'X-Goog-Upload-Command': 'start',
                'X-Goog-Upload-Header-Content-Length': req.headers['x-goog-upload-header-content-length'],
                'X-Goog-Upload-Header-Content-Type': req.headers['x-goog-upload-header-content-type'],
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ file: { display_name: "video_coinche.mp4" } })
        });
        const uploadUrl = response.headers.get('x-goog-upload-url');
        res.status(200).json({ uploadUrl });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}
