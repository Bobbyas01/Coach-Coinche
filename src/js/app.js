// src/js/app.js
import { processVideoWorkflow } from './api.js';
import { renderReplayDashboard } from './replay.js'; 

let mediaRecorder;
let recordedChunks = [];
let isRecording = false;

const recordBtn = document.getElementById('recordBtn');
const uploadBtn = document.getElementById('uploadBtn');
const videoInput = document.getElementById('videoInput');
const statusDiv = document.getElementById('status');
const replayContainer = document.getElementById('replay-container');

// --- LOGIQUE DE CAPTURE (WebRTC) ---
recordBtn.addEventListener('click', async () => {
    if (!isRecording) await startRecording();
    else stopRecording();
});

async function startRecording() {
    try {
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: { displaySurface: "default" } });
        mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp8' });
        
        mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) recordedChunks.push(e.data); };
        mediaRecorder.onstop = handleVideoStop;
        
        mediaRecorder.start();
        isRecording = true;
        
        recordBtn.innerText = "⬛ Stopper l'enregistrement";
        recordBtn.style.background = "#555";
        uploadBtn.disabled = true;
        statusDiv.innerText = "Enregistrement en cours...";
        replayContainer.style.display = "none"; 
    } catch (err) {
        statusDiv.innerText = "❌ Permission de capture refusée.";
    }
}

function stopRecording() {
    mediaRecorder.stop();
    mediaRecorder.stream.getTracks().forEach(track => track.stop()); 
    isRecording = false;
    recordBtn.innerText = "🔴 Démarrer l'enregistrement";
    recordBtn.style.background = "#E53935";
    recordBtn.disabled = true; 
}

async function handleVideoStop() {
    const videoBlob = new Blob(recordedChunks, { type: 'video/webm' });
    recordedChunks = []; 
    await executeWorkflow(videoBlob);
}

// --- LOGIQUE D'UPLOAD MANUEL ---
uploadBtn.addEventListener('click', () => videoInput.click());

videoInput.addEventListener('change', async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    statusDiv.innerText = `Lancement de l'analyse...`;
    uploadBtn.disabled = true;
    recordBtn.disabled = true;
    replayContainer.style.display = "none"; 

    await executeWorkflow(file);
});

// --- ORCHESTRATEUR COMMUN ---
async function executeWorkflow(fileData) {
    const analysisJson = await processVideoWorkflow(fileData);
    
    if (analysisJson) {
        // La magie opère ici : création d'une URL locale lisible par la balise <video>
        const localVideoUrl = URL.createObjectURL(fileData);
        
        // On envoie le JSON ET l'URL vidéo à l'interface
        renderReplayDashboard(analysisJson, localVideoUrl);
    }
    
    uploadBtn.disabled = false;
    recordBtn.disabled = false;
}
