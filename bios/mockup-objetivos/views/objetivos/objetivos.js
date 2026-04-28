const statusOptions = ["Estancado", "En curso", "Cumplido"];

const initialData = [
    {
        id: crypto.randomUUID(),
        name: "Comercial",
        objectives: [
            {
                id: crypto.randomUUID(),
                title: "Aumentar cierres en cuentas clave",
                leader: "Laura Gomez",
                dueDate: "2026-05-15",
                comment: "Prioridad alta para el segundo trimestre.",
                milestones: [
                    {
                        id: crypto.randomUUID(),
                        title: "Redefinir propuesta de valor",
                        tasks: [
                            {
                                id: crypto.randomUUID(),
                                task: "Actualizar pitch comercial para sector salud",
                                leader: "Camilo Ruiz",
                                dueDate: "2026-04-18",
                                status: "En curso",
                                progress: 65,
                                comment: "Ya existe borrador y se esta validando con ventas."
                            },
                            {
                                id: crypto.randomUUID(),
                                task: "Crear version corta para reuniones de 15 minutos",
                                leader: "Valentina Diaz",
                                dueDate: "2026-04-22",
                                status: "Estancado",
                                progress: 30,
                                comment: "Falta feedback del equipo de direccion."
                            }
                        ]
                    },
                    {
                        id: crypto.randomUUID(),
                        title: "Activar seguimiento semanal",
                        tasks: [
                            {
                                id: crypto.randomUUID(),
                                task: "Definir rutina de seguimiento post-demo",
                                leader: "Laura Gomez",
                                dueDate: "2026-04-25",
                                status: "Cumplido",
                                progress: 90,
                                comment: "Proceso aprobado y documentado."
                            }
                        ]
                    }
                ]
            }
        ]
    },
    {
        id: crypto.randomUUID(),
        name: "Operaciones",
        objectives: [
            {
                id: crypto.randomUUID(),
                title: "Disminuir tiempos de entrega interna",
                leader: "David Herrera",
                dueDate: "2026-06-02",
                comment: "Enfocado en aprobaciones y trazabilidad.",
                milestones: [
                    {
                        id: crypto.randomUUID(),
                        title: "Mapear cuellos de botella",
                        tasks: [
                            {
                                id: crypto.randomUUID(),
                                task: "Levantar tiempos reales por etapa del flujo",
                                leader: "Paula Rios",
                                dueDate: "2026-04-20",
                                status: "En curso",
                                progress: 70,
                                comment: "Se cargaron datos de tres equipos."
                            },
                            {
                                id: crypto.randomUUID(),
                                task: "Priorizar mejoras rapidas de aprobacion",
                                leader: "David Herrera",
                                dueDate: "2026-04-29",
                                status: "En curso",
                                progress: 55,
                                comment: "A falta de validar impacto con finanzas."
                            }
                        ]
                    }
                ]
            }
        ]
    }
];

let state = structuredClone(initialData);
let viewMode = "read";
let pendingFocusPath = null;
let staticEventsBound = false;

const board = document.getElementById("board");
const addCategoryButton = document.getElementById("addCategoryButton");
const readModeButton = document.getElementById("readModeButton");
const editModeButton = document.getElementById("editModeButton");
const modeHint = document.getElementById("modeHint");

function createTask() {
    return {
        id: crypto.randomUUID(),
        task: "Nueva tarea",
        leader: "",
        dueDate: "",
        status: "En curso",
        progress: 50,
        comment: ""
    };
}

function createMilestone() {
    return { id: crypto.randomUUID(), title: "Nuevo hito", tasks: [createTask()] };
}

function createObjective() {
    return { id: crypto.randomUUID(), title: "Nuevo objetivo", leader: "", dueDate: "", comment: "", milestones: [createMilestone()] };
}

function createCategory() {
    return { id: crypto.randomUUID(), name: "Nueva categoria", objectives: [createObjective()] };
}

function escapeHtml(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;");
}

function formatDate(value) {
    if (!value) return "Sin fecha";
    const date = new Date(`${value}T00:00:00`);
    if (Number.isNaN(date.getTime())) return value;
    return new Intl.DateTimeFormat("es-CO", { day: "2-digit", month: "short", year: "numeric" }).format(date);
}

