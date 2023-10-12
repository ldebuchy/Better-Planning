// Déclaration des variables

const planningUrl = "https://ws-edt-cd.wigorservices.net/WebPsDyn.aspx?action=posEDTLMS";

// Variables de style
var styleSelected = "default";
var styleEnabled = false;
var injectedCSSFiles = [];

// Déclaration des fonctions

function checkURL() {
    return new Promise((resolve, reject) => {
        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            const currentTab = tabs[0];
            try {
                if (currentTab.url.startsWith(planningUrl)) {
                    resolve(true);
                } else {
                    resolve(false);
                }
            } catch (error) {
                console.log("an error occured")
                console.error(error);
            }

        });
    });
}

function UpdateStyle() {
    delStyle();
    loadState(function () {
        if (styleEnabled) {

            chrome.tabs.query({}, function (tabs) {
                for (const tab of tabs) {
                    if (tab.url.startsWith(planningUrl)) {
                        const cssFile = `./user-css/${styleSelected}.css`;
                        const tabId = tab.id;
                        injectedCSSFiles.push(cssFile);

                        chrome.scripting.insertCSS({
                            target: { tabId: tabId },
                            files: [cssFile],
                        });
                        saveState();
                        console.log("Style enabled");
                    }
                }
            });
        } else {
            console.log("Style Disabled");
        }
    });
}

function delStyle() {
    loadState(function () {

        chrome.tabs.query({}, function (tabs) {
            for (const tab of tabs) {
                if (tab.url.startsWith(planningUrl)) {
                    const tabId = tab.id;

                    for (const cssFile of injectedCSSFiles) {
                        chrome.scripting.removeCSS({
                            target: { tabId: tabId },
                            files: [cssFile],
                        });
                    }
                    injectedCSSFiles = [];
                    saveState();
                }
            }
        });
    });
}


// Charger les variables depuis le stockage
function loadState(callback) {
    try {
        chrome.storage.local.get(["storage"], function (result) {
            const storage = result.storage;
            styleSelected = storage.styleSelected;
            styleEnabled = storage.styleEnabled;
            injectedCSSFiles = storage.injectedCSSFiles;
            if (callback && typeof callback === "function") {
                callback(); // Appel du callback une fois que les variables sont chargées
            }
        });
    } catch (error) {
        console.error("Attempt to retrieve variables failed :", error);
    }
}

// Enregistrer les variables dans le stockage
function saveState() {
    chrome.storage.local.set({
        storage: {
            styleSelected: styleSelected,
            styleEnabled: styleEnabled,
            injectedCSSFiles: injectedCSSFiles
        }
    });
}

// Exécution des fonctions

// Initaliser les variables dans le stockage à l'installation de l'extension
chrome.runtime.onInstalled.addListener(function () {
    console.log("Installed extension: Initializing variables in storage...");

    styleEnabled = true;
    saveState();
});

// Lorsqu'on ouvre une page, on vérifie si l'URL correspond à celle de l'emploi du temps
chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
    if (changeInfo.status === 'complete' && tab.url.startsWith(planningUrl)) {
        console.log("Planning page detected");
        UpdateStyle();
    }
});

// Réponse à popup.js

chrome.runtime.onMessage.addListener(async function (request, sender, sendResponse) {
    if (request.type === "checkURL") {
        const response = await checkURL();
        sendResponse(response);
    }
    if (request.type === "SwitchStyle") {
        try {
            await toggleStyle();
            sendResponse({ styleEnabled });
        } catch (error) {
            console.error("Error in SwitchStyle:", error);
            alert("A known error has occurred.\n" +
                "Reloading the extension or page may correct this problem while it is being fixed.")
            sendResponse({ error: "An error occurred" });
        }
    }
    if (request.type === "UpdateSwitchStyle") {
        sendResponse({ styleEnabled });
    }
});

async function toggleStyle() {
    await loadState();
    styleEnabled = !styleEnabled;
    await saveState();
    await UpdateStyle();
}
