const SVG_unpin = '<svg class="h-5 w-5 shrink-0" width="24" height="24" style="vertical-align: middle;fill: currentColor;overflow: hidden;" viewBox="125 125 774 774" version="1.1" xmlns="http://www.w3.org/2000/svg"><path d="M631.637333 178.432a64 64 0 0 1 19.84 13.504l167.616 167.786667a64 64 0 0 1-19.370666 103.744l-59.392 26.304-111.424 111.552-8.832 122.709333a64 64 0 0 1-109.098667 40.64l-108.202667-108.309333-184.384 185.237333-45.354666-45.162667 184.490666-185.344-111.936-112.021333a64 64 0 0 1 40.512-109.056l126.208-9.429333 109.44-109.568 25.706667-59.306667a64 64 0 0 1 84.181333-33.28z m-25.450666 58.730667l-30.549334 70.464-134.826666 135.04-149.973334 11.157333 265.408 265.6 10.538667-146.474667 136.704-136.874666 70.336-31.146667-167.637333-167.765333z"  /><path style="fill: currentColor; stroke: currentColor; stroke-width: 40px;" d="M 314.43 222.675 L 774.686 700.69 L 314.43 222.675 Z"/></svg>',
    SVG_pin = '<svg class="h-5 w-5 shrink-0" style="vertical-align: middle;fill: currentColor;overflow: hidden;" viewBox="125 125 774 774" version="1.1" xmlns="http://www.w3.org/2000/svg"><path d="M631.637333 178.432a64 64 0 0 1 19.84 13.504l167.616 167.786667a64 64 0 0 1-19.370666 103.744l-59.392 26.304-111.424 111.552-8.832 122.709333a64 64 0 0 1-109.098667 40.64l-108.202667-108.309333-184.384 185.237333-45.354666-45.162667 184.490666-185.344-111.936-112.021333a64 64 0 0 1 40.512-109.056l126.208-9.429333 109.44-109.568 25.706667-59.306667a64 64 0 0 1 84.181333-33.28z m-25.450666 58.730667l-30.549334 70.464-134.826666 135.04-149.973334 11.157333 265.408 265.6 10.538667-146.474667 136.704-136.874666 70.336-31.146667-167.637333-167.765333z"  /></svg>',
    DIV_gradient = '<div class="absolute bottom-0 top-0 to-transparent ltr:right-0 ltr:bg-gradient-to-l rtl:left-0 rtl:bg-gradient-to-r from-token-sidebar-surface-primary from-token-sidebar-surface-primary group-hover:from-token-sidebar-surface-secondary  w-8 from-0% group-hover:w-20 group-hover:from-60% juice:group-hover:w-10"></div>',
    LI_noPinnedChats = `<li class="relative z-[15]" style="opacity: 1; height: auto;">
  <div class="group relative rounded-lg active:opacity-90">
    <span class="flex items-center gap-2 p-2 text-sm text-token-text-tertiary">${chrome.i18n.getMessage("noPinnedChats")}</span>
  </div>
</li>`;

