/* ========================================================
   PDV · Objetivos del Plan de Trabajo
   ======================================================== */

const STORAGE_KEY = 'pdv-objectives-v2';

const STATUS_OPTIONS = ['Planeado', 'En curso', 'Cumplido', 'Retrasado'];
const MAX_ROWS = 3;

/* ── Configuración de secciones ──────────────────────── */
const SECTIONS = {
    diagnostico: {
        label: 'Diagnóstico',
        emptyRow: () => ({
            cifrasTon: '', segmentacion: '', recursos: '',
            responsable: '', revisionFrecuencia: '', resultadoDiagnosticos: ''
        }),
        columns: [
            { field: 'cifrasTon',            label: 'CIFRAS TON',            type: 'text', width: 160 },
            { field: 'segmentacion',          label: 'Segmentación',          type: 'text', width: 140 },
            { field: 'recursos',              label: 'Recursos',              type: 'text', width: 140 },
            { field: 'responsable',           label: 'Responsable',           type: 'text', width: 130 },
            { field: 'revisionFrecuencia',    label: 'Revisión Frecuencia',   type: 'text', width: 150 },
            { field: 'resultadoDiagnosticos', label: 'Resultado diagnósticos',type: 'text', width: 200 },
        ]
    },
    areasOportunidad: {
        label: 'Áreas de oportunidad',
        emptyRow: () => ({
            accionDesarrollar: '', lineaCrecer: '', brecha: '', justificacion: ''
        }),
        columns: [
            { field: 'accionDesarrollar', label: 'Acción para desarrollar y capturar volumen y mantener', type: 'text', width: 280 },
            { field: 'lineaCrecer',       label: 'Línea a crecer',   type: 'text',   width: 150 },
            { field: 'brecha',            label: 'Brecha',           type: 'text',   width: 120 },
            { field: 'justificacion',     label: 'Justificación',    type: 'text',   width: 220 },
        ]
    },
    planAccion: {
        label: 'Plan de acción',
        emptyRow: () => ({
            accionesClaves: '', fechaFinal: '', estado: 'Planeado', resultado: ''
        }),
        columns: [
            { field: 'accionesClaves', label: 'Acciones claves',          type: 'text',   width: 240 },
            { field: 'fechaFinal',     label: 'Fecha final del objetivo', type: 'date',   width: 160 },
            { field: 'estado',         label: 'Estado',                   type: 'status', width: 140 },
            { field: 'resultado',      label: 'Resultado',                type: 'text',   width: 220 },
        ]
    }
};

/* ── Datos iniciales ─────────────────────────────────── */
function makeObjective(overrides = {}) {
    return {
        id: uid(),
        createdAt: new Date().toISOString(),
        title: 'Nuevo objetivo',
        leader: '',
        dueDate: '',
        status: 'Planeado',
        kpiValue: '',
        diagnostico: [],
        areasOportunidad: [],
        planAccion: [],
        ...overrides
    };
}

function defaultData() {
    return [
        makeObjective({
            createdAt: '2026-01-10T00:00:00',
            title: 'Reducir mortalidad acumulada a menos del 4 %',
            leader: 'Paula Restrepo', dueDate: '2026-03-31', status: 'En curso',
            kpiValue: '4.20 %',
            diagnostico: [SECTIONS.diagnostico.emptyRow()],
            areasOportunidad: [SECTIONS.areasOportunidad.emptyRow()],
            planAccion: [SECTIONS.planAccion.emptyRow()]
        }),
        makeObjective({
            createdAt: '2026-01-22T00:00:00',
            title: 'Mejorar conversión alimenticia a 1.78',
            leader: 'Andres Arias', dueDate: '2026-06-30', status: 'Cumplido',
            kpiValue: '1.79',
            diagnostico: [SECTIONS.diagnostico.emptyRow()],
            areasOportunidad: [SECTIONS.areasOportunidad.emptyRow()],
            planAccion: [SECTIONS.planAccion.emptyRow()]
        }),
        makeObjective({
            createdAt: '2026-02-05T00:00:00',
            title: 'Alcanzar VPI de 330 en el segundo semestre',
            leader: 'Carlos Mejia', dueDate: '2026-09-30', status: 'Planeado',
            kpiValue: '315',
            diagnostico: [SECTIONS.diagnostico.emptyRow()],
            areasOportunidad: [SECTIONS.areasOportunidad.emptyRow()],
            planAccion: [SECTIONS.planAccion.emptyRow()]
        }),
        makeObjective({
            createdAt: '2026-02-20T00:00:00',
            title: 'Implementar protocolo de bioseguridad nivel 3',
            leader: 'Laura Vargas', dueDate: '2026-11-30', status: 'Retrasado',
            kpiValue: '—',
            diagnostico: [SECTIONS.diagnostico.emptyRow()],
            areasOportunidad: [SECTIONS.areasOportunidad.emptyRow()],
            planAccion: [SECTIONS.planAccion.emptyRow()]
        })
    ];
}

