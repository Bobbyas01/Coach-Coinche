// src/js/api.js

export async function processVideoWorkflow(file) {
    const statusDiv = document.getElementById('status');
    const API_BASE = "https://coach-coinche.vercel.app"; 

    try {
        statusDiv.innerText = "1/3 : Initialisation...";
        
        const CapacitorHttp = window.Capacitor?.Plugins?.CapacitorHttp;
        let uploadUrl;

        if (CapacitorHttp) {
            // Mode Natif Android
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
            uploadUrl = initRes.data.uploadUrl;
        } else {
            // Mode Web (Navigateur)
            const initRes = await fetch(`${API_BASE}/api/get-upload-url`, {
                method: 'POST',
                headers: {
                    'X-Goog-Upload-Header-Content-Length': file.size.toString(),
                    'X-Goog-Upload-Header-Content-Type': file.type || 'video/mp4'
                }
            });
            const data = await initRes.json();
            if (!initRes.ok) throw new Error(data.error || "Erreur d'initialisation");
            uploadUrl = data.uploadUrl;
        }

        statusDiv.innerText = "2/3 : Upload de la vidéo...";
        // Upload direct vers Google File API
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
        let analysisResult;

        if (CapacitorHttp) {
            const analyzeRes = await CapacitorHttp.post({
                url: `${API_BASE}/api/analyze`,
                headers: { 'Content-Type': 'application/json' },
                data: { fileUri: fileUri }
            });

            if (analyzeRes.status >= 400) {
                throw new Error(`Erreur analyse (${analyzeRes.status}): ${JSON.stringify(analyzeRes.data)}`);
            }
            analysisResult = analyzeRes.data;
        } else {
            const analyzeRes = await fetch(`${API_BASE}/api/analyze`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ fileUri: fileUri })
            });
            analysisResult = await analyzeRes.json();
            if (!analyzeRes.ok) throw new Error(analysisResult.error || "Erreur d'analyse");
        }
        
        statusDiv.innerText = "✅ Analyse terminée !";
        return analysisResult;

    } catch (error) {
        console.error("Erreur workflow:", error);
        statusDiv.innerHTML = `<span style="color:red">❌ ${error.message || error}</span>`;
        return null;
    }
}