class UIService {
    static PREFIX = "PinGPTChat";
    constructor(e) {
        this.dbService = e;
        this.lastClickedElement = null;
    }
    init() {
        this.bindPinUnpinButtons();
        this.bindCloseModal();
    }
    attachToSidebar() {
        this.bindPinnedList();
        this.updatePinnedChats();
    }
    async bindPinnedList() {
        const e = document.querySelector("nav").querySelector("h3").parentElement.parentElement.parentElement;
        this.menuSectionTemplate = e.cloneNode(!0);
        this.menuSectionsContainer = e.parentNode;
    }
    async bindPinUnpinCurrentChatButton() {
        if (window.location.pathname.match(/^\/c\/[0-9a-f-]{36}$/)) {
            const e = UIService.PREFIX + "pinUnpinCurrentChatButton",
                t = document.getElementById(e);
            t && t.remove();
            const n = window.location.pathname.split("/c/").pop(),
                i = document.querySelector('button[data-testid="profile-button"]');
            if (!i) return;
            const r = document.createElement("button");
            r.id = e;
            r.classList.add("h-10", "rounded-lg", "px-2.5", "text-token-text-secondary", "focus-visible:outline-0", "hover:bg-token-main-surface-secondary", "focus-visible:bg-token-main-surface-secondary");
            r.innerHTML = SVG_pin;
            const s = await this.dbService.isPinned(n);
            r.title = s ? chrome.i18n.getMessage("unpin") : chrome.i18n.getMessage("pin");
            r.innerHTML = s ? `${SVG_unpin} Pinned` : `${SVG_pin} Pin`;
            r.onclick = async () => {
                this.dbService.toggleChatPin(n, document.title);
                r.title = r.title === chrome.i18n.getMessage("pin") ? chrome.i18n.getMessage("unpin") : chrome.i18n.getMessage("pin");
                r.innerHTML = r.title === chrome.i18n.getMessage("pin") ? `${SVG_pin} Pin` : `${SVG_unpin} Pinned`;
            };
            i.parentElement.insertBefore(r, i);
        }
    }
    bindPinUnpinButtons() {
        const e = this;
        document.addEventListener("click", (t => {
            if (t.target.closest("nav")) {
                const n = t.target.closest("li"),
                    i = n?.querySelector("a"),
                    r = i?.href?.split("/c/").pop(),
                    s = i?.textContent;
                r && s && (e.lastClickedElement = {
                    id: r,
                    name: s
                });
            } else e.lastClickedElement = null;
        }), !0);
        new MutationObserver((e => {
            e.forEach((e => {
                e.addedNodes.forEach((e => {
                    e instanceof HTMLElement && e.hasAttribute("data-radix-popper-content-wrapper") && this.insertPinUnpinButton(e);
                }));
            }));
        })).observe(document.body, {
            childList: !0,
            subtree: !0
        });
    }
    async insertPinUnpinButton(e) {
        const t = e.querySelector('[role="menu"]'),
            n = e.querySelector('[role="separator"]');
        if (!t || n) return;
        const i = t.querySelector('[role="menuitem"]').cloneNode(!0),
            r = document.createElement("div");
        r.setAttribute("class", "flex items-center justify-center text-token-text-secondary h-5 w-5");
        r.innerHTML = SVG_pin;
        i.textContent = chrome.i18n.getMessage("pin"); // This will show the text "Pin"
        i.insertBefore(r, i.firstChild);
        t.insertBefore(i, t.lastChild);
        setTimeout((async () => {
            const e = this.lastClickedElement?.id,
                t = this.lastClickedElement?.name;
            if (!e || !t) return void i.remove();
            const n = await this.dbService.isPinned(e);
            i.textContent = n ? `${chrome.i18n.getMessage("unpin")} Pinned` : `${chrome.i18n.getMessage("pin")} Pin`; // Show "Pinned" or "Pin"
            r.innerHTML = n ? SVG_unpin : SVG_pin;
            i.insertBefore(r, i.firstChild);
            i.onclick = async () => {
                await this.dbService.toggleChatPin(e, t);
                i.textContent = i.textContent.includes("Pin") ? `${chrome.i18n.getMessage("unpin")} Pinned` : `${chrome.i18n.getMessage("pin")} Pin`;
                r.innerHTML = i.textContent.includes("Pin") ? SVG_pin : SVG_unpin;
                i.insertBefore(r, i.firstChild);
                this.bindPinUnpinCurrentChatButton();
            };
        }), 120);
    }
    updatePinnedChats() {
        this.dbService.getPinnedChats().then((e => {
            document.getElementById(UIService.PREFIX + "pinnedChats")?.remove();
            const t = document.querySelector("nav").querySelector("h3"),
                n = t?.parentElement?.parentElement?.parentElement;
            if (!n) return;
            const i = this.menuSectionTemplate.cloneNode(!0);
            i.id = UIService.PREFIX + "pinnedChats";
            i.querySelector("h3").textContent = `${chrome.i18n.getMessage("pinned")} Pinned`; // Update the header text
            this.menuSectionsContainer.insertBefore(i, n);
            const r = i.querySelector("ol"),
                s = r.querySelector("li").cloneNode(!0);
            for (; r.firstChild;) r.removeChild(r.firstChild);
            const a = s.querySelector("div");
            a.classList.remove("bg-token-sidebar-surface-secondary");
            a.classList.add("hover:bg-token-sidebar-surface-secondary");
            e.forEach(({
                id: e,
                name: t
            }) => {
                const n = s.cloneNode(!0),
                    i = n.querySelector("div a");
                i.textContent = t;
                i.style.overflow = "hidden";
                i.style.textOverflow = "ellipsis";
                i.style.whiteSpace = "nowrap";
                i.insertAdjacentHTML("afterend", DIV_gradient);
                i.href = `/c/${e}`;
                const a = n.querySelector("button");
                a && a.remove();
                const o = document.createElement("button"),
                    c = "flex items-center justify-center text-token-text-primary transition hover:text-token-text-secondary radix-state-open:text-token-text-secondary juice:text-token-text-secondary juice:hover:text-token-text-primary hidden group-hover:flex".split(" ");
                o.classList.add(...c);
                i.parentElement.lastElementChild.appendChild(o);
                o.title = chrome.i18n.getMessage("unpin");
                o.innerHTML = `${SVG_unpin} Pinned`; // Update button text
                o.onclick = async () => {
                    await this.dbService.unpinChat(e);
                    this.bindPinUnpinCurrentChatButton();
                };
                r.appendChild(n);
            });
            0 === e.length && r.insertAdjacentHTML("beforeend", LI_noPinnedChats);
        }));
    }
    bindCloseModal() {
        document.addEventListener("click", (e => {
            if (e.target.closest("#" + dialogCloseID) || e.target.id === overlayBackdropID) {
                const e = document.querySelector("#" + modalID);
                e && e.remove();
            }
        }), !0);
    }
}

