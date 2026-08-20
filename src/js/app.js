import { processVideoWorkflow } from './api.js';

let mediaRecorder;
let recordedChunks = [];
let isRecording = false;

const recordBtn = document.getElementById('recordBtn');
const uploadBtn = document.getElementById('uploadBtn');
const videoInput = document.getElementById('videoInput');
const statusDiv = document.getElementById('status');

// --- LOGIQUE DE CAPTURE D'ÉCRAN (WEB STANDARD / FUTUR CAPACITOR) ---

recordBtn.addEventListener('click', async () => {
    if (!isRecording) {
        await startRecording();
    } else {
        stopRecording();
    }
});

async function startRecording() {
    try {
        const stream = await navigator.mediaDevices.getDisplayMedia({ 
            video: { displaySurface: "default" } 
        });
        
        const options = { mimeType: 'video/webm;codecs=vp8' };
        mediaRecorder = new MediaRecorder(stream, options);
        
        mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) recordedChunks.push(event.data);
        };

        mediaRecorder.onstop = handleVideoStop;
        
        mediaRecorder.start();
        isRecording = true;
        
        // Mise à jour de l'UI
        recordBtn.innerText = "⬛ Stopper l'enregistrement";
        recordBtn.style.background = "#555";
        uploadBtn.disabled = true;
        statusDiv.innerText = "Enregistrement en cours... Jouez votre donne !";

    } catch (err) {
        statusDiv.innerText = "❌ Permission de capture refusée ou non supportée sur ce navigateur.";
        console.error("Erreur de capture:", err);
    }
}

function stopRecording() {
    mediaRecorder.stop();
    mediaRecorder.stream.getTracks().forEach(track => track.stop()); 
    isRecording = false;
    
    // Mise à jour de l'UI
    recordBtn.innerText = "🔴 Démarrer l'enregistrement";
    recordBtn.style.background = "#E53935";
    recordBtn.disabled = true; 
}

async function handleVideoStop() {
    const videoBlob = new Blob(recordedChunks, { type: 'video/webm' });
    recordedChunks = []; 

    await executeWorkflow(videoBlob);
}

// --- LOGIQUE D'UPLOAD MANUEL (TEST MOBILE SUR FIREFOX) ---

uploadBtn.addEventListener('click', () => videoInput.click());

videoInput.addEventListener('change', async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    statusDiv.innerText = `Fichier ${file.name} sélectionné. Lancement du workflow...`;
    
    // Mise à jour de l'UI
    uploadBtn.disabled = true;
    recordBtn.disabled = true;

    await executeWorkflow(file);
});

// --- ORCHESTRATEUR COMMUN ---

async function executeWorkflow(fileData) {
    const analysisJson = await processVideoWorkflow(fileData);
    
    if (analysisJson) {
        document.getElementById('replay-container').style.display = 'block';
        document.getElementById('jsonOutput').innerText = JSON.stringify(analysisJson, null, 2);
    }
    
    // Réactivation de l'interface
    uploadBtn.disabled = false;
    recordBtn.disabled = false;
}
