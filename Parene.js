/* ==========================================
   JS ELITE - SISTÈM PARENNAJ ECHANJ PLUS (VÈSYON DINAMIK)
   ========================================== */

// 1. DETEKTE SPONSOR NAN URL (Eg: ?ref=ARS-123)
window.detecterSponsorURL = () => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');
    
    if (ref && ref.startsWith('ARS-')) {
        localStorage.setItem('pending_sponsor_code', ref);
        
        // Ranpli input nan seksyon Auth (Login/Signup)
        const sInput = document.getElementById('sponsor-input');
        if (sInput) {
            sInput.value = ref;
            const badge = document.getElementById('badge-ref-status');
            if(badge) badge.style.display = "block";
        }

        // Montre Modal Felisitasyon an
        const displaySponsor = document.getElementById('display-sponsor-id');
        if (displaySponsor) {
            displaySponsor.innerText = "Sponsor: " + ref;
        }
        
        setTimeout(() => {
            const modalRabe = document.getElementById('modal-rabe');
            if (modalRabe) modalRabe.classList.remove('hidden');
        }, 1500);
    }
};

// 2. CHANGER PAJ (SIDEBAR) - RANJE POU RALE VRE ID A
window.showPage = (pageId, element) => {
    // Kache tout seksyon
    document.querySelectorAll('section').forEach(sec => {
        sec.classList.add('hidden');
    });

    const page = document.getElementById(pageId);
    if (page) {
        page.classList.remove('hidden');
        
        // LOJIK PARENNAJ: Rale ID nan Sidebar la dirèkteman
        if (pageId === 'paj-parennaj') {
            const sideID = document.getElementById('side-id').innerText;
            const myRefInput = document.getElementById('my-ref-code');

            if (sideID && sideID !== "ARS-ID" && sideID !== "...") {
                myRefInput.value = sideID;
                localStorage.setItem('user_ars_id', sideID); // Sere l pou sekirite
            } else {
                // Si sidebar la poko gen done, gade nan memwa
                myRefInput.value = localStorage.getItem('user_ars_id') || "Chaje...";
            }
        }

        // Lòt lojik (Istorik, Retrè)
        if (pageId === 'paj-trans' && window.initIstorik) window.initIstorik();
        if (pageId === 'paj-retre' && window.enjekteHtmlRetre) window.enjekteHtmlRetre();
    }

    // Mizajou klas active nan meni an
    document.querySelectorAll('.nav-item, .menu-item').forEach(nav => nav.classList.remove('active'));
    if (element) element.classList.add('active');

    // Fèmen Sidebar
    const sidebar = document.querySelector('.sidebar-pro');
    if (sidebar) sidebar.classList.remove('active');
};

// 3. KOPIYE KÒD ARS
window.kopiyeKod = () => {
    const kodInput = document.getElementById('my-ref-code');
    if (!kodInput || kodInput.value.includes("Chaje")) return alert("Tann kòd la chaje...");
    
    kodInput.select();
    kodInput.setSelectionRange(0, 99999);
    navigator.clipboard.writeText(kodInput.value);
    
    alert("✅ Kòd ou kopiye! Pataje l pou w fè kòb.");
};

// 4. PATAJE SOU WHATSAPP (VRE LYEN AN)
window.patajeWhatsApp = () => {
    const myCode = document.getElementById('my-ref-code').value;
    
    if (!myCode || myCode.includes("Chaje") || myCode.includes("ITILIZATE")) {
        return alert("❌ Erè: Kòd ou a poko prè. Asire w ou konekte.");
    }

    const siteLink = `https://echanjplus064.netlify.app/?ref=${myCode}`;
    const message = `*Bonjou!* 👋\n\nM ap envite w sou *Echanj Plus*.\nSèvi ak kòd mwen an (*${myCode}*) pou w jwenn *2% rabè* sou premye echanj ou.\n\nEnskri isit la: ${siteLink}`;
    
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
};

// 5. DEMANN TRANSFÈ KOMISYON
window.demannTransfere = () => {
    const balansKomisyon = parseFloat(document.getElementById('komisyon-balans').innerText);
    if (balansKomisyon < 50) return alert("Ou bezwen omwen 50 HTG.");

    if (confirm(`Èske ou vle voye ${balansKomisyon} HTG nan balans prensipal ou?`)) {
        alert("Demann voye! Admin ap valide sa.");
        // Isit la ou ka mete yon 'update' Firebase si w vle
    }
};

// 6. TOGGLE MODAL
window.toggleModal = (id) => {
    const modal = document.getElementById(id);
    if (modal) modal.classList.toggle('hidden');
};

// INITIALISATION
document.addEventListener('DOMContentLoaded', () => {
    window.detecterSponsorURL();
});





window.detecterSponsorURL = () => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');
    
    // Tcheke si gen yon kòd epi si li kòmanse ak ARS-
    if (ref && ref.startsWith('ARS-')) {
        localStorage.setItem('pending_sponsor_code', ref);
        
        const modalRabe = document.getElementById('modal-rabe');
        const displaySponsor = document.getElementById('display-sponsor-id');
        
        if (modalRabe && displaySponsor) {
            // METE VRE ID A AVAN MODAL LA LOUVRI
            displaySponsor.innerText = "Kòd Sponsor: " + ref;
            
            // SÈLMAN SI GEN KÒD NOU LOUVRI MODAL LA
            setTimeout(() => {
                modalRabe.classList.remove('hidden');
            }, 1000);
        }
    } else {
        // SI PA GEN KÒD, NOU ASURE NOU MODAL LA KACHE NÈT
        const modalRabe = document.getElementById('modal-rabe');
        if (modalRabe) modalRabe.classList.add('hidden');
    }
};