/* ── Estado global ───────────────────────────────────── */
let state = [];
let currentFilter = 'all';
let isEditMode = false;
let openCards = new Set();
const debouncers = new WeakMap();

/* ── Utilidades ──────────────────────────────────────── */
function uid() { return crypto.randomUUID(); }

function esc(str) {
    return String(str ?? '')
        .replace(/&/g, '&amp;').replace(/</g, '&lt;')
        .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function getSemester(d) {
    if (!d) return null;
    return parseInt(d.split('-')[1], 10) <= 6 ? 'S1' : 'S2';
}

function formatDate(d) {
    if (!d) return '—';
    const dt = new Date(d + 'T00:00:00');
    if (isNaN(dt)) return d;
    return new Intl.DateTimeFormat('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }).format(dt);
}

function statusCls(s) {
    return ({ 'Planeado': 'status-planeado', 'En curso': 'status-en-curso', 'Cumplido': 'status-cumplido', 'Retrasado': 'status-retrasado' })[s] || 'status-planeado';
}

/* ── Persistencia ────────────────────────────────────── */
function loadState() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed) && parsed.length) return parsed;
        }
    } catch { /* ignore */ }
    return defaultData();
}

function persistState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

/* ── Filtrar y ordenar ───────────────────────────────── */
function getVisible() {
    return state
        .filter(o => currentFilter === 'all' || getSemester(o.dueDate) === currentFilter)
        .slice()
        .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
}

/* ══════════════════════════════════════════════════════
   RENDER
══════════════════════════════════════════════════════ */
function render() {
    const visible = getVisible();
    const listEl = document.getElementById('pdvList');
    const countEl = document.getElementById('pdvCount');

    const n = visible.length;
    countEl.textContent = `${n} objetivo${n !== 1 ? 's' : ''}`;

    if (!n) {
        listEl.innerHTML = `
            <div class="pdv-empty">
                <p>No hay objetivos para este filtro.</p>
                <button class="pdv-btn-primary" type="button" data-action="add">+ Nuevo objetivo</button>
            </div>`;
        listEl.querySelector('[data-action="add"]')?.addEventListener('click', addObjective);
        syncExpandAllBtn([]);
        return;
    }

    listEl.innerHTML = visible.map(renderCard).join('');

    visible.forEach(o => {
        if (openCards.has(o.id)) {
            const card = listEl.querySelector(`[data-id="${o.id}"]`);
            if (card) setCardOpen(card, true, false);
        }
    });

    syncExpandAllBtn(visible);
}

/* ── Tarjeta completa ────────────────────────────────── */
function renderCard(o) {
    const sem = getSemester(o.dueDate);
    const semTag = sem ? `<span class="sem-tag">${sem}</span>` : '';
    const kpiTag = o.kpiValue
        ? `<span class="obj-kpi-tag ${statusCls(o.status)}">${esc(o.kpiValue)}</span>`
        : '';
    return `
        <article class="obj-card" data-id="${esc(o.id)}" data-status="${esc(o.status)}" role="listitem">
            <button class="obj-header" type="button" aria-expanded="false">
                <span class="obj-chevron" aria-hidden="true"></span>
                <span class="obj-title-text">${esc(o.title || 'Sin título')}</span>
                <div class="obj-header-right">
                    ${kpiTag}
                    ${semTag}
                    <span class="obj-status-tag ${statusCls(o.status)}">${esc(o.status)}</span>
                    <span class="obj-date-tag">${formatDate(o.dueDate)}</span>
                </div>
            </button>
            <div class="obj-body" hidden>
                ${renderCardBody(o)}
            </div>
        </article>`;
}

