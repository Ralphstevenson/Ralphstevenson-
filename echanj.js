/* ============================================================
   JS ECHANJ - ECHANJ PLUS V5.0 - BLOKAJ LIVE AK MESAJ WHATSAPP
   ============================================================ */
import { db, auth } from './script.js';
import { ref, get, set, onValue, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// Konfigirasyon pa defo
let liveSettings = {
    rateBuy: 0,
    rateSell: 0,
    systemFee: 16.5, 
    digicelNumber: "50947111123", 
    natcomNumber: "32160708", 
    exchangeStatus: true, // Kontwòl Switch Echanj la
    withdrawStatus: true  
};

// ============================================================
// MIZAJOU: KOUTE NODE 'app_settings' POU KONEKTE AK ADMIN AN
// ============================================================
onValue(ref(db, 'app_settings'), (snapshot) => {
    if (snapshot.exists()) {
        const data = snapshot.val();
        console.log("Done app_settings resevwa:", data); // Pou tcheke nan konsòl la si done yo ap chanje
        
        // Rekipere pousantaj la ak switch yo kòrèkteman
        liveSettings.systemFee = data.system_fee !== undefined ? parseFloat(data.system_fee) : 16.5;
        
        // Pwoteksyon: Tcheke si se Booleen (true/false) oswa Tèks ("on"/"off") admin nan voye
        if (data.exchange_status !== undefined) {
            liveSettings.exchangeStatus = (data.exchange_status === true || data.exchange_status === "on");
        }
        
        if (data.withdraw_status !== undefined) {
            liveSettings.withdrawStatus = (data.withdraw_status === true || data.withdraw_status === "on");
        }
        
        if (data.digicelNumber) liveSettings.digicelNumber = data.digicelNumber;
        if (data.natcomNumber) liveSettings.natcomNumber = data.natcomNumber;

        document.querySelectorAll('.live-fee-tag').forEach(el => {
            el.innerText = `${liveSettings.systemFee}% Frè`;
        });
        
        const sumFeePercent = document.getElementById('sum-fee-percent');
        if (sumFeePercent) sumFeePercent.innerText = liveSettings.systemFee;
    }
});

// ============================================================
// FONKSYON POU OUVRI DIALER A - AK BLOKAJ STRICT
// ============================================================
window.openDialer = async function(rezo) {
    // ⚠️ BLOKAJ: Si Admin lan mete sèvis la sou OFF (false), li bloke kliyan an touswit isit la
    if (liveSettings.exchangeStatus === false) {
        return alert("⚠️ Sèvis echanj lan fèmen pou le moman, kontakte admin la nan 35749198 sou whatsapp");
    }
    
    const user = auth.currentUser; 
    if (!user) return alert("❌ Ou dwe konekte anvan!"); 

    try {
        const userSnap = await get(ref(db, `users/${user.uid}`)); 
        const userData = userSnap.val(); 

        if (!userData || (!userData.transactionPin && !userData.pin)) { 
            alert("🔴 Ou dwe kreye yon PIN nan Paramètres anvan ou fè yon echanj."); 
            if (window.showPage) window.showPage('paj-parametre'); 
            return; 
        }

        const montanMinit = prompt(`Konbyen minit w ap vann (${rezo.toUpperCase()})?`); 
        if (!montanMinit) return; 

        const mVal = parseFloat(montanMinit); 
        if (isNaN(mVal) || mVal < 10) { 
            return alert("❌ Minimòm echanj se 10 HTG."); 
        }

        const pousantajSistem = liveSettings.systemFee / 100; 
        const freSistem = mVal * pousantajSistem; 
        const montanPouResevwa = mVal - freSistem; 

        const sumMinitEl = document.getElementById('sum-minit'); 
        const sumFreEl = document.getElementById('sum-fre'); 
        const sumTotalEl = document.getElementById('sum-total'); 
        const pinInputEl = document.getElementById('input-pin-echanj'); 

        if (sumMinitEl) sumMinitEl.innerText = `${mVal.toFixed(2)} HTG`; 
        if (sumFreEl) sumFreEl.innerText = `-${freSistem.toFixed(2)} HTG`; 
        if (sumTotalEl) sumTotalEl.innerText = `${montanPouResevwa.toFixed(2)} HTG`; 
        if (pinInputEl) pinInputEl.value = '';  

        window.currentPendingExchange = { 
            rezo: rezo, 
            amount: mVal, 
            feeHTG: parseFloat(freSistem.toFixed(2)), 
            toReceive: parseFloat(montanPouResevwa.toFixed(2)), 
            userPIN: userData.transactionPin || userData.pin, 
            userData: userData 
        };

        const modal = document.getElementById('modal-confirm-echanj'); 
        if (modal) {
            modal.style.display = 'flex'; 
            modal.classList.remove('hidden'); 
        }

    } catch (error) {
        console.error("DETAY ERÈ:", error); 
        alert("Gen yon pwoblèm. Verifye koneksyon entènèt ou."); 
    }
};

window.femenModalEchanj = function() { 
    const modal = document.getElementById('modal-confirm-echanj'); 
    if (modal) {
        modal.style.display = 'none'; 
        modal.classList.add('hidden'); 
    }
    const pinInputEl = document.getElementById('input-pin-echanj'); 
    if (pinInputEl) pinInputEl.value = ''; 
};

window.closeFeatureModalOnOverlay = function(event, modalId) {
    if (event.target.id === modalId) {
        if (modalId === 'modal-confirm-echanj') {
            window.femenModalEchanj();
        } else {
            window.closeFeatureModal(modalId);
        }
    }
};

window.openFeatureModal = function(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'flex';
        modal.classList.remove('hidden');
    }
};

