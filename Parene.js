/* ==========================================
   JS ELITE - SISTÈM PARENNAJ ECHANJ PLUS
   ========================================== */

// 1. DETEKTE SPONSOR NAN URL (Eg: ?ref=ARS-123)
window.detecterSponsorURL = () => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');
    
    if (ref && ref.startsWith('ARS-')) {
        // Sere kòd la nan memwa navigatè a
        localStorage.setItem('pending_sponsor_code', ref);
        
        // Ranpli input nan seksyon Auth la si l egziste
        const sInput = document.getElementById('sponsor-input');
        const badge = document.getElementById('badge-ref-status');
        if (sInput) {
            sInput.value = ref;
            if(badge) badge.style.display = "block"; // Montre ti vèt la
        }

        // Prepare ak Montre Modal Felisitasyon an
        const displaySponsor = document.getElementById('display-sponsor-id');
        if (displaySponsor) {
            displaySponsor.innerText = "Kòd: " + ref;
        }
        
        // Louvri modal la apre 1.5 segonn pou moun nan fin wè paj la
        setTimeout(() => {
            const modalRabe = document.getElementById('modal-rabe');
            if (modalRabe) modalRabe.classList.remove('hidden');
        }, 1500);
    }
};

// 2. CHANGER PAJ (SIDEBAR)
window.showPage = (pageId) => {
    // Kache tout seksyon
    document.querySelectorAll('section').forEach(sec => {
        sec.classList.add('hidden');
    });

    // Montre paj ki klike a
    const page = document.getElementById(pageId);
    if (page) {
        page.classList.remove('hidden');
        
        // Si se paj parennaj, mete ID itilizatè a nan input la
        if (pageId === 'paj-parennaj') {
            const myARS = localStorage.getItem('user_ars_id') || "ARS-CHACHE";
            document.getElementById('my-ref-code').value = myARS;
        }
    }

    // Fèmen Sidebar la otomatikman
    const sidebar = document.querySelector('.sidebar-pro');
    const overlay = document.querySelector('.sidebar-overlay');
    if (sidebar) {
        sidebar.classList.remove('active');
        overlay.classList.remove('active');
    }
};

// 3. KOPIYE KÒD ARS
window.kopiyeKod = () => {
    const kodInput = document.getElementById('my-ref-code');
    kodInput.select();
    kodInput.setSelectionRange(0, 99999);
    navigator.clipboard.writeText(kodInput.value);
    
    alert("Kòd ou kopiye! Koulye a, pataje l pou w fè kòb.");
};

// 4. PATAJE SOU WHATSAPP
window.patajeWhatsApp = () => {
    const myCode = document.getElementById('my-ref-code').value;
    const siteLink = `https://echanjplus064.netlify.app/?ref=${myCode}`;
    const message = `Bonjou! M ap envite w sou Echanj Plus. Sèvi ak kòd mwen an (${myCode}) pou w jwenn 2% rabè sou premye echanj ou. Enskri isit la: ${siteLink}`;
    
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
};

// 5. DEMANN TRANSFÈ KOMISYON (Lojik Sekirite)
window.demannTransfere = () => {
    const balansKomisyon = parseFloat(document.getElementById('komisyon-balans').innerText);
    const btn = document.getElementById('btn-transfer-komisyon');

    if (balansKomisyon < 50) {
        alert("Atansyon: Ou bezwen omwen 50 HTG nan komisyon pou w fè transfè sa a.");
        return;
    }

    const konfime = confirm(`Èske ou vle voye ${balansKomisyon} HTG nan balans prensipal ou?`);
    
    if (konfime) {
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Operasyon ap fèt...';

        // Simulation Firebase (W ap bezwen kòd Firestore la isit la)
        setTimeout(() => {
            alert("Transfè reyisi! Kòb la moute nan balans ou.");
            document.getElementById('komisyon-balans').innerText = "0.00";
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-exchange-alt"></i> Transfere nan Balans Prensipal';
        }, 2000);
    }
};

// 6. AFICHE LIS EKIP LA (Done ki soti nan Firebase)
window.renderTeamList = (dataFromFirebase) => {
    const container = document.getElementById('container-lis-envite');
    const badge = document.getElementById('total-invites');

    if (!dataFromFirebase || dataFromFirebase.length === 0) {
        container.innerHTML = '<p class="empty-msg">Ou poko gen okenn moun nan ekip ou a.</p>';
        badge.innerText = "0";
        return;
    }

    badge.innerText = dataFromFirebase.length;
    container.innerHTML = ""; 

    dataFromFirebase.forEach(moun => {
        const item = document.createElement('div');
        item.className = 'invite-item';
        item.innerHTML = `
            <span class="user-id-ref">${moun.id}</span>
            <span class="status-first-trans ${moun.status === 'validé' ? 'done' : 'pending'}">
                ${moun.status === 'validé' ? 'Touche' : 'An tann'}
            </span>
        `;
        container.appendChild(item);
    });
};

// 7. FONKSYON POU TOOGLE MODAL YO
window.toggleModal = (id) => {
    const modal = document.getElementById(id);
    if (modal) modal.classList.toggle('hidden');
};

// INITIALISATION LÈ PAJ LA LOUVRI
document.addEventListener('DOMContentLoaded', () => {
    window.detecterSponsorURL();
});

