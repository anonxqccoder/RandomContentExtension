const asyncGet = () => new Promise((resolve) => chrome.storage.local.get({ links: [] }, (result) => resolve(result.links)));

chrome.contextMenus.removeAll();
chrome.contextMenus.create({
    title: "RANDOM CONTENT",
    // contexts: ["action"],
    id: "contentContextButton",
    // onclick: async () => {

    // },
});

async function openContent() {
    const links = (await asyncGet()).filter((linkData) => linkData.enabled);
    if (links.length === 0) {
        return;
    }

    chrome.tabs.create({
        url: links[Math.floor(Math.random() * links.length)].url,
        selected: true,
    });
}

chrome.contextMenus.onClicked.addListener((e) => {
    if (e.menuItemId === "contentContextButton") {
        openContent();
    }
});
