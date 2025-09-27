// ==UserScript==
// @name         ClickUp Enhancer
// @namespace    https://github.com/morloka8/clickup-enhancer
// @version      1.6.7
// @description  Hyperkey-Shortcuts für ClickUp (Ctrl+Cmd+Alt+Shift).
//               E  – Complete          | D  – Due Today
//               T  – Tags              | M  – Move
//               A  – Assignee          | 
//               P  – Planning          | 1/2/3 – Rating
//               0  – Rating löschen    | ⌫  – Delete Task
//               ↵  – Erste Row öffnen  | F  – Sidebar ⇄ Fullscreen
// @match        https://app.clickup.com/*
// @author       morloka8
// @license      MIT
// @homepageURL  https://github.com/morloka8/clickup-enhancer
// @supportURL   https://github.com/morloka8/clickup-enhancer/issues
// @grant        none
// ==/UserScript==


(function () {
    'use strict';
    console.log('ClickUp Shortcuts v1.6.6 geladen.');

    /* -------------------------------------------------- *
     *  Störende Elemente verstecken                      *
     * -------------------------------------------------- */
    const hideElement = (selector) => {
        const el = document.querySelector(selector);
        if (el) el.style.display = 'none';
    };

    hideElement('cu-activity-monitor-display-deferred');

    // ✅ NEU: CSS mit !important nur für /inbox injizieren (und bei SPA-Routenwechsel nachziehen) ENTFERNTnMotivational Quote und ClickUp Tipps in Inbox
    const STYLE_ID = 'tm-clickup-inbox-hider';
    const INBOX_CSS = `
        /* Nur die gewünschten Teile des Empty-States ausblenden */
        cu3-empty-state-text .cu3-empty-state-text__division,
        cu3-empty-state-text .cu3-empty-state-text__lower {
            display: none !important;
        }
    `;

    const onInbox = () => location.href.includes('/inbox');

    const ensureStyle = () => {
        let style = document.getElementById(STYLE_ID);
        if (onInbox()) {
            if (!style) {
                style = document.createElement('style');
                style.id = STYLE_ID;
                style.type = 'text/css';
                style.appendChild(document.createTextNode(INBOX_CSS));
                document.head.appendChild(style);
                // console.log('Inbox-Hider-CSS injiziert.');
            }
        } else if (style) {
            style.remove();
            // console.log('Inbox-Hider-CSS entfernt (nicht auf /inbox).');
        }
    };

    // initial
    ensureStyle();

    // reagiere auf SPA-Navigation (URL-Änderung)
    let lastHref = location.href;
    setInterval(() => {
        if (location.href !== lastHref) {
            lastHref = location.href;
            ensureStyle();
        }
    }, 300);

    // falls Head neu geschrieben wird, CSS wieder einfügen
    const headObserver = new MutationObserver(() => ensureStyle());
    headObserver.observe(document.documentElement, { childList: true, subtree: true });

    // vorhandener Observer bleibt für andere Hider bestehen
    const observer = new MutationObserver(() => {
        hideElement('cu-activity-monitor-display-deferred');
    });
    observer.observe(document.body, { childList: true, subtree: true });

    /* -------------------------------------------------- *
     *  Hilfsfunktionen                                   *
     * -------------------------------------------------- */
    const sendEscape = () => {
        ['keydown', 'keyup'].forEach(type =>
            document.dispatchEvent(
                new KeyboardEvent(type, {
                    key: 'Escape',
                    code: 'Escape',
                    keyCode: 27,
                    which: 27,
                    bubbles: true,
                })
            )
        );
        console.log('🔒 Escape gesendet, Overlay sollte zu sein.');
    };

    const sleep = (ms) => new Promise(r => setTimeout(r, ms));

    const waitFor = async (selector, { timeout = 2000, interval = 75 } = {}) => {
        const start = Date.now();
        while (Date.now() - start < timeout) {
            const el = document.querySelector(selector);
            if (el) return el;
            await sleep(interval);
        }
        return null;
    };

    const openLayoutSwitcher = (cb) => {
        const toggle = document.querySelector(
            'cu-task-view-layout-switcher .cu-dropdown__toggle'
        );
        if (!toggle) { console.warn('⚠️ Layout-Switcher-Toggle nicht gefunden.'); return; }
        toggle.click();
        setTimeout(cb, 150);
    };

    const toggleSidebarFullscreen = () => {
        openLayoutSwitcher(() => {
            const sidebarBtn    = document.querySelector('button[data-test="task-view-header__layouts-sidebar"]');
            const fullscreenBtn = document.querySelector('button[data-test="task-view-header__layouts-fullscreen"]');
            if (!sidebarBtn || !fullscreenBtn) {
                console.warn('⚠️ Layout-Buttons nicht gefunden.');
                return;
            }

            if (sidebarBtn.disabled) {
                fullscreenBtn.click();           // Sidebar → Fullscreen
                console.log('🖥️  Fullscreen aktiviert.');
            } else {
                sidebarBtn.click();              // Fullscreen → Sidebar
                console.log('📑 Sidebar aktiviert.');
            }

            setTimeout(sendEscape, 120);
        });
    };

    /* -------------------------------------------------- *
     *  Globaler Hyperkey-Handler                         *
     * -------------------------------------------------- */
    document.addEventListener('keydown', async (e) => {
        if (!(e.ctrlKey && e.metaKey && e.altKey && e.shiftKey)) return;
        e.preventDefault();

        switch (e.code) {
            /* ------------- NEU / geändert ---------------- */
            case 'KeyF':
                toggleSidebarFullscreen();
                return;

            case 'KeyM': { /* Move – neues UI: erst Settings, dann Move */
                try {
                    // 1) Settings öffnen
                    const settingsBtn =
                        document.querySelector('button[data-test="task-view-header__task-settings"]');
                    if (!settingsBtn) {
                        console.warn('⚠️ Settings-Button nicht gefunden.');
                        return;
                    }
                    settingsBtn.click();

                    // 2) Auf Menü warten und "Move" finden
                    let moveBtn = await waitFor('button[data-test="dropdown-list-item__cu-task-view-menu-move"]', { timeout: 2000 });

                    if (!moveBtn) {
                        // Fallback: nach Text "Move" / "Verschieben" suchen
                        const candidates = [...document.querySelectorAll('.cu-dropdown-list-item__link-container button, .cu-dropdown-list-item__link-container, .cu-dropdown-list-item button, .cu-dropdown-list-item__link')];
                        moveBtn = candidates.find(el => /(^|\s)(move|verschieben)(\s|$)/i.test(el.textContent || '')) || null;
                    }

                    if (!moveBtn) {
                        console.warn('⚠️ Move-Menüpunkt nicht gefunden.');
                        return;
                    }

                    moveBtn.click();
                    console.log('📦 Move geöffnet.');
                } catch (err) {
                    console.warn('⚠️ Fehler bei Move:', err);
                }
                return;
            }

            /* ------------- bestehende Shortcuts ---------- */
            case 'KeyE': { /* Complete */
                const btn = document.querySelector('button[data-test="status-button__checkmark"]');
                btn && !btn.disabled ? btn.click()
                                     : console.warn('⚠️ Complete-Button nicht gefunden/deaktiviert.');
                return;
            }

            case 'KeyD': { /* Due Today */
                const t = document.querySelector('.cu-task-hero-section-dates-lazy__toggle') ||
                          document.querySelector('cu-recurring-date-dropdown[cupendoid="quick-create-task-due-date"] .cu-dropdown__toggle');
                if (!t) { console.warn('⚠️ Due-Date-Toggle nicht gefunden.'); return; }
                t.click();
                setTimeout(() => {
                    document.querySelector('button[data-test="date-picker__today"]')?.click();
                    setTimeout(() => {
                        document.querySelector('button[data-test="date-picker__apply"]')?.click();
                    }, 500);
                }, 500);
                return;
            }

            case 'KeyT': { /* Tags */
                const t = document.querySelector('cu-task-hero-section-tags-field [data-test="dropdown__toggle"]');
                t ? t.click() : console.warn('⚠️ Tag-Dropdown-Toggle nicht gefunden.');
                return;
            }

            case 'KeyA': { /* Assignee */
                const active = document.activeElement;
                if (active?.isContentEditable && active.closest('[data-test="comment-bar__editor"]')) {
                    document.querySelector('[data-test="comment-bar__assign"]')?.click();
                    return;
                }
                const a = document.querySelector('[data-test="task-hero-section__assign-dropdown-toggle"] .cu-dropdown__toggle') ||
                          document.querySelector('[dropdowntogglelabel="Open assignees dropdown"] .cu-dropdown__toggle');
                a ? a.click() : console.warn('⚠️ Assignee-Dropdown nicht gefunden.');
                return;
            }


            case 'KeyP': { /* Planning-Status */
                const openToggle = () => {
                    const lbl = document.querySelector('[data-test="task-custom-fields__row-type-name__Backlog Status"]');
                    const row = lbl?.closest('[data-test="task-custom-fields__row"]');
                    const t   = row?.querySelector('cu-edit-task-dropdown-custom-field-value .cu-custom-fields__type-dropdown');
                    if (t) { t.click(); return true; }
                    return false;
                };
                if (openToggle()) return;
                const showBtn = document.querySelector('button[data-test="task-custom-fields__collapsed-button-show"]');
                if (showBtn) {
                    showBtn.click();
                    setTimeout(() => { if (!openToggle()) console.warn('⚠️ Planning-Dropdown nicht gefunden.'); }, 300);
                } else console.warn('⚠️ Planning-Label & Show-More nicht gefunden.');
                return;
            }

            case 'Digit1':
            case 'Digit2':
            case 'Digit3':
            case 'Digit0': { /* Rating */
                const idx   = { Digit1: 0, Digit2: 1, Digit3: 2 }[e.code];
                const clear = e.code === 'Digit0';

                const setRating = () => {
                    const lbl = document.querySelector('[data-test="task-custom-fields__row-type-name__Potential"]');
                    const row = lbl?.closest('[data-test="task-custom-fields__row"]');
                    if (!row) return false;
                    const items   = row.querySelectorAll('label.item');
                    const current = [...items].findIndex(l => l.querySelector('input[type="radio"]').checked);

                    if (clear) {
                        if (current === -1) return true;
                        row.querySelector('button[data-test="task-custom-fields__delete"]')?.click();
                        return true;
                    }

                    if (current === idx) return true;
                    const radio = items[idx]?.querySelector('input[type="radio"]');
                    if (!radio) return false;
                    radio.click();
                    radio.dispatchEvent(new Event('change', { bubbles: true }));
                    return true;
                };

                if (setRating()) return;
                document.querySelector('button[data-test="task-custom-fields__collapsed-button-show"]')?.click();
                setTimeout(() => { if (!setRating()) console.warn('⚠️ Rating-Feld nicht gefunden.'); }, 400);
                return;
            }

            case 'Backspace': { /* Task löschen */
                const menu = document.querySelector('button[data-test="task-view-header__task-settings"]');
                if (!menu) { console.warn('⚠️ Menü-Button nicht gefunden.'); return; }
                menu.click();
                setTimeout(() => {
                    const del = document.querySelector('button[data-test="dropdown-list-item__cu-task-view-menu-delete"]');
                    if (!del) { console.warn('⚠️ Delete-Menüpunkt fehlt.'); return; }
                    del.click();
                    setTimeout(() => {
                        document.querySelector('button[data-test="confirm-modal__button-yes"]')?.click() ||
                        [...document.querySelectorAll('button')]
                            .find(b => /delete|löschen/i.test(b.textContent || ''))?.click();
                    }, 500);
                }, 250);
                return;
            }

            case 'Enter': { /* Erste Task-Row öffnen */
                const row  = document.querySelector('cu-task-row');
                const link = row?.querySelector('a[data-test="task-row-main__link"]');
                if (!link) { console.warn('⚠️ Erste Task-Row nicht gefunden.'); return; }
                link.click();
                document.querySelector('span[data-test="move-task-conflict-modal__save-button"]')
                    ?.closest('button')?.click();
                return;
            }
        }
    });
})();