function statusClass(status) {
    return status.toLowerCase().replaceAll(" ", "-").replaceAll("á", "a");
}

function renderInputField(type, path, value, options = {}) {
    const { placeholder = "", className = "", emptyLabel = placeholder || "Sin informacion" } = options;
    if (viewMode === "read") {
        const displayValue = type === "date" ? formatDate(value) : (value || emptyLabel);
        const emptyClass = value ? "" : " is-empty";
        return `<div class="read-value ${className}${emptyClass}">${escapeHtml(displayValue)}</div>`;
    }
    const displayValue = type === "date" ? formatDate(value) : (value || emptyLabel);
    return `<div class="edit-cell-value ${className}">${escapeHtml(displayValue)}</div><button class="edit-cell-btn" data-path="${path}" data-type="${type}" title="Editar"><span style="pointer-events:none;">✏️</span></button>`;
}

function renderTextareaField(path, value, options = {}) {
    const { rows = 3, placeholder = "", className = "", emptyLabel = placeholder || "Sin informacion" } = options;
    if (viewMode === "read") {
        const displayValue = value || emptyLabel;
        const emptyClass = value ? "" : " is-empty";
        return `<div class="read-value ${className}${emptyClass}">${escapeHtml(displayValue)}</div>`;
    }
    return `<div class="edit-cell-value ${className}">${escapeHtml(value || emptyLabel)}</div><button class="edit-cell-btn" data-path="${path}" data-type="textarea" data-rows="${rows}" title="Editar"><span style="pointer-events:none;">✏️</span></button>`;
}

function renderStatusField(path, value) {
    if (viewMode === "read") {
        return `<span class="read-status ${statusClass(value)}">${escapeHtml(value)}</span>`;
    }
    return `
        <select class="status-select ${statusClass(value)}" data-path="${path}">
            ${statusOptions.map((option) => `<option value="${option}" ${option === value ? "selected" : ""}>${option}</option>`).join("")}
        </select>
    `;
}

function renderProgressField(path, value) {
    if (viewMode === "read") {
        return `
            <div class="read-progress">
                <span class="progress-value">${value}%</span>
                <div class="progress-bar"><span style="width: ${value}%"></span></div>
            </div>
        `;
    }
    return `
        <span class="progress-value">${value}%</span>
        <input class="progress-track" type="range" min="0" max="100" step="5" value="${value}" data-path="${path}">
    `;
}

function updateField(path, value) {
    let target = state;
    for (let index = 0; index < path.length - 1; index += 1) {
        target = target[path[index]];
    }
    target[path.at(-1)] = value;
    render();
}
window.updateField = updateField;

function scheduleFocus(path) { pendingFocusPath = path.join("|"); }

function applyPendingFocus() {
    if (!pendingFocusPath || viewMode !== "edit") return;
    const element = document.querySelector(`[data-path="${pendingFocusPath}"]`);
    pendingFocusPath = null;
    if (!element) return;
    requestAnimationFrame(() => {
        element.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
        element.focus({ preventScroll: true });
        if (typeof element.select === "function" && (element.tagName === "INPUT" || element.tagName === "TEXTAREA")) {
            element.select();
        }
    });
}

function addCategory() {
    state = [...state, createCategory()];
    scheduleFocus([state.length - 1, "name"]);
    render();
}

function addObjective(categoryIndex) {
    state[categoryIndex].objectives.push(createObjective());
    scheduleFocus([categoryIndex, "objectives", state[categoryIndex].objectives.length - 1, "title"]);
    render();
}

function addMilestone(categoryIndex, objectiveIndex) {
    state[categoryIndex].objectives[objectiveIndex].milestones.push(createMilestone());
    scheduleFocus([categoryIndex, "objectives", objectiveIndex, "milestones", state[categoryIndex].objectives[objectiveIndex].milestones.length - 1, "title"]);
    render();
}

function addTask(categoryIndex, objectiveIndex, milestoneIndex) {
    state[categoryIndex].objectives[objectiveIndex].milestones[milestoneIndex].tasks.push(createTask());
    scheduleFocus([categoryIndex, "objectives", objectiveIndex, "milestones", milestoneIndex, "tasks", state[categoryIndex].objectives[objectiveIndex].milestones[milestoneIndex].tasks.length - 1, "task"]);
    render();
}

