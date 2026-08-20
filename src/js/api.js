// Remplace TON_API_KEY par ta vraie clé API (Attention, elle sera dans l'app)
const API_KEY = "AQ.Ab8RN6KFKFpiTzBkQszFDH5Zz5exAeb3Q3GHIWCV9L2oelmoSQ"; 

export async function processVideoWorkflow(file) {
    const statusDiv = document.getElementById('status');
    
    try {
        // ÉTAPE 1 : Initier l'upload
        statusDiv.innerText = "1/3 : Connexion à Google...";
        const initRes = await fetch(`https://generativelanguage.googleapis.com/upload/v1beta/files?key=${API_KEY}`, {
            method: 'POST',
            headers: {
                'X-Goog-Upload-Protocol': 'resumable',
                'X-Goog-Upload-Command': 'start',
                'X-Goog-Upload-Header-Content-Length': file.size,
                'X-Goog-Upload-Header-Content-Type': file.type,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ file: { display_name: "video_coinche.mp4" } })
        });
        const uploadUrl = initRes.headers.get('x-goog-upload-url');

        // ÉTAPE 2 : Upload direct (La vidéo va du téléphone vers Google)
        statusDiv.innerText = "2/3 : Upload de 50Mo en cours...";
        const uploadRes = await fetch(uploadUrl, {
            method: 'POST',
            headers: {
                'X-Goog-Upload-Command': 'upload, finalize',
                'X-Goog-Upload-Offset': '0',
                'Content-Type': file.type
            },
            body: file
        });
        const uploadData = await uploadRes.json();
        const fileUri = uploadData.file.uri;
        const fileName = uploadData.file.name;

        // ÉTAPE 3 : Attendre que Google soit prêt
        statusDiv.innerText = "3/3 : Traitement par l'IA...";
        let isReady = false;
        while (!isReady) {
            const checkRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/${fileName}?key=${API_KEY}`);
            const checkData = await checkRes.json();
            if (checkData.state === "ACTIVE") isReady = true;
            else if (checkData.state === "FAILED") throw new Error("Upload Google échoué");
            else await new Promise(r => setTimeout(r, 2000));
        }

        // ÉTAPE 4 : Générer le résultat
        const prompt = `Tu es un arbitre de Belote Coinchée. Analyse ce pli. TON JOUEUR est en BAS. JSON requis : { "analyse": "", "erreurs": [] }`;
        const genRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }, { fileData: { mimeType: file.type, fileUri: fileUri } }] }]
            })
        });
        
        const result = await genRes.json();
        statusDiv.innerText = "✅ Analyse terminée !";
        return result.candidates[0].content.parts[0].text;

    } catch (error) {
        statusDiv.innerHTML = `<span style="color:red">❌ ${error.message}</span>`;
        return null;
    }
}
