/* ==========================================
   JS ELITE - SISTÈM PARENNAJ ECHANJ PLUS (VÈSYON FINAL)
   ========================================== */

// 1. DETEKTE SPONSOR & OUVRI SIGNUP DIRÈK
window.detecterSponsorURL = () => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');
    
    if (ref && ref.startsWith('ARS-')) {
        // Sere kòd la nan memwa
        localStorage.setItem('pending_sponsor_code', ref);
        
        // A. OUVRI PAJ SIGNUP LA DIRÈK
        const authPage = document.getElementById('auth-page');
        const homePage = document.getElementById('home-page');
        if (authPage && homePage) {
            authPage.classList.remove('hidden');
            homePage.classList.add('hidden');
            
            // Si w gen switch login/signup, fòse signup parèt
            const signupForm = document.getElementById('signup-form-container');
            const loginForm = document.getElementById('login-form-container');
            if (signupForm && loginForm) {
                signupForm.classList.remove('hidden');
                loginForm.classList.add('hidden');
            }
        }

        // B. ENSERE KÒD LA NAN INPUT SPONSOR A
        const sInput = document.getElementById('sponsor-input');
        if (sInput) {
            sInput.value = ref;
            // Si w gen yon ti badj siksè bò kote input la
            const badge = document.getElementById('badge-ref-status');
            if(badge) badge.style.display = "block";
        }

        // C. PREPARE MODAL LA
        const modalRabe = document.getElementById('modal-rabe');
        const displaySponsor = document.getElementById('display-sponsor-id');
        
        if (modalRabe && displaySponsor) {
            displaySponsor.innerText = "Kòd Sponsor: " + ref;
            
            // Louvri modal la apre 1 segonn
            setTimeout(() => {
                modalRabe.classList.remove('hidden');
            }, 1000);
        }
    }
};

// 2. CHANGER PAJ (NAVIGASYON SIDEBAR)
window.showPage = (pageId, element) => {
    // Kache tout seksyon yo
    document.querySelectorAll('section, .page-content').forEach(sec => {
        sec.classList.add('hidden');
    });

    const page = document.getElementById(pageId);
    if (page) {
        page.classList.remove('hidden');
        
        // Lojik espesyal pou paj parennaj la
        if (pageId === 'paj-parennaj') {
            const sideID = document.getElementById('side-id').innerText;
            const myRefInput = document.getElementById('my-ref-code');

            if (sideID && sideID !== "ARS-ID" && sideID !== "...") {
                myRefInput.value = sideID;
                localStorage.setItem('user_ars_id', sideID);
            } else {
                myRefInput.value = localStorage.getItem('user_ars_id') || "Chaje...";
            }
        }

        // Rele lòt inisyalizasyon yo si yo egziste
        if (pageId === 'paj-trans' && window.initIstorik) window.initIstorik();
        if (pageId === 'paj-retre' && window.enjekteHtmlRetre) window.enjekteHtmlRetre();
    }

    // Mizajou klas active nan bouton navigasyon yo
    document.querySelectorAll('.nav-item, .menu-item').forEach(nav => nav.classList.remove('active'));
    if (element) element.classList.add('active');

    // Fèmen sidebar si l te ouvè
    const sidebar = document.getElementById('sidebar');
    if (sidebar) sidebar.classList.remove('active');
};

// 3. KOPIYE KÒD ARS OU
window.kopiyeKod = () => {
    const kodInput = document.getElementById('my-ref-code');
    if (!kodInput || kodInput.value.includes("Chaje")) return alert("Tann kòd la chaje...");
    
    kodInput.select();
    kodInput.setSelectionRange(0, 99999);
    navigator.clipboard.writeText(kodInput.value);
    
    alert("✅ Kòd ou kopiye ak siksè!");
};

// 4. PATAJE SOU WHATSAPP
window.patajeWhatsApp = () => {
    const myCode = document.getElementById('my-ref-code').value;
    
    if (!myCode || myCode.includes("Chaje") || myCode.includes("ID")) {
        return alert("❌ Erè: Kòd ou a poko prè.");
    }

    const siteLink = `https://echanjplus064.netlify.app/?ref=${myCode}`;
    const message = `*Bonjou!* 👋\n\nM ap envite w sou *Echanj Plus*.\nSèvi ak kòd mwen an (*${myCode}*) pou w jwenn *2% rabè* sou premye echanj ou.\n\nEnskri la: ${siteLink}`;
    
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
};

// 5. DEMANN TRANSFÈ KOMISYON
window.demannTransfere = () => {
    const balansKomisyon = parseFloat(document.getElementById('komisyon-balans').innerText);
    if (balansKomisyon < 50) return alert("Ou bezwen omwen 50 HTG nan komisyon.");

    if (confirm(`Voye ${balansKomisyon} HTG nan balans prensipal ou?`)) {
        alert("Demann ou voye bay Admin! Y ap verifye sa pwofesyonèl.");
    }
};

// 6. JERE MODAL YO
window.toggleModal = (id) => {
    const modal = document.getElementById(id);
    if (modal) modal.classList.toggle('hidden');
};

// INITIALISATION LÈ PAJ LA FIN CHADE
document.addEventListener('DOMContentLoaded', () => {
    window.detecterSponsorURL();
});
       