function countObjectiveRows(objective) {
    return objective.milestones.reduce((total, milestone) => total + Math.max(milestone.tasks.length, 1), 0);
}

function useCompactObjectivesLayout() {
    return window.matchMedia("(max-width: 980px)").matches;
}

function render() {
    document.body.dataset.mode = viewMode;
    readModeButton.classList.toggle("is-active", viewMode === "read");
    editModeButton.classList.toggle("is-active", viewMode === "edit");
    modeHint.textContent = viewMode === "read"
        ? "Modo lectura para visualizacion ejecutiva"
        : "Modo edicion con acciones inline habilitadas";

    if (!state.length) {
        board.innerHTML = '<div class="empty-state">No hay categorias. Usa el boton <strong>+ Nueva categoria</strong> para comenzar.</div>';
        return;
    }

    board.innerHTML = state.map((category, categoryIndex) => renderCategory(category, categoryIndex)).join("");
    bindEvents();
    bindEditPopupButtons();
    applyPendingFocus();
}
window.render = render;

function renderCategory(category, categoryIndex) {
    const objectiveTotal = category.objectives.length;
    const milestoneTotal = category.objectives.reduce((acc, objective) => acc + objective.milestones.length, 0);
    const taskTotal = category.objectives.reduce(
        (acc, objective) => acc + objective.milestones.reduce((taskAcc, milestone) => taskAcc + milestone.tasks.length, 0), 0
    );
    const categoryBody = useCompactObjectivesLayout()
        ? renderCategoryCompact(category, categoryIndex)
        : renderCategoryTable(category, categoryIndex);

    return `
        <section class="category-card">
            <div class="category-header">
                <div class="category-ribbon ${viewMode === "edit" ? "is-editable" : ""}">
                    ${viewMode === "read"
                        ? escapeHtml(category.name)
                        : `<input class="category-title-input" type="text" value="${escapeHtml(category.name)}" data-path="${categoryIndex}|name" aria-label="Nombre de categoria">`}
                </div>
                <div class="category-meta">
                    <span class="pill">${objectiveTotal} objetivos</span>
                    <span class="pill">${milestoneTotal} hitos</span>
                    <span class="pill">${taskTotal} tareas</span>
                </div>
                <div class="category-actions edit-only">
                    <button class="button-ghost" type="button" data-action="add-objective" data-category-index="${categoryIndex}">+ Objetivo</button>
                </div>
            </div>
            ${categoryBody}
        </section>
    `;
}

function renderCategoryTable(category, categoryIndex) {
    return `
        <div class="table-wrap">
            <table>
                <thead>
                    <tr>
                        <th>Objetivo</th><th>Hito</th><th>Tarea</th><th>Lider</th>
                        <th>Fecha objetivo</th><th>Estado</th><th>% cumplimiento</th><th>Comentario</th>
                    </tr>
                </thead>
                <tbody>
                    ${category.objectives.map((objective, objectiveIndex) => renderObjectiveRows(category, categoryIndex, objective, objectiveIndex)).join("")}
                </tbody>
            </table>
        </div>
    `;
}

function renderMobileField(label, content) {
    return `<div class="mobile-field"><span>${escapeHtml(label)}</span>${content}</div>`;
}

