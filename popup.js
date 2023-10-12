const credit = document.getElementById('credit');
const btnPlanning = document.getElementById('btn_planning');
const styleSwitch = document.getElementById('style_switch');

async function initializePopup() {
    await switchStyleState();
    // Autres actions d'initialisation de votre popup
}

function openURL(newUrl) {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        const currentTab = tabs[0];
        if (currentTab.url === 'chrome://newtab/' || currentTab.url === 'about:blank' || currentTab.url === newUrl) {
            chrome.tabs.update(currentTab.id, { url: newUrl });
        } else {
            chrome.tabs.create({ url: newUrl });
        }
    });
}

function checkURL() {
    return new Promise((resolve)=> {
        chrome.runtime.sendMessage({ type: "checkURL" }, function (response) {
            if (response) {
                resolve(true);
            } else {
                resolve(false);
            }
        });
    });
}

function switchStyleState(callback) {
    chrome.runtime.sendMessage({ type: "UpdateSwitchStyle" }, function (response) {
        styleSwitch.checked = response.styleEnabled;

        if (callback && typeof callback === "function") {
            callback(response.styleEnabled);
        }
    });
}


initializePopup();

credit.addEventListener('click', function () {
    openURL('https://bento.me/ldebuchy')
});

btnPlanning.addEventListener('click', function () {
    openURL('https://ws-edt-cd.wigorservices.net/WebPsDyn.aspx?action=posEDTLMS');
});

styleSwitch.addEventListener('click', function () {
    chrome.runtime.sendMessage({ type: "SwitchStyle" });
});