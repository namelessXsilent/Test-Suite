/* ============================================================================
 * AI Payload Library — client-side, ported from injector.py and extended.
 * Built-in payloads come from window.PAYLOAD_DB (payload-data.js). Users can:
 *   • create named custom collections (stored under store.collections)
 *   • add payloads to ANY collection (built-in additions stored under
 *     store.additions[cat]); additions and custom collections are deletable,
 *     built-in payloads are read-only.
 * Everything persists per-browser in localStorage.
 * ==========================================================================*/
(function () {
  "use strict";

  const DB = window.PAYLOAD_DB || { payloads: {}, icons: {}, aiCategories: [] };
  const BUILTIN = DB.payloads, ICONS = DB.icons, AI_CATEGORIES = DB.aiCategories;
  const STORE_KEY = "clipboardInjectorStore_v2";
  const OLD_KEY = "clipboardInjectorCustom";

  const els = {
    tree: document.getElementById("tree"),
    panel: document.getElementById("panel"),
    status: document.getElementById("status"),
    search: document.getElementById("search"),
    addBtn: document.getElementById("addBtn"),
    clearBtn: document.getElementById("clearBtn"),
    exportBtn: document.getElementById("exportBtn"),
    importBtn: document.getElementById("importBtn"),
    importFile: document.getElementById("importFile"),
    infoBtn: document.getElementById("infoBtn"),
    infoOverlay: document.getElementById("infoOverlay"),
    infoClose: document.getElementById("infoClose"),
    overlay: document.getElementById("modalOverlay"),
    modalTitle: document.getElementById("modalTitle"),
    modalName: document.getElementById("modalName"),
    modalNameLabel: document.getElementById("modalNameLabel"),
    modalContent: document.getElementById("modalContent"),
    modalContentWrap: document.getElementById("modalContentWrap"),
    modalCancel: document.getElementById("modalCancel"),
    modalSave: document.getElementById("modalSave"),
    confirmOverlay: document.getElementById("confirmOverlay"),
    confirmTitle: document.getElementById("confirmTitle"),
    confirmMsg: document.getElementById("confirmMsg"),
    confirmCancel: document.getElementById("confirmCancel"),
    confirmOk: document.getElementById("confirmOk"),
  };

  let currentCat = null, aiCollapsed = false;

  const TRASH_SVG = '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" ' +
    'stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<path d="M3 6h18"/><path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2"/>' +
    '<path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v5"/><path d="M14 11v5"/></svg>';

  const PENCIL_SVG = '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" ' +
    'stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/></svg>';

  /* ── Store (collections + built-in additions) ───────────────────────── */
  function loadStore() {
    let base = null;
    try {
      const s = JSON.parse(localStorage.getItem(STORE_KEY));
      if (s && s.collections && s.additions) base = s;
    } catch (e) { /* ignore */ }
    if (!base) {
      base = { collections: {}, additions: {} };
      try {                                          // migrate the old flat "Custom" list
        const old = JSON.parse(localStorage.getItem(OLD_KEY));
        if (old && Object.keys(old).length) base.collections["Custom"] = old;
      } catch (e) { /* ignore */ }
    }
    if (!base.overrides) base.overrides = {};        // edits applied to built-in defaults
    return base;
  }
  let store = loadStore();
  function saveStore() { localStorage.setItem(STORE_KEY, JSON.stringify(store)); }

  const isBuiltin = cat => Object.prototype.hasOwnProperty.call(BUILTIN, cat);
  const isCustomCollection = cat => Object.prototype.hasOwnProperty.call(store.collections, cat);
  const iconFor = cat => ICONS[cat] || (isCustomCollection(cat) ? "📁" : "📦");

  // Ordered entries for a category. Every entry is editable; built-in defaults
  // aren't deletable. `key` is the original storage key; `name`/`payload` reflect
  // any user edit (built-in edits are kept as overrides).
  function entriesFor(cat) {
    const out = [];
    if (isBuiltin(cat)) {
      const b = BUILTIN[cat] || {}, ov = store.overrides[cat] || {};
      Object.keys(b).forEach(orig => {
        const o = ov[orig];
        out.push({ origin: "builtin", cat, key: orig, name: o ? o.name : orig, payload: o ? o.payload : b[orig], deletable: false, editable: true });
      });
      const a = store.additions[cat] || {};
      Object.keys(a).forEach(n => out.push({ origin: "addition", cat, key: n, name: n, payload: a[n], deletable: true, editable: true }));
    } else if (isCustomCollection(cat)) {
      const c = store.collections[cat] || {};
      Object.keys(c).forEach(n => out.push({ origin: "collection", cat, key: n, name: n, payload: c[n], deletable: true, editable: true }));
    }
    return out;
  }
  const countFor = cat => entriesFor(cat).length;

  function addPayload(cat, name, content) {
    if (isCustomCollection(cat)) store.collections[cat][name] = content;
    else (store.additions[cat] = store.additions[cat] || {})[name] = content;
    saveStore();
  }
  function deletePayload(cat, name) {
    if (isCustomCollection(cat) && store.collections[cat]) delete store.collections[cat][name];
    else if (store.additions[cat]) {
      delete store.additions[cat][name];
      if (!Object.keys(store.additions[cat]).length) delete store.additions[cat];
    }
    saveStore();
  }
  function addCollection(name) { if (!store.collections[name]) store.collections[name] = {}; saveStore(); }
  function deleteCollection(name) { delete store.collections[name]; saveStore(); }

  // Edit a single payload. Built-in defaults are stored as overrides keyed by
  // their original name; additions/collection payloads update (and may rename) in place.
  function editEntry(entry, newName, newContent) {
    if (entry.origin === "builtin") {
      (store.overrides[entry.cat] = store.overrides[entry.cat] || {})[entry.key] = { name: newName, payload: newContent };
    } else {
      const map = entry.origin === "addition"
        ? (store.additions[entry.cat] = store.additions[entry.cat] || {})
        : store.collections[entry.cat];
      if (newName !== entry.key) delete map[entry.key];
      map[newName] = newContent;
    }
    saveStore();
  }
  // Rename a custom collection, preserving order. Returns false on a name clash.
  function renameCollection(oldName, newName) {
    if (newName === oldName) return true;
    if (isBuiltin(newName) || isCustomCollection(newName)) return false;
    const rebuilt = {};
    Object.keys(store.collections).forEach(k => { rebuilt[k === oldName ? newName : k] = store.collections[k]; });
    store.collections = rebuilt;
    if (currentCat === oldName) currentCat = newName;
    saveStore();
    return true;
  }

  const charLen = s => Array.from(s).length;

  /* ── Clipboard ──────────────────────────────────────────────────────── */
  async function copyText(text) {
    try { if (navigator.clipboard && window.isSecureContext) { await navigator.clipboard.writeText(text); return true; } } catch (e) { /* fall through */ }
    try {
      const ta = document.createElement("textarea");
      ta.value = text; ta.style.position = "fixed"; ta.style.top = "-1000px"; ta.style.opacity = "0";
      document.body.appendChild(ta); ta.focus(); ta.select();
      const ok = document.execCommand("copy"); document.body.removeChild(ta); return ok;
    } catch (e) { return false; }
  }
  function setStatus(text, color) { els.status.textContent = text; els.status.style.color = color || ""; }

  /* ── Cards ──────────────────────────────────────────────────────────── */
  function makeCard(opts) {
    const { displayName, payload, editable, deletable, onEdit, onDelete } = opts;
    const card = document.createElement("div");
    card.className = "pl-card";

    const head = document.createElement("div");
    head.className = "pl-card-head";
    const name = document.createElement("div");
    name.className = "pl-card-name"; name.textContent = displayName;
    head.appendChild(name);

    if (editable) {
      const edit = document.createElement("button");
      edit.className = "pl-card-icon pl-edit-btn"; edit.innerHTML = PENCIL_SVG;
      edit.title = "Edit this payload"; edit.setAttribute("aria-label", "Edit this payload");
      edit.addEventListener("click", onEdit);
      head.appendChild(edit);
    }
    if (deletable) {
      const del = document.createElement("button");
      del.className = "pl-card-icon pl-del-btn"; del.innerHTML = TRASH_SVG;
      del.title = "Delete this payload"; del.setAttribute("aria-label", "Delete this payload");
      del.addEventListener("click", onDelete);
      head.appendChild(del);
    }

    const copyBtn = document.createElement("button");
    copyBtn.className = "pl-copy-btn"; copyBtn.textContent = "📋 Copy";
    copyBtn.addEventListener("click", async () => {
      const ok = await copyText(payload);
      if (ok) {
        setStatus("✓ Copied '" + displayName + "' — " + charLen(payload).toLocaleString() + " characters on clipboard");
        copyBtn.textContent = "✓ Copied!"; copyBtn.classList.add("copied");
        setTimeout(() => { copyBtn.textContent = "📋 Copy"; copyBtn.classList.remove("copied"); }, 1200);
      } else setStatus("⚠ Copy failed — your browser blocked clipboard access.", "var(--pl-danger)");
    });
    head.appendChild(copyBtn);
    card.appendChild(head);

    const pre = document.createElement("pre");
    pre.className = "pl-preview";
    const len = charLen(payload);
    pre.textContent = len > 500
      ? Array.from(payload).slice(0, 500).join("") + "\n\n... [truncated — full length: " + len.toLocaleString() + " chars]"
      : payload;
    card.appendChild(pre);
    return card;
  }

  /* ── Panels ─────────────────────────────────────────────────────────── */
  function renderCategory(cat) {
    els.panel.innerHTML = "";
    const custom = isCustomCollection(cat);

    const head = document.createElement("div");
    head.className = "pl-panel-head";
    const title = document.createElement("div");
    title.className = "pl-panel-title"; title.textContent = iconFor(cat) + "  " + cat;
    head.appendChild(title);

    if (custom) {                                    // rename pencil for user-generated collections
      const editCol = document.createElement("button");
      editCol.className = "pl-title-edit"; editCol.innerHTML = PENCIL_SVG;
      editCol.title = "Rename this collection"; editCol.setAttribute("aria-label", "Rename this collection");
      editCol.addEventListener("click", () => openEditCollection(cat));
      head.appendChild(editCol);
    }

    const actions = document.createElement("div");
    actions.className = "pl-panel-actions";
    const addBtn = document.createElement("button");
    addBtn.className = "pl-icon-btn"; addBtn.textContent = "+"; addBtn.title = "Add a payload to this collection";
    addBtn.addEventListener("click", () => openAddPayload(cat));
    actions.appendChild(addBtn);
    head.appendChild(actions);
    els.panel.appendChild(head);

    const items = entriesFor(cat);
    const sub = document.createElement("div");
    sub.className = "pl-panel-sub";
    sub.textContent = items.length + " payload(s) — click Copy to load onto the clipboard"
      + (custom ? " · custom collection" : "");
    els.panel.appendChild(sub);

    items.forEach(e => els.panel.appendChild(makeCard({
      displayName: e.name, payload: e.payload, editable: e.editable, deletable: e.deletable,
      onEdit: () => openEditPayload(e),
      onDelete: () => confirmDeletePayload(e.cat, e.key, () => renderCategory(cat)),
    })));
    els.panel.scrollTop = 0;
  }

  function renderSearch(query) {
    const q = query.toLowerCase();
    els.panel.innerHTML = "";
    const title = document.createElement("div");
    title.className = "pl-panel-title"; title.textContent = "🔍  Search Results";
    els.panel.appendChild(title);
    const sub = document.createElement("div");
    sub.className = "pl-panel-sub"; els.panel.appendChild(sub);

    let count = 0;
    allCategories().forEach(category => {
      entriesFor(category).forEach(e => {
        if (e.name.toLowerCase().indexOf(q) !== -1 || e.payload.toLowerCase().indexOf(q) !== -1) {
          els.panel.appendChild(makeCard({
            displayName: "[" + category + "] " + e.name, payload: e.payload, editable: e.editable, deletable: e.deletable,
            onEdit: () => openEditPayload(e),
            onDelete: () => confirmDeletePayload(e.cat, e.key, () => renderSearch(query)),
          }));
          count++;
        }
      });
    });
    sub.textContent = count + " match(es) for '" + query + "'";
    els.panel.scrollTop = 0;
  }

  /* ── Sidebar tree ───────────────────────────────────────────────────── */
  function allCategories() {
    return Object.keys(BUILTIN).concat(Object.keys(store.collections));
  }

  function buildTree() {
    els.tree.innerHTML = "";
    // AI Agent Testing group
    const aiPresent = AI_CATEGORIES.filter(c => isBuiltin(c));
    if (aiPresent.length) {
      const aiTotal = aiPresent.reduce((n, c) => n + countFor(c), 0);
      const group = document.createElement("div");
      group.className = "tree-item group";
      group.textContent = (aiCollapsed ? "▶" : "▼") + "  🤖  AI Agent Testing  (" + aiTotal + ")";
      els.tree.appendChild(group);
      const wrap = document.createElement("div");
      wrap.className = "tree-children" + (aiCollapsed ? " collapsed" : "");
      aiPresent.forEach(cat => wrap.appendChild(makeTreeItem(cat, true)));
      els.tree.appendChild(wrap);
      group.addEventListener("click", () => {
        aiCollapsed = !aiCollapsed;
        wrap.classList.toggle("collapsed", aiCollapsed);
        group.textContent = (aiCollapsed ? "▶" : "▼") + "  🤖  AI Agent Testing  (" + aiTotal + ")";
      });
    }
    // Non-AI built-ins
    Object.keys(BUILTIN).forEach(cat => { if (AI_CATEGORIES.indexOf(cat) !== -1) return; els.tree.appendChild(makeTreeItem(cat, false)); });

    // User Generated section (always shown, marks where custom collections live)
    const divider = document.createElement("div"); divider.className = "tree-divider";
    els.tree.appendChild(divider);
    const heading = document.createElement("div"); heading.className = "tree-heading"; heading.textContent = "User Generated";
    els.tree.appendChild(heading);
    const cols = Object.keys(store.collections);
    if (cols.length) cols.forEach(cat => els.tree.appendChild(makeTreeItem(cat, false)));
    else { const empty = document.createElement("div"); empty.className = "tree-empty"; empty.textContent = "No collections yet — click “New collection”."; els.tree.appendChild(empty); }

    highlightSelected();
  }
  function makeTreeItem(cat, isChild) {
    const item = document.createElement("div");
    item.className = "tree-item" + (isChild ? " child" : "");
    item.dataset.cat = cat;
    const label = document.createElement("span");
    label.className = "tree-label";
    label.textContent = iconFor(cat) + "  " + cat + "  (" + countFor(cat) + ")";
    item.appendChild(label);
    if (isCustomCollection(cat)) {                 // custom collections deletable from the sidebar
      const del = document.createElement("button");
      del.className = "tree-del"; del.innerHTML = TRASH_SVG; del.title = "Delete this collection";
      del.setAttribute("aria-label", "Delete this collection");
      del.addEventListener("click", e => { e.stopPropagation(); confirmDeleteCollection(cat); });
      item.appendChild(del);
    }
    item.addEventListener("click", () => { els.search.value = ""; selectCategory(cat); });
    return item;
  }
  function highlightSelected() {
    els.tree.querySelectorAll(".tree-item[data-cat]").forEach(el => el.classList.toggle("selected", el.dataset.cat === currentCat));
  }
  function selectCategory(cat) { currentCat = cat; highlightSelected(); renderCategory(cat); }
  function selectFirstDefault() {
    const nonAi = Object.keys(BUILTIN).filter(c => AI_CATEGORIES.indexOf(c) === -1);
    if (nonAi.length) { selectCategory(nonAi[0]); return; }
    if (AI_CATEGORIES.filter(isBuiltin).length) selectCategory(AI_CATEGORIES.filter(isBuiltin)[0]);
  }

  /* ── Search box ─────────────────────────────────────────────────────── */
  els.search.addEventListener("input", () => {
    const q = els.search.value.trim();
    if (!q) { currentCat ? selectCategory(currentCat) : selectFirstDefault(); return; }
    renderSearch(q);
  });

  /* ── Themed confirm dialog ──────────────────────────────────────────── */
  let onConfirmOk = null;
  function showConfirm(opts) {
    els.confirmTitle.textContent = opts.title || "Are you sure?";
    els.confirmMsg.textContent = opts.message || "";
    els.confirmOk.textContent = opts.okLabel || "Delete";
    onConfirmOk = opts.onOk;
    els.confirmOverlay.classList.remove("hidden");
    els.confirmOk.focus();
  }
  function closeConfirm() { els.confirmOverlay.classList.add("hidden"); onConfirmOk = null; }
  els.confirmCancel.addEventListener("click", closeConfirm);
  els.confirmOverlay.addEventListener("click", e => { if (e.target === els.confirmOverlay) closeConfirm(); });
  els.confirmOk.addEventListener("click", () => { const fn = onConfirmOk; closeConfirm(); if (fn) fn(); });

  function confirmDeleteCollection(cat) {
    showConfirm({
      title: "Delete collection",
      message: "Delete the “" + cat + "” collection and all of its payloads? This can’t be undone.",
      onOk: () => {
        deleteCollection(cat); buildTree();
        if (currentCat === cat) selectFirstDefault();
        setStatus("Deleted collection '" + cat + "'.");
      },
    });
  }
  function confirmDeletePayload(cat, name, after) {
    showConfirm({
      title: "Delete payload",
      message: "Delete the payload “" + name + "”? This can’t be undone.",
      onOk: () => { deletePayload(cat, name); buildTree(); after(); setStatus("Deleted payload '" + name + "'."); },
    });
  }

  /* ── Modal (new collection / add payload) ───────────────────────────── */
  let onModalSave = null;
  function openModal(opts) {
    els.modalTitle.textContent = opts.title;
    els.modalNameLabel.textContent = opts.nameLabel || "Name";
    els.modalName.value = opts.nameValue || ""; els.modalName.placeholder = opts.namePlaceholder || "Name";
    els.modalContent.value = opts.contentValue || "";
    els.modalContentWrap.style.display = opts.showContent ? "block" : "none";
    onModalSave = opts.onSave;
    els.overlay.classList.remove("hidden"); els.modalName.focus();
  }
  function closeModal() { els.overlay.classList.add("hidden"); onModalSave = null; }

  function openNewCollection() {
    openModal({
      title: "New collection", nameLabel: "Collection name", namePlaceholder: "e.g. My SQLi set", showContent: false,
      onSave: name => {
        if (isBuiltin(name)) { alert("That name is used by a built-in collection — pick another."); return false; }
        addCollection(name); buildTree(); selectCategory(name);
        setStatus("Created collection '" + name + "'.");
      },
    });
  }
  function openAddPayload(cat) {
    openModal({
      title: "Add payload to " + cat, nameLabel: "Payload name", namePlaceholder: "e.g. My bypass", showContent: true,
      onSave: (name, content) => {
        addPayload(cat, name, content); buildTree();
        if (els.search.value.trim()) renderSearch(els.search.value.trim());
        else selectCategory(cat);
        setStatus("Added payload '" + name + "' to " + cat + ".");
      },
    });
  }
  function openEditPayload(entry) {
    openModal({
      title: "Edit payload", nameLabel: "Payload name", namePlaceholder: "Payload name", showContent: true,
      nameValue: entry.name, contentValue: entry.payload,
      onSave: (name, content) => {
        editEntry(entry, name, content); buildTree();
        if (els.search.value.trim()) renderSearch(els.search.value.trim());
        else selectCategory(entry.cat);
        setStatus("Updated payload '" + name + "'.");
      },
    });
  }
  function openEditCollection(cat) {
    openModal({
      title: "Rename collection", nameLabel: "Collection name", namePlaceholder: "Collection name", showContent: false,
      nameValue: cat,
      onSave: name => {
        if (renameCollection(cat, name) === false) { alert("That name is already used — pick another."); return false; }
        buildTree(); selectCategory(currentCat);
        setStatus("Renamed collection to '" + name + "'.");
      },
    });
  }

  els.addBtn.addEventListener("click", openNewCollection);
  els.modalCancel.addEventListener("click", closeModal);
  els.overlay.addEventListener("click", e => { if (e.target === els.overlay) closeModal(); });
  document.addEventListener("keydown", e => {
    if (e.key !== "Escape") return;
    if (!els.confirmOverlay.classList.contains("hidden")) closeConfirm();
    else if (!els.infoOverlay.classList.contains("hidden")) els.infoOverlay.classList.add("hidden");
    else if (!els.overlay.classList.contains("hidden")) closeModal();
  });
  els.modalSave.addEventListener("click", () => {
    const name = els.modalName.value.trim();
    if (!name) { els.modalName.focus(); return; }
    const content = els.modalContent.value;
    const fn = onModalSave;
    if (fn && fn(name, content) === false) return;   // validation kept the modal open
    closeModal();
  });
  // Enter in the name field saves when there's no content field (new collection).
  els.modalName.addEventListener("keydown", e => {
    if (e.key === "Enter" && els.modalContentWrap.style.display === "none") els.modalSave.click();
  });

  /* ── Clear clipboard ────────────────────────────────────────────────── */
  els.clearBtn.addEventListener("click", async () => {
    const ok = await copyText("");
    setStatus(ok ? "Clipboard cleared." : "⚠ Could not clear clipboard.", ok ? "" : "var(--pl-danger)");
  });

  /* ── Export / Import (user-generated data only) ─────────────────────── */
  function countStore() {
    const cols = Object.keys(store.collections).length;
    const adds = Object.values(store.additions).reduce((n, o) => n + Object.keys(o).length, 0);
    return { cols, adds };
  }
  els.exportBtn.addEventListener("click", () => {
    const { cols, adds } = countStore();
    if (!cols && !adds) { setStatus("Nothing to export yet — create a collection or add a payload first.", "var(--pl-danger)"); return; }
    const blob = new Blob([JSON.stringify(store, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "payload-collections.json";
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
    setStatus("Exported " + cols + " collection(s) and " + adds + " added payload(s).");
  });

  els.importBtn.addEventListener("click", () => els.importFile.click());
  els.importFile.addEventListener("change", () => {
    const file = els.importFile.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      els.importFile.value = "";                       // allow re-importing the same file
      let data;
      try { data = JSON.parse(reader.result); } catch (e) { setStatus("⚠ Import failed — that file isn't valid JSON.", "var(--pl-danger)"); return; }
      const added = mergeImported(data);
      if (added === null) { setStatus("⚠ Import failed — unrecognized file format.", "var(--pl-danger)"); return; }
      saveStore(); buildTree();
      if (els.search.value.trim()) renderSearch(els.search.value.trim());
      else if (currentCat) selectCategory(currentCat); else selectFirstDefault();
      setStatus("Imported " + added.cols + " collection(s) and " + added.adds + " payload(s).");
    };
    reader.readAsText(file);
  });

  // Merge an imported object into the store. Returns {cols, adds} or null if unrecognized.
  function mergeImported(data) {
    if (!data || typeof data !== "object") return null;
    let cols = 0, adds = 0;
    const hasStructure = (data.collections && typeof data.collections === "object")
                      || (data.additions && typeof data.additions === "object");
    if (hasStructure) {
      Object.keys(data.collections || {}).forEach(name => {
        const src = data.collections[name]; if (!src || typeof src !== "object") return;
        store.collections[name] = Object.assign({}, store.collections[name] || {}, src);
        cols++;
      });
      Object.keys(data.additions || {}).forEach(cat => {
        const src = data.additions[cat]; if (!src || typeof src !== "object") return;
        store.additions[cat] = Object.assign({}, store.additions[cat] || {}, src);
        adds += Object.keys(src).length;
      });
      return { cols, adds };
    }
    // Fallback: a flat { name: payload } object → import as a single collection.
    if (Object.values(data).every(v => typeof v === "string")) {
      store.collections["Imported"] = Object.assign({}, store.collections["Imported"] || {}, data);
      return { cols: 1, adds: 0 };
    }
    return null;
  }

  /* ── Info dialog ────────────────────────────────────────────────────── */
  els.infoBtn.addEventListener("click", () => els.infoOverlay.classList.remove("hidden"));
  els.infoClose.addEventListener("click", () => els.infoOverlay.classList.add("hidden"));
  els.infoOverlay.addEventListener("click", e => { if (e.target === els.infoOverlay) els.infoOverlay.classList.add("hidden"); });

  /* ── Boot ───────────────────────────────────────────────────────────── */
  buildTree();
  selectFirstDefault();
})();
