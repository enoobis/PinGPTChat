/**
 * @file PinGPTChat - content.js
 * This script injects functionality into the ChatGPT web interface to allow
 * users to pin their favorite conversations to the top of the sidebar.
 */

// --- Constants and Configuration ---

// Pre-load all internationalization (i18n) strings to prevent race conditions on page load.
const i18n = {
    pinned: 'Pinned',
    noPinnedChats: 'No pinned chats',
    pin: 'Pin',
    unpin: 'Unpin'
};

try {
    i18n.pinned = chrome.i18n.getMessage("pinned") || 'Pinned';
    i18n.noPinnedChats = chrome.i18n.getMessage("noPinnedChats") || 'No pinned chats';
    i18n.pin = chrome.i18n.getMessage("pin") || 'Pin';
    i18n.unpin = chrome.i18n.getMessage("unpin") || 'Unpin';
} catch (e) {
    console.warn("PinGPTChat: Could not load i18n messages. Falling back to default English.", e);
}

// SVG icons for the pin/unpin buttons.
const SVG_unpin = '<svg class="h-5 w-5 shrink-0" width="24" height="24" style="vertical-align: middle;fill: currentColor;overflow: hidden;" viewBox="125 125 774 774" version="1.1" xmlns="http://www.w3.org/2000/svg"><path d="M631.637333 178.432a64 64 0 0 1 19.84 13.504l167.616 167.786667a64 64 0 0 1-19.370666 103.744l-59.392 26.304-111.424 111.552-8.832 122.709333a64 64 0 0 1-109.098667 40.64l-108.202667-108.309333-184.384 185.237333-45.354666-45.162667 184.490666-185.344-111.936-112.021333a64 64 0 0 1 40.512-109.056l126.208-9.429333 109.44-109.568 25.706667-59.306667a64 64 0 0 1 84.181333-33.28z m-25.450666 58.730667l-30.549334 70.464-134.826666 135.04-149.973334 11.157333 265.408 265.6 10.538667-146.474667 136.704-136.874666 70.336-31.146667-167.637333-167.765333z"  /><path style="fill: currentColor; stroke: currentColor; stroke-width: 40px;" d="M 314.43 222.675 L 774.686 700.69 L 314.43 222.675 Z"/></svg>';
const SVG_pin = '<svg class="h-5 w-5 shrink-0" style="vertical-align: middle;fill: currentColor;overflow: hidden;" viewBox="125 125 774 774" version="1.1" xmlns="http://www.w3.org/2000/svg"><path d="M631.637333 178.432a64 64 0 0 1 19.84 13.504l167.616 167.786667a64 64 0 0 1-19.370666 103.744l-59.392 26.304-111.424 111.552-8.832 122.709333a64 64 0 0 1-109.098667 40.64l-108.202667-108.309333-184.384 185.237333-45.354666-45.162667 184.490666-185.344-111.936-112.021333a64 64 0 0 1 40.512-109.056l126.208-9.429333 109.44-109.568 25.706667-59.306667a64 64 0 0 1 84.181333-33.28z m-25.450666 58.730667l-30.549334 70.464-134.826666 135.04-149.973334 11.157333 265.408 265.6 10.538667-146.474667 136.704-136.874666 70.336-31.146667-167.637333-167.765333z"  /></svg>';

const DIV_noPinnedChats = `<div class="group relative rounded-lg active:opacity-90">
    <span class="flex items-center gap-2 p-2 text-sm text-token-text-tertiary">${i18n.noPinnedChats}</span>
  </div>`;


/**
 * Manages all interactions with the DOM.
 */
class UIService {
    static PREFIX = "PinGPTChat";
    constructor(dbService) {
        this.dbService = dbService;
        this.menuSectionTemplate = null;
        this.menuSectionsContainer = null;
    }

    init() {
        this.observeForPopups();
    }

    attachToSidebar() {
        this.bindPinnedList();
        this.updatePinnedChats();
    }

    /**
     * Finds the chat history section and clones it to use as a template.
     * Crucially, it sets the container to `div#history` for correct placement.
     */
    async bindPinnedList() {
        // Find the specific container for the chat lists.
        const historyContainer = document.getElementById('history');
        if (!historyContainer) return;
        this.menuSectionsContainer = historyContainer;

        // Find a chat section within that container to use as a template.
        const firstSection = historyContainer.querySelector("aside:has(a[href*='/c/'])");
        if (!firstSection) return;
        this.menuSectionTemplate = firstSection.cloneNode(true);
    }

