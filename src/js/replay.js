// src/js/replay.js

// Fonction utilitaire pour convertir un "MM:SS" en secondes pour le lecteur vidéo
function timeToSeconds(timeStr) {
    if (!timeStr) return 0;
    const parts = timeStr.split(':');
    if (parts.length === 2) {
        return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
    }
    return parseInt(timeStr, 10) || 0;
}

export function renderReplayDashboard(data, videoUrl) {
    const container = document.getElementById('replay-container');
    container.style.display = 'block';

    // 1. Injection du Lecteur Vidéo au sommet de l'interface
    let html = `
    <div class="video-wrapper">
        <video id="ia-video-player" controls playsinline preload="auto">
            <source src="${videoUrl}" type="video/mp4">
            <source src="${videoUrl}" type="video/webm">
            Votre navigateur ne supporte pas la vidéo.
        </video>
    </div>
    <h2 style="margin-bottom: 20px;">Débriefing de la mène</h2>`;

    // 2. Carte Contexte
    html += `
    <div class="card">
        <h3>Contrat</h3>
        <div class="data-grid">
            <div><div class="data-label">Annonce</div><div class="data-value">${data.partie_context.contrat} ${data.partie_context.couleur_atout}</div></div>
            <div><div class="data-label">Preneur</div><div class="data-value">${data.partie_context.preneur}</div></div>
            <div><div class="data-label">Issue</div><div class="data-value">${data.partie_context.score_final_estime}</div></div>
        </div>
    </div>`;

    // 3. Carte Bilan Global
    html += `
    <div class="card" style="border-left-color: #4CAF50;">
        <h3>Bilan Global <span style="color: #FFC107;">⭐ ${data.analyse_globale.note_strategique}/10</span></h3>
        <p style="font-size: 14px;"><strong style="color:#4CAF50">Point fort :</strong> ${data.analyse_globale.point_fort}</p>
        <p style="font-size: 14px; margin-top: 8px;"><strong style="color:#F57C00">À améliorer :</strong> ${data.analyse_globale.axe_amelioration}</p>
    </div>`;

    // 4. Cartes d'Actions et d'Erreurs
    if (data.erreurs_et_conseils && data.erreurs_et_conseils.length > 0) {
        html += `<h3 style="margin-top: 30px; margin-bottom: 15px;">Détail des plis</h3>`;
        
        data.erreurs_et_conseils.forEach(action => {
            const isError = action.type_erreur && action.type_erreur.toLowerCase() !== "aucune erreur";
            const isCritique = action.gravite && action.gravite.toLowerCase() === 'critique';
            
            let cardClass = "card";
            let badgeClass = "badge success";
            let badgeText = "Action valide";
            let borderColor = "#4CAF50";

            if (isError) {
                cardClass = "card error-card";
                badgeClass = isCritique ? "badge" : "badge moderate";
                badgeText = action.type_erreur;
                borderColor = isCritique ? "#E53935" : "#F57C00";
            }
            
            html += `
            <div class="${cardClass}" style="border-left-color: ${borderColor};">
                <h3>Pli n°${action.pli_numero} <span class="timestamp-text">⏱ ${action.timestamp_video}</span></h3>
                <span class="${badgeClass}">${badgeText}</span>
                
                <div class="data-grid">
                    <div>
                        <div class="data-label">Carte Jouée</div>
                        <div class="data-value" style="color: ${isError ? '#E53935' : '#fff'}">${isError ? '❌' : '✅'} ${action.carte_jouee}</div>
                    </div>
                    <div>
                        <div class="data-label">Recommandation</div>
                        <div class="data-value" style="color: #4CAF50;">✅ ${action.carte_recommandee}</div>
                    </div>
                </div>
                
                <div class="feedback">"${action.explication_tactique}"</div>
                
                <!-- Bouton Magique de synchronisation vidéo -->
                <button class="play-action-btn" data-time="${action.timestamp_video}" style="background-color: ${borderColor};">
                    ▶ Revoir l'action à ${action.timestamp_video}
                </button>
            </div>`;
        });
    }

    container.innerHTML = html;
    
    // 5. Ajout de l'interactivité sur la vidéo
    const videoPlayer = document.getElementById('ia-video-player');
    const playButtons = container.querySelectorAll('.play-action-btn');

    playButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const timeStr = e.target.getAttribute('data-time');
            const targetTime = timeToSeconds(timeStr);
            
            // Remonte doucement jusqu'au lecteur vidéo
            videoPlayer.scrollIntoView({ behavior: 'smooth', block: 'center' });
            
            // On laisse le temps au scroll de se faire, puis on lance la vidéo
            setTimeout(() => {
                videoPlayer.currentTime = targetTime;
                videoPlayer.play();
            }, 300);
        });
    });
}
