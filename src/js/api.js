// src/js/api.js

export async function processVideoWorkflow(videoBlob) {
    const updateStatus = (msg) => document.getElementById('status').innerText = msg;
    
    try {
        // ETAPE 1 : Initialisation Vercel -> Google
        updateStatus("Étape 1/3 : Sécurisation du canal d'upload...");
        const initRes = await fetch('/api/init-upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                mimeType: videoBlob.type,
                byteCount: videoBlob.size.toString()
            })
        });
        const initData = await initRes.json();
        
        if (!initData.uploadUrl) throw new Error("Erreur d'initialisation de l'upload.");

        // ETAPE 2 : Upload direct Mobile -> Google AI Studio
        updateStatus("Étape 2/3 : Envoi de la vidéo à l'IA...");
        const uploadRes = await fetch(initData.uploadUrl, {
            method: 'PUT',
            headers: {
                'Content-Length': videoBlob.size.toString(),
                'X-Goog-Upload-Offset': '0',
                'X-Goog-Upload-Command': 'upload, finalize'
            },
            body: videoBlob
        });
        const uploadData = await uploadRes.json();
        
        if (!uploadData.file || !uploadData.file.uri) throw new Error("Échec de l'upload vers Google.");

        // ETAPE 3 : Analyse Vercel -> Gemini
        updateStatus("Étape 3/3 : Analyse tactique du Coach Coinche en cours...");
        const analyzeRes = await fetch('/api/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                fileUri: uploadData.file.uri,
                mimeType: videoBlob.type
            })
        });
        
        const analysisJson = await analyzeRes.json();
        updateStatus("Analyse terminée !");
        
        return analysisJson;

    } catch (error) {
        updateStatus(`❌ Erreur : ${error.message}`);
        console.error(error);
        return null;
    }
}