function renderCardBody(o) {
    if (!isEditMode) {
        return `${renderMetaRead(o)}${renderAllSectionsRead(o)}`;
    }
    return `
        ${renderMetaEdit(o)}
        ${renderAllSections(o)}
        <div class="obj-card-footer">
            <button class="obj-delete-btn" type="button" data-action="delete" data-id="${esc(o.id)}">
                Eliminar objetivo
            </button>
        </div>`;
}

/* ── Vista lectura ───────────────────────────────────── */
function renderMetaRead(o) {
    return `
        <div class="obj-meta-read">
            <div class="meta-read-item">
                <span class="meta-label">Líder</span>
                <span class="meta-value">${esc(o.leader || '—')}</span>
            </div>
            <div class="meta-read-item">
                <span class="meta-label">Fecha objetivo</span>
                <span class="meta-value">${formatDate(o.dueDate)}</span>
            </div>
        </div>`;
}

function renderAllSectionsRead(o) {
    return `<div class="obj-sections">
        ${renderSectionTableRead(o, 'diagnostico')}
        ${renderSectionTableRead(o, 'areasOportunidad')}
        ${renderSectionTableRead(o, 'planAccion')}
    </div>`;
}

function renderSectionTableRead(o, sectionKey) {
    const cfg = SECTIONS[sectionKey];
    const row = (o[sectionKey] && o[sectionKey][0]) || cfg.emptyRow();

    const cells = cfg.columns.map(col => {
        let val;
        if (col.type === 'status') {
            val = `<span class="obj-status-tag ${statusCls(row[col.field])}">${esc(row[col.field] || '—')}</span>`;
        } else if (col.type === 'date') {
            val = `<span class="read-cell">${formatDate(row[col.field])}</span>`;
        } else {
            val = `<span class="read-cell">${esc(row[col.field] || '—')}</span>`;
        }
        return `<td data-label="${esc(col.label)}">${val}</td>`;
    }).join('');

    return `
        <div class="obj-section" data-section-key="${sectionKey}">
            <div class="section-top">
                <span class="section-label">${cfg.label}</span>
            </div>
            <div class="section-table-wrap">
                <table class="section-table">
                    <thead><tr>${cfg.columns.map(col =>
                        `<th style="min-width:${col.width}px">${col.label}</th>`
                    ).join('')}</tr></thead>
                    <tbody><tr>${cells}</tr></tbody>
                </table>
            </div>
        </div>`;
}

/* ── Meta editable ───────────────────────────────────── */
function renderMetaEdit(o) {
    const statusOpts = STATUS_OPTIONS.map(s =>
        `<option value="${s}" ${s === o.status ? 'selected' : ''}>${s}</option>`
    ).join('');
    return `
        <div class="obj-meta-edit">
            <div class="meta-field">
                <label class="meta-label">Título</label>
                <input class="meta-input" type="text" data-id="${esc(o.id)}" data-field="title" value="${esc(o.title || '')}" placeholder="Nombre del objetivo">
            </div>
            <div class="meta-field">
                <label class="meta-label">Líder</label>
                <input class="meta-input" type="text" data-id="${esc(o.id)}" data-field="leader" value="${esc(o.leader || '')}" placeholder="Responsable">
            </div>
            <div class="meta-field">
                <label class="meta-label">Fecha objetivo</label>
                <input class="meta-input" type="date" data-id="${esc(o.id)}" data-field="dueDate" value="${esc(o.dueDate || '')}">
            </div>
            <div class="meta-field">
                <label class="meta-label">Estado</label>
                <select class="meta-select" data-id="${esc(o.id)}" data-field="status">${statusOpts}</select>
            </div>
            <div class="meta-field">
                <label class="meta-label">KPI actual</label>
                <input class="meta-input" type="text" data-id="${esc(o.id)}" data-field="kpiValue" value="${esc(o.kpiValue || '')}" placeholder="Ej: 85 %, 1.79…">
            </div>
        </div>`;
}

