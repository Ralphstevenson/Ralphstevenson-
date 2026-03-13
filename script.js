/**
 * UI LOGIC - ECHANJ PLUS 2026
 * Jere navigasyon ak chajman paj modilè (Fetch API)
 */

// 1. MAPING PAJ YO (ID Seksyon -> Non Fichye HTML)
const pajMap = {
    'paj-akey': 'akey.html',
    'paj-echanj': 'echanj.html',
    'paj-retre': 'retre.html',
    'paj-trans': 'istorik.html',
    'chat-container': 'chat.html'
};

// 2. FONKSYON PRINCIPAL POU CHANJE PAJ
window.showPage = async function(pageId, element) {
    // A. Kache tout seksyon yo
    document.querySelectorAll('.content-wrapper > section').forEach(sec => {
        sec.classList.add('hidden');
    });

    // B. Montre seksyon ki klike a
    const targetSection = document.getElementById(pageId);
    if (targetSection) {
        targetSection.classList.remove('hidden');
        
        // C. Tcheke si paj la vid pou n chaje kontni an
        if (targetSection.innerHTML.trim() === "") {
            await chajeKontniPaj(pageId);
        }
    }

    // D. Mete ajou style nan Navbar a
    document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
    if (element) {
        element.classList.add('active');
    }
};

// 3. FONKSYON POU FETCH HTML LA
async function chajeKontniPaj(pageId) {
    const fileName = pajMap[pageId];
    if (!fileName) return;

    const targetSection = document.getElementById(pageId);
    
    // Montre yon ti loader pandan l ap chaje
    targetSection.innerHTML = `<div class="loader-paj"><i class="fa fa-spinner fa-spin"></i> Chaje...</div>`;

    try {
        const response = await fetch(fileName);
        if (!response.ok) throw new Error(`Pa ka jwenn ${fileName}`);
        
        const html = await response.text();
        targetSection.innerHTML = html;

        // LANSE FONKSYON ESPESIFIK POU CHAK PAJ (si yo egziste)
        postChajmanLojik(pageId);

    } catch (error) {
        console.error("Erè chajman:", error);
        targetSection.innerHTML = `<p style="color:red; text-align:center; padding:20px;">Erè nan chajman paj la. Verifye koneksyon w.</p>`;
    }
}

// 4. LOJIK APRE CHAJMAN (Pou re-konekte bouton oswa done Firebase)
function postChajmanLojik(pageId) {
    if (pageId === 'paj-retre') {
        // Si retre.js gen yon fonksyon inisyalizasyon, rele l isit la
        if (window.initRetre) window.initRetre();
    }
    if (pageId === 'paj-akey') {
        // Rekòmanse carousel la si l nan akey.html
        if (window.komanseCarousel) window.komanseCarousel();
    }
}

// 5. GESTYON SIDEBAR
window.toggleSidebar = function() {
    const sidebar = document.getElementById('sidebar');
    if (sidebar) {
        sidebar.classList.toggle('active');
    }
};
            
