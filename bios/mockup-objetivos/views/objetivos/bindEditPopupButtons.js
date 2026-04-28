function bindEditPopupButtons() {
    document.querySelectorAll(".edit-cell-btn").forEach((el) => {
        el.onclick = (e) => {
            e.stopPropagation();
            const path = el.dataset.path.split("|").map((part) => (Number.isNaN(Number(part)) ? part : Number(part)));
            const type = el.dataset.type;
            const valueDiv = el.parentElement.querySelector('.edit-cell-value');
            const value = valueDiv ? valueDiv.textContent : "";
            const rows = el.dataset.rows ? Number(el.dataset.rows) : 3;
            let label = type === "date" ? "Editar fecha" : type === "textarea" ? "Editar texto" : "Editar valor";
            openEditPopup({ label, value, type, path, rows });
        };
    });
}

function openEditPopup({ label, value, type, path, rows }) {
    let popupState = { path, type };
    const editPopup = document.getElementById("editPopup");
    const editPopupLabel = document.getElementById("editPopupLabel");
    const editPopupField = document.getElementById("editPopupField");
    const editPopupCancel = document.getElementById("editPopupCancel");
    const editPopupSave = document.getElementById("editPopupSave");

    if (!editPopup) return;

    editPopupLabel.textContent = label || "Editar valor";
    const fieldHtml = type === "textarea"
        ? `<textarea id='editPopupInput' rows='${rows || 4}' style='width:100%;font-size:1.1rem;padding:10px;border-radius:8px;border:1px solid #cbd6e2;'>${escapeHtml(value || "")}</textarea>`
        : `<input id='editPopupInput' type='${type || "text"}' value='${escapeHtml(value || "")}' style='width:100%;font-size:1.1rem;padding:10px;border-radius:8px;border:1px solid #cbd6e2;' />`;

    editPopupField.innerHTML = fieldHtml;
    editPopup.style.display = "flex";

    setTimeout(() => {
        const input = document.getElementById("editPopupInput");
        input.focus();
        if (type !== "date") input.select();
    }, 100);

    editPopupCancel.onclick = closeEditPopup;
    editPopupSave.onclick = function () {
        if (!popupState) return;
        const val = document.getElementById("editPopupInput").value;
        if (typeof window.updateField === 'function') window.updateField(popupState.path, val);
        if (typeof window.render === 'function') window.render();
        closeEditPopup();
    };
    editPopup.onclick = function (e) {
        if (e.target === editPopup) closeEditPopup();
    };

    function closeEditPopup() {
        editPopup.style.display = "none";
        popupState = null;
    }
}