function renderCategoryCompact(category, categoryIndex) {
    return `
        <div class="mobile-objectives">
            ${category.objectives.map((objective, objectiveIndex) => `
                <article class="objective-mobile-card">
                    <div class="mobile-block-header">
                        <span class="mobile-block-title">Objetivo</span>
                        <div class="mini-actions edit-only">
                            <button class="button-ghost" type="button" data-action="add-milestone" data-category-index="${categoryIndex}" data-objective-index="${objectiveIndex}">+ Hito</button>
                        </div>
                    </div>
                    <div class="mobile-block-content">
                        ${renderMobileField("Objetivo", renderTextareaField(`${categoryIndex}|objectives|${objectiveIndex}|title`, objective.title, { rows: 3, emptyLabel: "Sin objetivo" }))}
                        ${renderMobileField("Lider", renderInputField("text", `${categoryIndex}|objectives|${objectiveIndex}|leader`, objective.leader, { placeholder: "Lider del objetivo" }))}
                        ${renderMobileField("Fecha objetivo", renderInputField("date", `${categoryIndex}|objectives|${objectiveIndex}|dueDate`, objective.dueDate))}
                        ${renderMobileField("Comentario", renderTextareaField(`${categoryIndex}|objectives|${objectiveIndex}|comment`, objective.comment, { rows: 3, placeholder: "Contexto o alcance" }))}
                    </div>
                    ${objective.milestones.map((milestone, milestoneIndex) => `
                        <section class="mobile-milestone">
                            <div class="mobile-block-header">
                                <span class="mobile-block-title">Hito</span>
                                <div class="mini-actions edit-only">
                                    <button class="button-ghost" type="button" data-action="add-task" data-category-index="${categoryIndex}" data-objective-index="${objectiveIndex}" data-milestone-index="${milestoneIndex}">+ Tarea</button>
                                </div>
                            </div>
                            <div class="mobile-block-content">
                                ${renderMobileField("Hito", renderTextareaField(`${categoryIndex}|objectives|${objectiveIndex}|milestones|${milestoneIndex}|title`, milestone.title, { rows: 3, emptyLabel: "Sin hito" }))}
                            </div>
                            <div class="mobile-task-list">
                                ${milestone.tasks.map((task, taskIndex) => `
                                    <article class="mobile-task">
                                        <div class="mobile-block-header">
                                            <span class="mobile-block-title">Tarea ${taskIndex + 1}</span>
                                        </div>
                                        <div class="mobile-block-content">
                                            ${renderMobileField("Tarea", renderTextareaField(`${categoryIndex}|objectives|${objectiveIndex}|milestones|${milestoneIndex}|tasks|${taskIndex}|task`, task.task, { rows: 3, emptyLabel: "Sin tarea" }))}
                                            ${renderMobileField("Lider", renderInputField("text", `${categoryIndex}|objectives|${objectiveIndex}|milestones|${milestoneIndex}|tasks|${taskIndex}|leader`, task.leader, { placeholder: "Asignar lider" }))}
                                            ${renderMobileField("Fecha objetivo", renderInputField("date", `${categoryIndex}|objectives|${objectiveIndex}|milestones|${milestoneIndex}|tasks|${taskIndex}|dueDate`, task.dueDate))}
                                            ${renderMobileField("Estado", renderStatusField(`${categoryIndex}|objectives|${objectiveIndex}|milestones|${milestoneIndex}|tasks|${taskIndex}|status`, task.status))}
                                            ${renderMobileField("Cumplimiento", renderProgressField(`${categoryIndex}|objectives|${objectiveIndex}|milestones|${milestoneIndex}|tasks|${taskIndex}|progress`, task.progress))}
                                            ${renderMobileField("Comentario", renderTextareaField(`${categoryIndex}|objectives|${objectiveIndex}|milestones|${milestoneIndex}|tasks|${taskIndex}|comment`, task.comment, { rows: 3, placeholder: "Notas y observaciones" }))}
                                        </div>
                                    </article>
                                `).join("")}
                            </div>
                        </section>
                    `).join("")}
                </article>
            `).join("")}
        </div>
    `;
}

