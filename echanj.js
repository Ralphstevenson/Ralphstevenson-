/* ============================================================
   JS ECHANJ - ECHANJ PLUS V4.8 - ANTI-BLOKAJ FIREBASE WRITE
   ============================================================ */
import { db, auth } from './script.js';
import { ref, get, set, onValue, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// Konfigirasyon pa defo
let liveSettings = {
    rateBuy: 0,
    rateSell: 0,
    systemFee: 16.5, // Pousantaj fiks 16.5% pa defo[span_0](start_span)[span_0](end_span)
    digicelNumber: "50947111123",[span_1](start_span)[span_1](end_span)
    natcomNumber: "32160708",[span_2](start_span)[span_2](end_span)
    exchangeStatus: true, // Switch Echanj aktif pa defo
    withdrawStatus: true  // Switch Retrè aktif pa defo
};

// ============================================================
// MIZAJOU: KOUTE NENÈT NODE 'app_settings' POU KONEKTE AK ADMIN AN
// ============================================================
onValue(ref(db, 'app_settings'), (snapshot) => {
    if (snapshot.exists()) {
        const data = snapshot.val();
        
        // Map done yo soti nan estrikti Admin lan pou vini nan kòd Kliyan sa a
        liveSettings.systemFee = data.system_fee !== undefined ? parseFloat(data.system_fee) : 16.5;
        liveSettings.exchangeStatus = data.exchange_status !== undefined ? data.exchange_status : true;
        liveSettings.withdrawStatus = data.withdraw_status !== undefined ? data.withdraw_status : true;
        
        // Si w ta gen nimewo telefòn yo tou nan menm node lan:
        if (data.digicelNumber) liveSettings.digicelNumber = data.digicelNumber;
        if (data.natcomNumber) liveSettings.natcomNumber = data.natcomNumber;

        // 1. Mizajou otomatik afichaj frè yo nan popups kalkilatris yo
        document.querySelectorAll('.live-fee-tag').forEach(el => {
            el.innerText = `${liveSettings.systemFee}% Frè`;
        });
        
        // 2. Mizajou pousantaj la anndan modal konfimasyon tranzaksyon an
        const sumFeePercent = document.getElementById('sum-fee-percent');
        if (sumFeePercent) sumFeePercent.innerText = liveSettings.systemFee;
    }
});

// 1. FONKSYON LÈ KLIKEL SOU DIGICEL OSWA NATCOM
window.openDialer = async (rezo) => {
    const user = auth.currentUser;[span_3](start_span)[span_3](end_span)
    if (!user) return alert("❌ Ou dwe konekte anvan!");[span_4](start_span)[span_4](end_span)

    // BLOKAJ: Si Admin nan fèmen sèvis Echanj la, kliyan an pa ka pase
    if (!liveSettings.exchangeStatus) {
        return alert("⚠️ Sèvis Echanj Minit la an atant pou yon moman. Admin nan ap mete l disponib talè konsa.");
    }

    try {
        // Rekipere enfòmasyon itilizatè a[span_5](start_span)[span_5](end_span)
        const userSnap = await get(ref(db, `users/${user.uid}`));[span_6](start_span)[span_6](end_span)
        const userData = userSnap.val();[span_7](start_span)[span_7](end_span)

        if (!userData || (!userData.transactionPin && !userData.pin)) {[span_8](start_span)[span_8](end_span)
            alert("🔴 Ou dwe kreye yon PIN nan Paramètres anvan ou fè yon echanj.");[span_9](start_span)[span_9](end_span)
            if (window.showPage) window.showPage('paj-parametre');[span_10](start_span)[span_10](end_span)
            return;[span_11](start_span)[span_11](end_span)
        }

        // Mande montan minit[span_12](start_span)[span_12](end_span)
        const montanMinit = prompt(`Konbyen minit w ap vann (${rezo.toUpperCase()})?`);[span_13](start_span)[span_13](end_span)
        if (!montanMinit) return;[span_14](start_span)[span_14](end_span)

        const mVal = parseFloat(montanMinit);[span_15](start_span)[span_15](end_span)
        if (isNaN(mVal) || mVal < 10) {[span_16](start_span)[span_16](end_span)
            return alert("❌ Minimòm echanj se 10 HTG.");[span_17](start_span)[span_17](end_span)
        }

        // KALKIL AKTUALIZE: Frè sistèm an pousantaj egzak ki sot nan Admin lan[span_18](start_span)[span_18](end_span)
        const pousantajSistem = liveSettings.systemFee / 100;[span_19](start_span)[span_19](end_span)
        const freSistem = mVal * pousantajSistem;[span_20](start_span)[span_20](end_span)
        const montanPouResevwa = mVal - freSistem;[span_21](start_span)[span_21](end_span)

        // Afiche Done yo nan Modal la[span_22](start_span)[span_22](end_span)
        const sumMinitEl = document.getElementById('sum-minit');[span_23](start_span)[span_23](end_span)
        const sumFreEl = document.getElementById('sum-fre');[span_24](start_span)[span_24](end_span)
        const sumTotalEl = document.getElementById('sum-total');[span_25](start_span)[span_25](end_span)
        const pinInputEl = document.getElementById('input-pin-echanj');[span_26](start_span)[span_26](end_span)

        if (sumMinitEl) sumMinitEl.innerText = `${mVal.toFixed(2)} HTG`;[span_27](start_span)[span_27](end_span)
        if (sumFreEl) sumFreEl.innerText = `-${freSistem.toFixed(2)} HTG`;[span_28](start_span)[span_28](end_span)
        if (sumTotalEl) sumTotalEl.innerText = `${montanPouResevwa.toFixed(2)} HTG`;[span_29](start_span)[span_29](end_span)
        if (pinInputEl) pinInputEl.value = '';[span_30](start_span)[span_30](end_span)

        // Sove done yo tanporèman pou lè yo klike konfime[span_31](start_span)[span_31](end_span)
        window.currentPendingExchange = {[span_32](start_span)[span_32](end_span)
            rezo: rezo,[span_33](start_span)[span_33](end_span)
            amount: mVal,[span_34](start_span)[span_34](end_span)
            feeHTG: parseFloat(freSistem.toFixed(2)),[span_35](start_span)[span_35](end_span)
            toReceive: parseFloat(montanPouResevwa.toFixed(2)),[span_36](start_span)[span_36](end_span)
            userPIN: userData.transactionPin || userData.pin,[span_37](start_span)[span_37](end_span)
            userData: userData[span_38](start_span)[span_38](end_span)
        };

        // Ouvè Modal la sou ekran an[span_39](start_span)[span_39](end_span)
        const modal = document.getElementById('modal-confirm-echanj');[span_40](start_span)[span_40](end_span)
        if (modal) {
            modal.style.display = 'flex';[span_41](start_span)[span_41](end_span)
            modal.classList.remove('hidden');[span_42](start_span)[span_42](end_span)
        }

    } catch (error) {
        console.error("DETAY ERÈ A NTANFAZ:", error);[span_43](start_span)[span_43](end_span)
        alert("Gen yon pwoblèm nan rezo a. Verifye koneksyon entènèt ou.");[span_44](start_span)[span_44](end_span)
    }
};

// 2. FONKSYON POU FÈMEN MODAL ECHANJ LA[span_45](start_span)[span_45](end_span)
window.femenModalEchanj = function() {[span_46](start_span)[span_46](end_span)
    const modal = document.getElementById('modal-confirm-echanj');[span_47](start_span)[span_47](end_span)
    if (modal) {
        modal.style.display = 'none';[span_48](start_span)[span_48](end_span)
        modal.classList.add('hidden');[span_49](start_span)[span_49](end_span)
    }
    const pinInputEl = document.getElementById('input-pin-echanj');[span_50](start_span)[span_50](end_span)
    if (pinInputEl) pinInputEl.value = '';[span_51](start_span)[span_51](end_span)
};

// Fonksyon pou kapab fèmen modal la lè w klike sou zòn gri a deyò kad la
window.closeFeatureModalOnOverlay = function(event, modalId) {
    if (event.target.id === modalId) {
        if (modalId === 'modal-confirm-echanj') {
            window.femenModalEchanj();
        } else {
            window.closeFeatureModal(modalId);
        }
    }
};

// Fonksyon pou louvri popup detay yo
window.openFeatureModal = function(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'flex';
        modal.classList.remove('hidden');
    }
};