/* ── Secciones (3 tablas apiladas) ───────────────────── */
function renderAllSections(o) {
    return `<div class="obj-sections">
        ${renderSectionTable(o, 'diagnostico')}
        ${renderSectionTable(o, 'areasOportunidad')}
        ${renderSectionTable(o, 'planAccion')}
    </div>`;
}

function renderSectionTable(o, sectionKey) {
    const cfg = SECTIONS[sectionKey];
    const row = (o[sectionKey] && o[sectionKey][0]) || cfg.emptyRow();
    const indicatorId = `${o.id}__${sectionKey}`;

    const theadCells = cfg.columns.map(col =>
        `<th style="min-width:${col.width}px">${col.label}</th>`
    ).join('');

    const attrs = (field) => `data-obj-id="${esc(o.id)}" data-section="${sectionKey}" data-row="0" data-field="${field}"`;
    const cells = cfg.columns.map(col => {
        let input;
        if (col.type === 'date') {
            input = `<input class="tc-input tc-date" type="date" ${attrs(col.field)} value="${esc(row[col.field] || '')}">`;
        } else if (col.type === 'status') {
            const opts = STATUS_OPTIONS.map(s =>
                `<option value="${s}" ${s === row[col.field] ? 'selected' : ''}>${s}</option>`
            ).join('');
            input = `<select class="tc-select ${statusCls(row[col.field])}" ${attrs(col.field)}>${opts}</select>`;
        } else {
            input = `<input class="tc-input" type="text" ${attrs(col.field)} value="${esc(row[col.field] || '')}" placeholder="—">`;
        }
        return `<td data-label="${esc(col.label)}">${input}</td>`;
    }).join('');

    const tableHtml = `
        <div class="section-table-wrap">
            <table class="section-table">
                <thead><tr>${theadCells}</tr></thead>
                <tbody><tr data-row="0">${cells}</tr></tbody>
            </table>
        </div>`;

    return `
        <div class="obj-section" data-section-key="${sectionKey}">
            <div class="section-top">
                <span class="section-label">${cfg.label}</span>
                <span class="field-indicator" data-indicator="${indicatorId}"></span>
            </div>
            ${tableHtml}
        </div>`;
}

/* ══════════════════════════════════════════════════════
   EVENTOS (delegación desde #pdvList)
══════════════════════════════════════════════════════ */
function bindDelegatedEvents() {
    const list = document.getElementById('pdvList');

    /* ── Click ── */
    list.addEventListener('click', (e) => {
        // Toggle card
        const header = e.target.closest('.obj-header');
        if (header) {
            const card = header.closest('.obj-card');
            setCardOpen(card, card.dataset.open !== 'true', true);
            syncExpandAllBtn(getVisible());
            return;
        }

        // Eliminar objetivo
        const deleteBtn = e.target.closest('[data-action="delete"]');
        if (deleteBtn) {
            if (!confirm('¿Eliminar este objetivo? Esta acción no se puede deshacer.')) return;
            const id = deleteBtn.dataset.id;
            state = state.filter(o => o.id !== id);
            openCards.delete(id);
            persistState();
            render();
            return;
        }
    });

    /* ── Input (text, con debounce) ── */
    list.addEventListener('input', (e) => {
        const el = e.target;

        // Celda de tabla
        if (el.matches('.tc-input')) {
            syncCellToState(el);
            clearTimeout(debouncers.get(el));
            debouncers.set(el, setTimeout(() => doSaveSection(el.dataset.objId, el.dataset.section), 900));
            return;
        }

        // Meta input
        if (el.matches('.meta-input')) {
            syncMetaToState(el);
            clearTimeout(debouncers.get(el));
            debouncers.set(el, setTimeout(() => doSaveMeta(el.dataset.id, el.dataset.field, el.value), 900));
        }
    });

    /* ── Change (selects y dates) ── */
    list.addEventListener('change', (e) => {
        const el = e.target;

        if (el.matches('.tc-select, .tc-date')) {
            syncCellToState(el);
            // Actualizar clase de color en selects de status
            if (el.matches('.tc-select')) {
                el.className = `tc-select ${statusCls(el.value)}`;
            }
            doSaveSection(el.dataset.objId, el.dataset.section);
            return;
        }

        if (el.matches('.meta-select, .meta-input[type="date"]')) {
            syncMetaToState(el);
            doSaveMeta(el.dataset.id, el.dataset.field, el.value);
        }
    });

    /* ── Focusout (blur delegado – guarda inmediato) ── */
    list.addEventListener('focusout', (e) => {
        const el = e.target;

        if (el.matches('.tc-input')) {
            clearTimeout(debouncers.get(el));
            syncCellToState(el);
            doSaveSection(el.dataset.objId, el.dataset.section);
            return;
        }

        if (el.matches('.meta-input')) {
            clearTimeout(debouncers.get(el));
            syncMetaToState(el);
            doSaveMeta(el.dataset.id, el.dataset.field, el.value);
        }
    });
}

