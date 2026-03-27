/* ==========================================
   VII. SISTÈM PARENNAJ INTEGRÉ (ELITE)
   ========================================== */

// Detekte si moun nan klike sou yon lyen (Eg: ?ref=ARS-1234)
window.detecterSponsorURL = () => {
    const params = new URLSearchParams(window.location.search);
    const refCode = params.get('ref');
    
    if (refCode && refCode.startsWith('ARS-')) {
        // Sere kòd la pou lè l ap kreye kont
        localStorage.setItem('pending_sponsor_code', refCode);
        
        // Ranpli input nan Signup la si l egziste
        const sInput = document.getElementById('sponsor-input');
        if (sInput) {
            sInput.value = refCode;
            const badge = document.getElementById('badge-ref-status');
            if(badge) badge.style.display = "block";
        }

        // Montre Modal Felisitasyon an
        const displaySponsor = document.getElementById('display-sponsor-id');
        if (displaySponsor) displaySponsor.innerText = "Sponsor: " + refCode;
        
        setTimeout(() => {
            const modal = document.getElementById('modal-rabe');
            if (modal) modal.classList.remove('hidden');
        }, 2000);
    }
};

// Fonksyon pou kopye kòd ARS la
window.kopiyeKod = () => {
    const kodInput = document.getElementById('my-ref-code');
    if (!kodInput) return;
    kodInput.select();
    kodInput.setSelectionRange(0, 99999);
    navigator.clipboard.writeText(kodInput.value);
    alert("Kòd ou kopiye ak siksè!");
};

// Fonksyon pou pataje sou WhatsApp ak vre ID a
window.patajeWhatsApp = () => {
    const myCode = document.getElementById('my-ref-code').value;
    if (!myCode || myCode === "ARS-ID") return alert("Tanpri konekte pou jwenn kòd ou.");
    
    const siteLink = `https://echanjplus064.netlify.app/?ref=${myCode}`;
    const message = `Bonjou! M ap envite w sou Echanj Plus. Sèvi ak kòd mwen an (${myCode}) pou w jwenn 2% rabè sou premye echanj ou. Enskri la: ${siteLink}`;
    
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
};

// Lojik transfè komisyon (Senp)
window.demannTransfere = () => {
    const balansKomisyon = parseFloat(document.getElementById('komisyon-balans').innerText);
    if (balansKomisyon < 50) {
        alert("Ou bezwen omwen 50 HTG pou w fè transfè.");
        return;
    }
    if (confirm(`Voye ${balansKomisyon} HTG nan balans prensipal ou?`)) {
        alert("Transfè a voye bay Admin pou validasyon!");
        // Isit la ou ka ajoute push Firebase pou Admin validé l
    }
};

// Fonksyon jeneral pou Modal
window.toggleModal = (id) => {
    const modal = document.getElementById(id);
    if (modal) modal.classList.toggle('hidden');
};

// RELE DETEKSYON AN LÈ PAJ LA LOUVRI
window.addEventListener('load', () => {
    window.detecterSponsorURL();
});