    /**
     * Watches for the three-dots menu appearing anywhere on the page.
     */
    observeForPopups() {
        new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node instanceof HTMLElement && node.hasAttribute("data-radix-popper-content-wrapper")) {
                        this.insertPinUnpinButton(node);
                    }
                });
            });
        }).observe(document.body, { childList: true, subtree: true });
    }
    
    /**
     * Injects the "Pin"/"Unpin" button into a newly appeared menu.
     * @param {HTMLElement} popperElement - The wrapper element for the menu popup.
     */
    async insertPinUnpinButton(popperElement) {
        const menu = popperElement.querySelector('[role="menu"]');
        if (!menu || menu.querySelector(".pingpt-button")) return;

        const menuId = menu.id;
        if (!menuId) return;

        const triggerButton = document.querySelector(`button[aria-controls="${menuId}"]`);
        if (!triggerButton) return;

        const chatLinkElement = triggerButton.closest("a[href*='/c/']");
        if (!chatLinkElement) return;

        const chatId = chatLinkElement.href.split('/c/').pop();
        const chatName = chatLinkElement.querySelector('.truncate')?.textContent;
        if (!chatId || !chatName) return;

        const templateItem = menu.querySelector('[role="menuitem"]');
        if (!templateItem) return;

        const pinButton = templateItem.cloneNode(true);
        pinButton.classList.add("pingpt-button");
        
        const iconDiv = document.createElement("div");
        iconDiv.className = "flex items-center justify-center text-token-text-secondary h-5 w-5";
        
        const textSpan = document.createElement('span');
        pinButton.innerHTML = '';
        pinButton.appendChild(iconDiv);
        pinButton.appendChild(textSpan);

        const separator = document.createElement('div');
        separator.setAttribute('role', 'separator');
        separator.className = menu.querySelector('[role="separator"]')?.className || '';
        
        menu.appendChild(separator);
        menu.appendChild(pinButton);
        
        const isPinned = await this.dbService.isPinned(chatId);
        textSpan.textContent = isPinned ? i18n.unpin : i18n.pin;
        iconDiv.innerHTML = isPinned ? SVG_unpin : SVG_pin;
        
        pinButton.onclick = async (event) => {
            event.stopPropagation();
            await this.dbService.toggleChatPin(chatId, chatName);
            triggerButton.click();
        };
    }

    /**
     * Renders the "Pinned" section in the sidebar.
     */
    updatePinnedChats() {
        this.dbService.getPinnedChats().then((pinnedChats) => {
            document.getElementById(UIService.PREFIX + "pinnedChats")?.remove();
            
            if (!this.menuSectionsContainer || !this.menuSectionTemplate) return;
    
            const pinnedSection = this.menuSectionTemplate.cloneNode(true);
            pinnedSection.id = UIService.PREFIX + "pinnedChats";
            
            const header = pinnedSection.querySelector("h2");
            if (header) header.textContent = i18n.pinned;
            
            const chatItemTemplate = pinnedSection.querySelector("a[href*='/c/']");
            pinnedSection.querySelectorAll("a[href*='/c/']").forEach(chat => chat.remove());
    
            // **PLACEMENT FIX:** Insert into the `div#history` container, not the whole nav.
            this.menuSectionsContainer.insertBefore(pinnedSection, this.menuSectionsContainer.firstChild);
    
            if (pinnedChats.length === 0) {
                pinnedSection.insertAdjacentHTML("beforeend", DIV_noPinnedChats);
                return;
            }
    
            if (!chatItemTemplate) {
                pinnedSection.insertAdjacentHTML("beforeend", DIV_noPinnedChats);
                return;
            }
    
            pinnedChats.forEach(({ id, name }) => {
                const newItem = chatItemTemplate.cloneNode(true);
                newItem.href = `/c/${id}`;
                newItem.removeAttribute("data-active");
                
                const textContainer = newItem.querySelector(".truncate");
                if (textContainer) textContainer.textContent = name;
    
                const trailingContainer = newItem.querySelector(".trailing");
                if (trailingContainer) {
                    trailingContainer.innerHTML = '';
                    const unpinButton = document.createElement("button");
                    unpinButton.className = "__menu-item-trailing-btn";
                    unpinButton.title = i18n.unpin;
                    unpinButton.innerHTML = SVG_unpin;
                    
                    unpinButton.onclick = async (event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        await this.dbService.unpinChat(id);
                    };
                    
                    trailingContainer.appendChild(unpinButton);
                }
                
                pinnedSection.appendChild(newItem);
            });
        });
    }
}

/**
 * Manages data storage using chrome.storage.sync.
 */
class DBService {
    static PINNED_CHATS_KEY = "PinGPTChat-pinned-chats";
    async getPinnedChats() {
        const result = await chrome.storage.sync.get(DBService.PINNED_CHATS_KEY);
        return result[DBService.PINNED_CHATS_KEY] || [];
    }
    setPinnedChats(chats) {
        chrome.storage.sync.set({ [DBService.PINNED_CHATS_KEY]: chats });
    }
    async isPinned(id) {
        const chats = await this.getPinnedChats();
        return chats.some(chat => chat.id === id);
    }
    async pinChat(id, name) {
        const chats = await this.getPinnedChats();
        this.setPinnedChats([{ id, name }, ...chats]);
    }
    async unpinChat(id) {
        const chats = await this.getPinnedChats();
        this.setPinnedChats(chats.filter(chat => chat.id !== id));
    }
    async toggleChatPin(id, name) {
        (await this.isPinned(id)) ? this.unpinChat(id) : this.pinChat(id, name);
    }
    setOnChangedCallback(callback) {
        chrome.storage.sync.onChanged.addListener(callback);
    }
}

// --- Main Execution ---

const dbService = new DBService();
const uiService = new UIService(dbService);
uiService.init();

dbService.setOnChangedCallback(() => {
    if (uiService.menuSectionsContainer) {
        uiService.updatePinnedChats();
    }
});

const sidebarObserver = new MutationObserver(() => {
    // We only need to find the `div#history` to know the sidebar is ready.
    const historyDiv = document.getElementById('history');
    if (historyDiv) {
        if (!uiService.menuSectionsContainer) {
            uiService.attachToSidebar();
        }
    }
});

sidebarObserver.observe(document.body, {
    childList: true,
    subtree: true
});