const asyncSet = (links) => new Promise((resolve) => chrome.storage.local.set({ links: links }, resolve));

const asyncGet = () => new Promise((resolve) => chrome.storage.local.get({ links: [] }, (result) => resolve(result.links)));

const linksButton = document.getElementById("uploadLinksButton");
linksButton.addEventListener("change", (e) => {
    const read = new FileReader();

    read.readAsBinaryString(e.target.files[0]);

    read.onloadend = async function () {
        const currentLinks = await asyncGet();
        const newLinks = read.result
            .split("\n")
            .map((link) => link.trim())
            .filter((link) => !currentLinks.find((linkData) => linkData.url === link));
        const validLinks = currentLinks.concat(newLinks.map((link) => ({ url: link, enabled: true })));

        await asyncSet(validLinks);
        reloadLinks();

        e.target.value = null;
    };
});

async function reloadLinks() {
    const validLinks = await asyncGet();
    const linksCollectionDiv = document.getElementById("links");
    linksCollectionDiv.innerHTML = "";
    for (const linkData of validLinks) {
        const linkParagraphElement = document.createElement("p");

        const linkHref = document.createElement("a");
        linkHref.href = linkData.url;
        linkHref.innerText = linkData.url;
        linkParagraphElement.appendChild(linkHref);

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = linkData.enabled;
        checkbox.onchange = () => checkboxChange(!linkData.enabled, linkData.url);
        linkParagraphElement.appendChild(checkbox);

        const removeButton = document.createElement("button");
        removeButton.innerText = "Remove";
        removeButton.onclick = () => removeLink(linkData.url);
        linkParagraphElement.appendChild(removeButton);

        linksCollectionDiv.appendChild(linkParagraphElement);
    }
}

async function checkboxChange(isChecked, url) {
    const links = await asyncGet();
    for (let i = 0; i < links.length; i++) {
        if (links[i].url === url) {
            links[i].enabled = isChecked;
            break;
        }
    }

    await asyncSet(links);
    reloadLinks();
}

async function removeLink(url) {
    const links = await asyncGet();
    for (let i = 0; i < links.length; i++) {
        if (links[i].url === url) {
            links.splice(i, 1);
            break;
        }
    }

    await asyncSet(links);
    reloadLinks();
}

async function openContent() {
    const links = (await asyncGet()).filter((linkData) => linkData.enabled);
    if (links.length === 0) {
        return alert("No enabled links in database!");
    }

    chrome.tabs.create({
        url: links[Math.floor(Math.random() * links.length)].url,
        selected: true,
    });
}

const contentButton = document.getElementById("contentButton");
contentButton.addEventListener("click", openContent);

const nukeConfirm = { confirmed: false, time: Date.now() };
document.getElementById("nuke").addEventListener("click", async () => {
    if (Date.now() - nukeConfirm.time > 20000) {
        nukeConfirm.confirmed = false;
    }

    if (!nukeConfirm.confirmed) {
        alert("This action is IRREVERSIBLE, please click the button one more time within 20 seconds to confirm!");
        nukeConfirm.confirmed = true;
        nukeConfirm.time = Date.now();
    } else {
        nukeConfirm.confirmed = false;
        nukeConfirm.time = Date.now();

        await asyncSet([]);
        reloadLinks();
    }
});

reloadLinks();