/* ── Sincronización estado ───────────────────────────── */
function syncCellToState(el) {
    const { objId, section, field } = el.dataset;
    const obj = state.find(o => o.id === objId);
    if (!obj) return;
    if (!obj[section][0]) obj[section][0] = SECTIONS[section].emptyRow();
    obj[section][0][field] = el.value;
}

function syncMetaToState(el) {
    const obj = state.find(o => o.id === el.dataset.id);
    if (!obj) return;
    obj[el.dataset.field] = el.value;
    updateCardHeader(obj);
}

/* ── Actualizar cabecera sin re-render completo ──────── */
function updateCardHeader(o) {
    const card = document.querySelector(`[data-id="${o.id}"]`);
    if (!card) return;
    const titleEl  = card.querySelector('.obj-title-text');
    const statusTag = card.querySelector('.obj-status-tag');
    const dateTag  = card.querySelector('.obj-date-tag');
    const semTag   = card.querySelector('.sem-tag');
    const kpiTag   = card.querySelector('.obj-kpi-tag');
    const headerRight = card.querySelector('.obj-header-right');

    if (titleEl) titleEl.textContent = o.title || 'Sin título';
    if (statusTag) { statusTag.textContent = o.status; statusTag.className = `obj-status-tag ${statusCls(o.status)}`; }
    if (dateTag) dateTag.textContent = formatDate(o.dueDate);
    const sem = getSemester(o.dueDate);
    if (semTag) semTag.textContent = sem || '';

    // Actualizar color de fondo del card
    card.dataset.status = o.status;

    // Sincronizar badge KPI
    if (o.kpiValue) {
        if (kpiTag) {
            kpiTag.textContent = o.kpiValue;
            kpiTag.className = `obj-kpi-tag ${statusCls(o.status)}`;
        } else if (headerRight) {
            const span = document.createElement('span');
            span.className = `obj-kpi-tag ${statusCls(o.status)}`;
            span.textContent = o.kpiValue;
            headerRight.prepend(span);
        }
    } else if (kpiTag) {
        kpiTag.remove();
    }
}

/* ── Re-render solo las secciones (sin perder meta) ─── */
function refreshSections(objId) {
    const obj = state.find(o => o.id === objId);
    if (!obj) return;
    const card = document.querySelector(`[data-id="${objId}"]`);
    if (!card) return;
    const sectionsDiv = card.querySelector('.obj-sections');
    if (!sectionsDiv) return;
    sectionsDiv.outerHTML; // flush reference
    sectionsDiv.innerHTML = Object.keys(SECTIONS).map(k => renderSectionTable(obj, k)).join('');
}

/* ── Abrir / Cerrar card ─────────────────────────────── */
function setCardOpen(card, open, animate) {
    const body = card.querySelector('.obj-body');
    const btn = card.querySelector('.obj-header');
    const id = card.dataset.id;
    if (open) {
        openCards.add(id);
        card.dataset.open = 'true';
        btn.setAttribute('aria-expanded', 'true');
        body.hidden = false;
    } else {
        openCards.delete(id);
        card.dataset.open = 'false';
        btn.setAttribute('aria-expanded', 'false');
        body.hidden = true;
    }
}

