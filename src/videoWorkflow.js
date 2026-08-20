import { CapacitorHttp } from '@capacitor/core';

export async function processVideoWorkflow(file) {
    const API_BASE = "https://n-coinche.vercel.app";

    try {
        // 1. Obtenir l'URL d'upload (Requête Native)
        const initOptions = {
            url: `${API_BASE}/api/get-upload-url`,
            headers: { 
                'X-Goog-Upload-Header-Content-Length': file.size.toString(), 
                'X-Goog-Upload-Header-Content-Type': file.type,
                'Content-Type': 'application/json'
            }
        };
        const initRes = await CapacitorHttp.post(initOptions);
        const uploadUrl = initRes.data.uploadUrl;

        if (!uploadUrl) throw new Error("URL d'upload Google introuvable.");

        // 2. Upload vers Google
        // Puisque CapacitorHttp est activé, ce fetch standard est "patché" 
        // et passera nativement sur le système Android.
        const uploadRes = await fetch(uploadUrl, {
            method: 'POST',
            headers: { 
                'X-Goog-Upload-Command': 'upload, finalize', 
                'X-Goog-Upload-Offset': '0' 
            },
            body: file 
        });

        if (!uploadRes.ok) {
            const err = await uploadRes.text();
            throw new Error(`Erreur d'upload: ${uploadRes.status} - ${err}`);
        }
        const uploadData = await uploadRes.json();

        // 3. Demander l'analyse au backend Vercel (Requête Native)
        const analyzeOptions = {
            url: `${API_BASE}/api/analyze`,
            headers: { 'Content-Type': 'application/json' },
            data: { fileUri: uploadData.file.uri }
        };
        const analyzeRes = await CapacitorHttp.post(analyzeOptions);
        
        return analyzeRes.data;

    } catch (error) {
        console.error("Échec du workflow vidéo:", error);
        throw error;
    }
}