// Fonksyon pou fèmen popup detay yo
window.closeFeatureModal = function(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
        modal.classList.add('hidden');
    }
};

// 3. KREYE TRANSAKSYON AK OUVRI DIALER AUTOMATIKMAN[span_52](start_span)[span_52](end_span)
async function fèEchanjFinal() {
    const user = auth.currentUser;[span_53](start_span)[span_53](end_span)
    if (!user || !window.currentPendingExchange) return;[span_54](start_span)[span_54](end_span)

    const data = window.currentPendingExchange;[span_55](start_span)[span_55](end_span)
    const pinInputEl = document.getElementById('input-pin-echanj');[span_56](start_span)[span_56](end_span)
    const pinAntre = pinInputEl ? pinInputEl.value.trim() : "";[span_57](start_span)[span_57](end_span)

    if (!pinAntre || pinAntre.length < 4) {[span_58](start_span)[span_58](end_span)
        alert("❌ Tanpri antre PIN sekirite 4 chif ou an!");[span_59](start_span)[span_59](end_span)
        if (pinInputEl) pinInputEl.focus();[span_60](start_span)[span_60](end_span)
        return;[span_61](start_span)[span_61](end_span)
    }

    // Validasyon PIN[span_62](start_span)[span_62](end_span)
    if (pinAntre.toString() !== data.userPIN.toString()) {[span_63](start_span)[span_63](end_span)
        return alert("❌ PIN enkòrèk. Aksyon anile.");[span_64](start_span)[span_64](end_span)
    }

    const transID = "ECH-" + Date.now();[span_65](start_span)[span_65](end_span)
    
    // MIZAJOU STRITI: Ajoute varyab `type` ekzak pou kòd Admin lan ka rekonèt li san pwoblèm
    const transactionData = {
        transID: transID,[span_66](start_span)[span_66](end_span)
        uid: user.uid,[span_67](start_span)[span_67](end_span)
        arsID: data.userData.arsID || "---",[span_68](start_span)[span_68](end_span)
        fullname: data.userData.fullname || data.userData.full_name || data.userData.username || "Kliyan ARS",[span_69](start_span)[span_69](end_span)
        phone: data.userData.phone || "",[span_70](start_span)[span_70](end_span)
        type: "Echanj Minit", // Admin lan ap filtre l kòrèkteman kounye a
        method: data.rezo,    // Yo itilize tou nan admin kòm metòd/rezo
        rezo: data.rezo,[span_71](start_span)[span_71](end_span)
        amount_sent: data.amount,[span_72](start_span)[span_72](end_span)
        applied_fee_percent: liveSettings.systemFee,[span_73](start_span)[span_73](end_span)
        fee_amount: data.feeHTG,[span_74](start_span)[span_74](end_span)
        htg_to_receive: data.toReceive,[span_75](start_span)[span_75](end_span)
        status: "Pending",    // Mete l an anglè pou tou de bò yo senkronize pafè
        timestamp: serverTimestamp()[span_76](start_span)[span_76](end_span)
    };

    let anrejistrePwofilKliyan = false;[span_77](start_span)[span_77](end_span)
    let anrejistreGlobal = false;[span_78](start_span)[span_78](end_span)

    // A. Ekri nan espas Kliyan an[span_79](start_span)[span_79](end_span)
    try {
        await set(ref(db, `users/${user.uid}/user_transactions/${transID}`), transactionData);[span_80](start_span)[span_80](end_span)
        anrejistrePwofilKliyan = true;[span_81](start_span)[span_81](end_span)
    } catch (e) {
        console.error("Firebase bloke ekriti sou pwofil itilizatè:", e);[span_82](start_span)[span_82](end_span)
    }

    // B. Ekri nan chemen jeneral (Node 'transactions' ke Admin lan ap koute)
    try {
        await set(ref(db, `transactions/${transID}`), transactionData);[span_83](start_span)[span_83](end_span)
        anrejistreGlobal = true;[span_84](start_span)[span_84](end_span)
    } catch (e) {
        console.error("Firebase bloke ekriti nan node Admin/Global:", e);[span_85](start_span)[span_85](end_span)
    }

    // Konfimasyon ak redireksyon Dialer telefòn lan[span_86](start_span)[span_86](end_span)
    if (anrejistrePwofilKliyan || anrejistreGlobal) {[span_87](start_span)[span_87](end_span)
        try {
            if (window.voyeNotifikasyon) {[span_88](start_span)[span_88](end_span)
                window.voyeNotifikasyon(user.uid, "Tranzaksyon", `Echanj ${data.amount} minit anrejistre.`);[span_89](start_span)[span_89](end_span)
            }
        } catch(nErr) { console.log(nErr); }[span_90](start_span)[span_90](end_span)

        window.femenModalEchanj();[span_91](start_span)[span_91](end_span)

        const targetNumber = (data.rezo === 'digicel') ? liveSettings.digicelNumber : liveSettings.natcomNumber;[span_92](start_span)[span_92](end_span)
        const ussd = (data.rezo === 'digicel')[span_93](start_span)[span_93](end_span)
            ? `*128*${targetNumber}*${data.amount}#`[span_94](start_span)[span_94](end_span)
            : `*123*88888888*${targetNumber}*${data.amount}#`;[span_95](start_span)[span_95](end_span)

        alert("✅ Bravo! Tranzaksyon anrejistre.\n\nKlike sou OK pou w ireksyonnen sou aplikasyon telefòn lan pou transfere minit yo.");[span_96](start_span)[span_96](end_span)
        
        window.location.href = `tel:${encodeURIComponent(ussd)}`;[span_97](start_span)[span_97](end_span)
    } else {
        alert("❌ Gen yon erè nan anrejistreman an. Verifye koneksyon entènèt ou.");[span_98](start_span)[span_98](end_span)
    }
}

// INISYALIZE BOTON YO[span_99](start_span)[span_99](end_span)
export function initEchanj(uid) {[span_100](start_span)[span_100](end_span)
    console.log("Echanj Ready ✅");[span_101](start_span)[span_101](end_span)
    const btnKonfime = document.getElementById('btn-konfime-final');[span_102](start_span)[span_102](end_span)
    if (btnKonfime) {[span_103](start_span)[span_103](end_span)
        btnKonfime.onclick = (e) => {[span_104](start_span)[span_104](end_span)
            e.preventDefault();[span_105](start_span)[span_105](end_span)
            fèEchanjFinal();[span_106](start_span)[span_106](end_span)
        };
    }
}