function syncExpandAllBtn(visible) {
    const btn = document.getElementById('expandAllBtn');
    if (!btn) return;
    const allOpen = visible.length > 0 && visible.every(o => openCards.has(o.id));
    btn.textContent = allOpen ? 'Contraer todo' : 'Expandir todo';
}

/* ── Guardado ────────────────────────────────────────── */
function doSaveSection(objId, sectionKey) {
    const indicatorId = `${objId}__${sectionKey}`;
    showGlobal('saving');
    showIndicator(indicatorId, 'saving');
    setTimeout(() => {
        try {
            persistState();
            showGlobal('saved');
            showIndicator(indicatorId, 'saved');
        } catch {
            showGlobal('error');
            showIndicator(indicatorId, 'error');
        }
    }, 420);
}

function doSaveMeta(objId, field, value) {
    showGlobal('saving');
    setTimeout(() => {
        try {
            persistState();
            showGlobal('saved');
        } catch {
            showGlobal('error');
        }
    }, 420);
}

function showGlobal(s) {
    const bar = document.getElementById('saveBar');
    if (!bar) return;
    bar.hidden = false;
    const map = {
        saving: ['is-saving', 'Guardando…'],
        saved:  ['is-saved',  'Guardado ✓'],
        error:  ['is-error',  'Error al guardar ✗']
    };
    const [cls, text] = map[s] || map.saving;
    bar.className = `pdv-save-bar ${cls}`;
    bar.textContent = text;
    if (s !== 'saving') setTimeout(() => { bar.hidden = true; }, s === 'error' ? 3500 : 2000);
}

function showIndicator(id, s) {
    const el = document.querySelector(`[data-indicator="${id}"]`);
    if (!el) return;
    const map = { saving: ['is-saving', 'Guardando…'], saved: ['is-saved', 'Guardado ✓'], error: ['is-error', 'Error ✗'] };
    const [cls, text] = map[s] || map.saving;
    el.className = `field-indicator ${cls}`;
    el.textContent = text;
    if (s !== 'saving') setTimeout(() => { el.textContent = ''; el.className = 'field-indicator'; }, 2000);
}

/* ── Nuevo objetivo ──────────────────────────────────── */
function addObjective() {
    const o = makeObjective({
        diagnostico: [SECTIONS.diagnostico.emptyRow()],
        areasOportunidad: [SECTIONS.areasOportunidad.emptyRow()],
        planAccion: [SECTIONS.planAccion.emptyRow()]
    });
    state.push(o);
    openCards.add(o.id);
    persistState();
    render();
    requestAnimationFrame(() => {
        const card = document.querySelector(`[data-id="${o.id}"]`);
        if (!card) return;
        card.scrollIntoView({ behavior: 'smooth', block: 'start' });
        card.querySelector('[data-field="title"]')?.focus();
        card.querySelector('[data-field="title"]')?.select();
    });
}

/* ── Expandir / Contraer todo ────────────────────────── */
function toggleAll() {
    const visible = getVisible();
    const allOpen = visible.every(o => openCards.has(o.id));
    visible.forEach(o => {
        const card = document.querySelector(`[data-id="${o.id}"]`);
        if (card) setCardOpen(card, !allOpen, false);
    });
    syncExpandAllBtn(visible);
}

/* ── Init ────────────────────────────────────────────── */
function init() {
    if (!new URLSearchParams(location.search).has('embedded')) {
        document.body.classList.add('is-standalone');
    }

    state = loadState();

    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('is-active'));
            btn.classList.add('is-active');
            currentFilter = btn.dataset.sem;
            render();
        });
    });

    document.getElementById('expandAllBtn').addEventListener('click', toggleAll);
    document.getElementById('addObjBtn').addEventListener('click', addObjective);

    document.querySelectorAll('.mode-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            isEditMode = btn.dataset.mode === 'edit';
            document.querySelectorAll('.mode-btn').forEach(b => b.classList.toggle('is-active', b === btn));
            document.getElementById('addObjBtn').hidden = !isEditMode;
            render();
        });
    });

    bindDelegatedEvents();
    render();
}

document.addEventListener('DOMContentLoaded', init);