function renderObjectiveRows(category, categoryIndex, objective, objectiveIndex) {
    const objectiveRowSpan = countObjectiveRows(objective);
    let objectivePrinted = false;

    return objective.milestones.map((milestone, milestoneIndex) => {
        const milestoneRowSpan = Math.max(milestone.tasks.length, 1);
        let milestonePrinted = false;

        return milestone.tasks.map((task, taskIndex) => {
            const row = [];

            if (!objectivePrinted) {
                objectivePrinted = true;
                row.push(`
                    <td rowspan="${objectiveRowSpan}" class="objective-cell">
                        <div class="cell">
                            <div class="cell-header">
                                <div class="mini-actions edit-only">
                                    <button class="button-ghost" type="button" data-action="add-milestone" data-category-index="${categoryIndex}" data-objective-index="${objectiveIndex}">+ Hito</button>
                                </div>
                            </div>
                            ${renderTextareaField(`${categoryIndex}|objectives|${objectiveIndex}|title`, objective.title, { rows: 4, emptyLabel: "Sin objetivo" })}
                            ${renderInputField("text", `${categoryIndex}|objectives|${objectiveIndex}|leader`, objective.leader, { placeholder: "Lider del objetivo" })}
                            ${renderInputField("date", `${categoryIndex}|objectives|${objectiveIndex}|dueDate`, objective.dueDate)}
                            ${renderTextareaField(`${categoryIndex}|objectives|${objectiveIndex}|comment`, objective.comment, { rows: 3, placeholder: "Contexto o alcance" })}
                        </div>
                    </td>
                `);
            }

            if (!milestonePrinted) {
                milestonePrinted = true;
                row.push(`
                    <td rowspan="${milestoneRowSpan}" class="milestone-cell">
                        <div class="cell">
                            <div class="cell-header">
                                <div class="mini-actions edit-only">
                                    <button class="button-ghost" type="button" data-action="add-task" data-category-index="${categoryIndex}" data-objective-index="${objectiveIndex}" data-milestone-index="${milestoneIndex}">+ Tarea</button>
                                </div>
                            </div>
                            ${renderTextareaField(`${categoryIndex}|objectives|${objectiveIndex}|milestones|${milestoneIndex}|title`, milestone.title, { rows: 4, emptyLabel: "Sin hito" })}
                        </div>
                    </td>
                `);
            }

            row.push(`
                <td><div class="cell">${renderTextareaField(`${categoryIndex}|objectives|${objectiveIndex}|milestones|${milestoneIndex}|tasks|${taskIndex}|task`, task.task, { rows: 3, emptyLabel: "Sin tarea" })}</div></td>
                <td><div class="cell">${renderInputField("text", `${categoryIndex}|objectives|${objectiveIndex}|milestones|${milestoneIndex}|tasks|${taskIndex}|leader`, task.leader, { placeholder: "Asignar lider" })}</div></td>
                <td><div class="cell">${renderInputField("date", `${categoryIndex}|objectives|${objectiveIndex}|milestones|${milestoneIndex}|tasks|${taskIndex}|dueDate`, task.dueDate)}</div></td>
                <td><div class="cell">${renderStatusField(`${categoryIndex}|objectives|${objectiveIndex}|milestones|${milestoneIndex}|tasks|${taskIndex}|status`, task.status)}</div></td>
                <td><div class="cell progress-box">${renderProgressField(`${categoryIndex}|objectives|${objectiveIndex}|milestones|${milestoneIndex}|tasks|${taskIndex}|progress`, task.progress)}</div></td>
                <td><div class="cell">${renderTextareaField(`${categoryIndex}|objectives|${objectiveIndex}|milestones|${milestoneIndex}|tasks|${taskIndex}|comment`, task.comment, { rows: 3, placeholder: "Notas y observaciones" })}</div></td>
            `);

            return `<tr>${row.join("")}</tr>`;
        }).join("");
    }).join("");
}

function bindEvents() {
    if (!staticEventsBound) {
        readModeButton.addEventListener("click", () => { viewMode = "read"; render(); });
        editModeButton.addEventListener("click", () => { viewMode = "edit"; render(); });
        addCategoryButton?.addEventListener("click", addCategory);
        window.matchMedia("(max-width: 980px)").addEventListener("change", () => render());
        staticEventsBound = true;
    }

    document.querySelectorAll("[data-path]").forEach((element) => {
        if (element.tagName === "INPUT" || element.tagName === "TEXTAREA" || element.tagName === "SELECT") {
            element.addEventListener("change", () => {
                const path = element.dataset.path.split("|").map((part) => (Number.isNaN(Number(part)) ? part : Number(part)));
                updateField(path, element.tagName === "INPUT" && element.type === "number" ? Number(element.value) : element.value);
            });
            if (element.tagName === "INPUT" && element.type === "range") {
                element.addEventListener("input", () => {
                    const path = element.dataset.path.split("|").map((part) => (Number.isNaN(Number(part)) ? part : Number(part)));
                    updateField(path, Number(element.value));
                });
            }
        }
    });

    document.querySelectorAll("[data-action]").forEach((button) => {
        button.addEventListener("click", () => {
            const { action, categoryIndex, objectiveIndex, milestoneIndex } = button.dataset;
            if (action === "add-objective") addObjective(Number(categoryIndex));
            else if (action === "add-milestone") addMilestone(Number(categoryIndex), Number(objectiveIndex));
            else if (action === "add-task") addTask(Number(categoryIndex), Number(objectiveIndex), Number(milestoneIndex));
        });
    });
}

render();