window.closeFeatureModal = function(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
        modal.classList.add('hidden');
    }
};

async function fèEchanjFinal() {
    // Double verifikasyon sekirite anvan anrejistreman final la tou
    if (liveSettings.exchangeStatus === false) {
        window.femenModalEchanj();
        return alert("⚠️ Sèvis echanj lan fèmen pou le moman, kontakte admin la nan 35749198 sou whatsapp");
    }

    const user = auth.currentUser; 
    if (!user || !window.currentPendingExchange) return; 

    const data = window.currentPendingExchange; 
    const pinInputEl = document.getElementById('input-pin-echanj'); 
    const pinAntre = pinInputEl ? pinInputEl.value.trim() : ""; 

    if (!pinAntre || pinAntre.length < 4) { 
        alert("❌ Tanpri antre PIN sekirite 4 chif ou an!"); 
        if (pinInputEl) pinInputEl.focus(); 
        return; 
    }

    if (pinAntre.toString() !== data.userPIN.toString()) { 
        return alert("❌ PIN enkòrèk. Aksyon anile."); 
    }

    const transID = "ECH-" + Date.now(); 
    
    const transactionData = {
        transID: transID, 
        uid: user.uid, 
        arsID: data.userData.arsID || "---", 
        fullname: data.userData.fullname || data.userData.full_name || data.userData.username || "Kliyan ARS", 
        phone: data.userData.phone || "", 
        type: "Echanj Minit", 
        method: data.rezo,    
        rezo: data.rezo, 
        amount_sent: data.amount, 
        applied_fee_percent: liveSettings.systemFee, 
        fee_amount: data.feeHTG, 
        htg_to_receive: data.toReceive, 
        status: "Pending",    
        timestamp: serverTimestamp() 
    };

    let anrejistrePwofilKliyan = false; 
    let anrejistreGlobal = false; 

    try {
        await set(ref(db, `users/${user.uid}/user_transactions/${transID}`), transactionData); 
        anrejistrePwofilKliyan = true; 
    } catch (e) {
        console.error("Erè user node:", e); 
    }

    try {
        await set(ref(db, `transactions/${transID}`), transactionData); 
        anrejistreGlobal = true; 
    } catch (e) {
        console.error("Erè global node:", e); 
    }

    if (anrejistrePwofilKliyan || anrejistreGlobal) { 
        try {
            if (window.voyeNotifikasyon) { 
                window.voyeNotifikasyon(user.uid, "Tranzaksyon", `Echanj ${data.amount} minit anrejistre.`); 
            }
        } catch(nErr) { console.log(nErr); } 

        window.femenModalEchanj(); 

        const targetNumber = (data.rezo === 'digicel') ? liveSettings.digicelNumber : liveSettings.natcomNumber; 
        const ussd = (data.rezo === 'digicel')  
            ? `*128*${targetNumber}*${data.amount}#`  
            : `*123*88888888*${targetNumber}*${data.amount}#`; 

        alert("✅ Bravo! Tranzaksyon anrejistre.\n\nKlike sou OK pou w ireksyonnen sou aplikasyon telefòn lan pou transfere minit yo."); 
        
        window.location.href = `tel:${encodeURIComponent(ussd)}`; 
    } else {
        alert("❌ Gen yon erè nan anrejistreman an."); 
    }
}

export function initEchanj(uid) { 
    console.log("Echanj Ready ✅"); 
    const btnKonfime = document.getElementById('btn-konfime-final'); 
    if (btnKonfime) { 
        btnKonfime.onclick = (e) => { 
            e.preventDefault(); 
            fèEchanjFinal(); 
        };
    }
}
