// src/js/replay.js

export function renderReplayDashboard(data) {
    const container = document.getElementById('replay-container');
    container.style.display = 'block';

    let html = `<h2 style="margin-bottom: 20px;">Débriefing de la mène</h2>`;

    // 1. Carte Contexte
    html += `
    <div class="card">
        <h3>Contrat</h3>
        <div class="data-grid">
            <div><div class="data-label">Annonce</div><div class="data-value">${data.partie_context.contrat} ${data.partie_context.couleur_atout}</div></div>
            <div><div class="data-label">Preneur</div><div class="data-value">${data.partie_context.preneur}</div></div>
            <div><div class="data-label">Issue</div><div class="data-value">${data.partie_context.score_final_estime}</div></div>
        </div>
    </div>`;

    // 2. Carte Bilan
    html += `
    <div class="card" style="border-left-color: #4CAF50;">
        <h3>Bilan Global <span style="float:right;">⭐ ${data.analyse_globale.note_strategique}/10</span></h3>
        <p style="font-size: 14px;"><strong style="color:#4CAF50">Point fort :</strong> ${data.analyse_globale.point_fort}</p>
        <p style="font-size: 14px; margin-top: 8px;"><strong style="color:#F57C00">À améliorer :</strong> ${data.analyse_globale.axe_amelioration}</p>
    </div>`;

    // 3. Cartes d'Erreurs par Pli
    if (data.erreurs_et_conseils && data.erreurs_et_conseils.length > 0) {
        html += `<h3 style="margin-top: 30px; margin-bottom: 15px;">Erreurs Détectées</h3>`;
        
        data.erreurs_et_conseils.forEach(erreur => {
            const isCritique = erreur.gravite.toLowerCase() === 'critique';
            const badgeClass = isCritique ? 'badge' : 'badge moderate';
            
            html += `
            <div class="card error-card" ${!isCritique ? 'style="border-left-color: #F57C00;"' : ''}>
                <h3>Pli n°${erreur.pli_numero} <span style="float:right; font-size:13px; color:#aaa; font-weight: normal;">⏱ ${erreur.timestamp_video}</span></h3>
                <span class="${badgeClass}">${erreur.type_erreur}</span>
                
                <div class="data-grid">
                    <div><div class="data-label">Carte Jouée</div><div class="data-value">❌ ${erreur.carte_jouee}</div></div>
                    <div><div class="data-label">Recommandation</div><div class="data-value">✅ ${erreur.carte_recommandee}</div></div>
                </div>
                
                <div class="feedback">"${erreur.explication_tactique}"</div>
            </div>`;
        });
    } else {
        html += `
        <div class="card" style="border-left-color: #4CAF50; margin-top: 30px;">
            <h3>Parfait !</h3>
            <p style="font-size: 14px;">Aucune erreur stratégique majeure détectée par le Coach sur cette donne.</p>
        </div>`;
    }

    // Injection dans le DOM
    container.innerHTML = html;
    
    // Scroll automatique vers l'analyse
    setTimeout(() => container.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
}