class DBService {
    static PINNED_CHATS_KEY = "PinGPTChat-pinned-chats";
    constructor() {}
    async getPinnedChats() {
        return (await chrome.storage.sync.get(DBService.PINNED_CHATS_KEY))[DBService.PINNED_CHATS_KEY] || [];
    }
    setPinnedChats(e) {
        const t = {
            [DBService.PINNED_CHATS_KEY]: e
        };
        chrome.storage.sync.set(t);
    }
    async isPinned(e) {
        return (await this.getPinnedChats()).some((t => t.id === e));
    }
    async pinChat(e, t) {
        const n = [...await this.getPinnedChats(), {
            id: e,
            name: t
        }];
        this.setPinnedChats(n);
    }
    async unpinChat(e) {
        const t = (await this.getPinnedChats()).filter((t => t.id !== e));
        this.setPinnedChats(t);
    }
    async toggleChatPin(e, t) {
        const n = await this.isPinned(e);
        return await (n ? this.unpinChat(e) : this.pinChat(e, t));
    }
    setOnChangedCallback(e) {
        chrome.storage.sync.onChanged.addListener(e);
    }
}

const dbService = new DBService,
    uiService = new UIService(dbService);
uiService.init();
dbService.setOnChangedCallback((() => {
    uiService.updatePinnedChats();
    setTimeout((() => uiService.updatePinnedChats()), 1e3);
    setTimeout((() => uiService.updatePinnedChats()), 4e3);
}));

new MutationObserver(((e, t) => {
    const n = document.getElementById(UIService.PREFIX + "pinnedChats"),
        i = document.querySelector(".sticky"),
        r = document.querySelector("nav")?.querySelector("h3");
    !n && i && r && (uiService.attachToSidebar(), uiService.updatePinnedChats());
})).observe(document.body, {
    childList: !0,
    subtree: !0
});

new MutationObserver(((e, t) => {
    e.forEach((e => {
        e.addedNodes.forEach((e => {
            e?.querySelector && e.querySelector('img[alt="User"]') && uiService.bindPinUnpinCurrentChatButton();
        }));
    }));
})).observe(document.body, {
    childList: !0,
    subtree: !0
});
