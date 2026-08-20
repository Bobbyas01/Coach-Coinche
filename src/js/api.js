export async function processVideoWorkflow(file) {
    const statusDiv = document.getElementById('status');
    
    try {
        // ÉTAPE 1
        statusDiv.innerText = "Étape 1/4 : Initialisation...";
        const initRes = await fetch('/api/init-upload', { method: 'POST' });
        const initData = await initRes.json();
        if (!initData.uploadUrl) throw new Error("URL d'upload non reçue");

        // ÉTAPE 2 : On finalise le protocole d'upload exigé par Google
        statusDiv.innerText = "Étape 2/4 : Envoi vers Google (Direct)...";
        const uploadRes = await fetch(initData.uploadUrl, { 
            method: 'POST', 
            headers: { 
                'X-Goog-Upload-Command': 'upload, finalize',
                'X-Goog-Upload-Offset': '0'
            }, 
            body: file 
        });
        
        // C'est ICI que l'on reçoit l'URI de la vidéo (une fois stockée)
        const uploadData = await uploadRes.json();
        const fileUri = uploadData.file.uri;
        const fileName = uploadData.file.name;

        // ÉTAPE 3 : Boucle d'attente (avec le vrai nom du fichier)
        statusDiv.innerText = "Étape 3/4 : Traitement Google (indexation)...";
        let isReady = false;
        
        while (!isReady) {
            await new Promise(resolve => setTimeout(resolve, 3000));
            const statusRes = await fetch('/api/check-status', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ fileName })
            });
            const statusData = await statusRes.json();
            
            if (statusData.state === 'ACTIVE') {
                isReady = true;
            } else if (statusData.state === 'FAILED') {
                throw new Error("L'API Google a rejeté la vidéo.");
            }
        }

        // ÉTAPE 4
        statusDiv.innerText = "Étape 4/4 : Analyse IA (Gemini 3.6 Flash)...";
        const analyzeRes = await fetch('/api/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fileUri, mimeType: file.type })
        });
        
        const result = await analyzeRes.json();
        if (analyzeRes.ok) return result;
        else throw new Error(result.error || "Erreur analyse");

    } catch (error) {
        statusDiv.innerText = "❌ Échec : " + error.message;
        return null;
    }
}
