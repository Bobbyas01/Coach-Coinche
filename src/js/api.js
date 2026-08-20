// src/js/api.js
import { CapacitorHttp } from '@capacitor/core';

export async function processVideoWorkflow(file) {
    const statusDiv = document.getElementById('status');
    const API_BASE = "https://n-coinche.vercel.app"; // Ton URL Vercel

    try {
        statusDiv.innerText = "1/3 : Initialisation...";
        
        // CORRECTION : Utilisation de CapacitorHttp pour les appels vers Vercel 
        // afin de contourner les blocages réseau/CORS du WebView Android.
        const initRes = await CapacitorHttp.post({
            url: `${API_BASE}/api/get-upload-url`,
            headers: {
                'Content-Type': 'application/json',
                'X-Goog-Upload-Header-Content-Length': file.size.toString(),
                'X-Goog-Upload-Header-Content-Type': file.type || 'video/mp4'
            }
        });

        if (initRes.status >= 400 || !initRes.data?.uploadUrl) {
            throw new Error(`Erreur init (${initRes.status}): ${JSON.stringify(initRes.data)}`);
        }
        
        const uploadUrl = initRes.data.uploadUrl;

        statusDiv.innerText = "2/3 : Upload de la vidéo...";
        // L'upload direct vers Google Cloud Storage (via l'URL signée fournie)
        const uploadRes = await fetch(uploadUrl, {
            method: 'POST',
            headers: { 
                'X-Goog-Upload-Command': 'upload, finalize', 
                'X-Goog-Upload-Offset': '0' 
            },
            body: file
        });

        if (!uploadRes.ok) {
            const errText = await uploadRes.text();
            throw new Error(`Erreur upload Google (${uploadRes.status}): ${errText}`);
        }

        const uploadData = await uploadRes.json();
        const fileUri = uploadData.file?.uri;

        if (!fileUri) {
            throw new Error("URI Google introuvable dans la réponse d'upload.");
        }

        statusDiv.innerText = "3/3 : Analyse IA...";
        
        // CORRECTION : Utilisation de CapacitorHttp pour demander l'analyse au backend Vercel
        const analyzeRes = await CapacitorHttp.post({
            url: `${API_BASE}/api/analyze`,
            headers: { 'Content-Type': 'application/json' },
            data: { fileUri: fileUri }
        });

        if (analyzeRes.status >= 400) {
            throw new Error(`Erreur analyse (${analyzeRes.status}): ${JSON.stringify(analyzeRes.data)}`);
        }
        
        statusDiv.innerText = "✅ Analyse terminée !";
        return analyzeRes.data;

    } catch (error) {
        console.error("Erreur workflow:", error);
        statusDiv.innerHTML = `<span style="color:red">❌ ${error.message || error}</span>`;
        return null;
    }
}
