/* ============================================================
   JS ECHANJ - ECHANJ PLUS V4.8 - ANTI-BLOKAJ FIREBASE WRITE
   ============================================================ */
import { db, auth } from './script.js';
import { ref, get, set, onValue, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// Konfigirasyon pa defo
let liveSettings = {
    rateBuy: 0,
    rateSell: 0,
    systemFee: 16.5, // Pousantaj fiks 16.5% sou tranzaksyon yo
    digicelNumber: "50947111123",
    natcomNumber: "32160708"
};

// Koute paramèt yo nan Firebase Realtime Database
onValue(ref(db, 'settings'), (snapshot) => {
    if (snapshot.exists()) {
        const data = snapshot.val();
        liveSettings.rateBuy = data.rateBuy || 0;
        liveSettings.rateSell = data.rateSell || 0;
        liveSettings.systemFee = data.systemFee !== undefined ? parseFloat(data.systemFee) : 16.5;
        liveSettings.digicelNumber = data.digicelNumber || "50947111123";
        liveSettings.natcomNumber = data.natcomNumber || "32160708";

        // Mizajou afichaj frè yo sou paj la
        document.querySelectorAll('.live-fee-tag').forEach(el => {
            el.innerText = `${liveSettings.systemFee}% Frè`;
        });
        
        const sumFeePercent = document.getElementById('sum-fee-percent');
        if (sumFeePercent) sumFeePercent.innerText = liveSettings.systemFee;
    }
});

// 1. FONKSYON LÈ KLIKEL SOU DIGICEL OSWA NATCOM
window.openDialer = async (rezo) => {
    const user = auth.currentUser;
    if (!user) return alert("❌ Ou dwe konekte anvan!");

    try {
        // Rekipere enfòmasyon itilizatè a
        const userSnap = await get(ref(db, `users/${user.uid}`));
        const userData = userSnap.val();

        if (!userData || (!userData.transactionPin && !userData.pin)) {
            alert("🔴 Ou dwe kreye yon PIN nan Paramètres anvan ou fè yon echanj.");
            if (window.showPage) window.showPage('paj-parametre');
            return;
        }

        // Mande montan minit
        const montanMinit = prompt(`Konbyen minit w ap vann (${rezo.toUpperCase()})?`);
        if (!montanMinit) return;

        const mVal = parseFloat(montanMinit);
        if (isNaN(mVal) || mVal < 10) {
            return alert("❌ Minimòm echanj se 10 HTG.");
        }

        // Kalkil Frè sistèm an pousantaj
        const pousantajSistem = liveSettings.systemFee / 100;
        const freSistem = mVal * pousantajSistem;
        const montanPouResevwa = mVal - freSistem;

        // Afiche Done yo nan Modal la
        const sumMinitEl = document.getElementById('sum-minit');
        const sumFreEl = document.getElementById('sum-fre');
        const sumTotalEl = document.getElementById('sum-total');
        const pinInputEl = document.getElementById('input-pin-echanj');

        if (sumMinitEl) sumMinitEl.innerText = `${mVal.toFixed(2)} HTG`;
        if (sumFreEl) sumFreEl.innerText = `-${freSistem.toFixed(2)} HTG`;
        if (sumTotalEl) sumTotalEl.innerText = `${montanPouResevwa.toFixed(2)} HTG`;
        if (pinInputEl) pinInputEl.value = ''; 

        // Sove done yo tanporèman pou lè yo klike konfime
        window.currentPendingExchange = {
            rezo: rezo,
            amount: mVal,
            feeHTG: parseFloat(freSistem.toFixed(2)),
            toReceive: parseFloat(montanPouResevwa.toFixed(2)),
            userPIN: userData.transactionPin || userData.pin,
            userData: userData
        };

        // Ouvè Modal la sou ekran an
        const modal = document.getElementById('modal-confirm-echanj');
        if (modal) {
            modal.style.display = 'flex';
            modal.classList.remove('hidden');
        }

    } catch (error) {
        console.error("DETAY ERÈ A NTANFAZ:", error);
        alert("Gen yon pwoblèm nan rezo a. Verifye koneksyon entènèt ou.");
    }
};

// 2. FONKSYON POU FÈMEN MODAL ECHANJ LA
window.femenModalEchanj = function() {
    const modal = document.getElementById('modal-confirm-echanj');
    if (modal) {
        modal.style.display = 'none';
        modal.classList.add('hidden');
    }
    const pinInputEl = document.getElementById('input-pin-echanj');
    if (pinInputEl) pinInputEl.value = '';
};

// 3. KREYE TRANSAKSYON AK OUVRI DIALER AUTOMATIKMAN
async function fèEchanjFinal() {
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

    // Validasyon PIN
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
        type: "Echanj",
        rezo: data.rezo,
        amount_sent: data.amount,
        applied_fee_percent: liveSettings.systemFee,
        fee_amount: data.feeHTG,
        htg_to_receive: data.toReceive,
        status: "En attente",
        timestamp: serverTimestamp()
    };

    // Sèvi ak yon estrateji tolerans pou pèmisyon Firebase (Write Isolation)
    let anrejistrePwofilKliyan = false;
    let anrejistreGlobal = false;

    // A. Eseye ekri nan espas Kliyan an an premye (Sa toujou gen mwens restriksyon)
    try {
        await set(ref(db, `users/${user.uid}/user_transactions/${transID}`), transactionData);
        anrejistrePwofilKliyan = true;
    } catch (e) {
        console.error("Firebase bloke ekriti sou pwofil itilizatè:", e);
    }

    // B. Eseye ekri nan chemen jeneral ak admin yo
    try {
        await set(ref(db, `transactions/${transID}`), transactionData);
        await set(ref(db, `admin_orders/${transID}`), transactionData);
        anrejistreGlobal = true;
    } catch (e) {
        console.error("Firebase bloke ekriti nan node Admin/Global (Tcheke Rules):", e);
    }

    // Si omwen yonn nan yo pase, nou konsidere tranzaksyon an fèt
    if (anrejistrePwofilKliyan || anrejistreGlobal) {
        try {
            if (window.voyeNotifikasyon) {
                window.voyeNotifikasyon(user.uid, "Tranzaksyon", `Echanj ${data.amount} minit anrejistre.`);
            }
        } catch(nErr) { console.log(nErr); }

        // Fèmen modal la
        window.femenModalEchanj();

        // Jenerasyon kòd USSD pou transfè a
        const targetNumber = (data.rezo === 'digicel') ? liveSettings.digicelNumber : liveSettings.natcomNumber;
        const ussd = (data.rezo === 'digicel') 
            ? `*128*${targetNumber}*${data.amount}#` 
            : `*123*88888888*${targetNumber}*${data.amount}#`;

        alert("✅ Bravo! Tranzaksyon anrejistre.\n\nKlike sou OK pou w ireksyonnen sou aplikasyon telefòn lan pou voye minit yo.");
        
        // Louvri aplikasyon Dialer a dirèkteman
        window.location.href = `tel:${encodeURIComponent(ussd)}`;
    } else {
        // Si tou de echwe nèt (Pa egzanp si rezo a koupe nèt)
        alert("❌ Gen yon erè nan anrejistreman an. Verifye koneksyon entènèt ou oswa kontakte sipò.");
    }
}

// INISYALIZE BOTON YO
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
                  
