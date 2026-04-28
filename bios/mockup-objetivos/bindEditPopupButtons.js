// bindEditPopupButtons.js
// Esta función enlaza los botones de lápiz para abrir el popup de edición en cada celda editable.
function bindEditPopupButtons() {
  document.querySelectorAll(".edit-cell-btn").forEach((el) => {
    el.onclick = (e) => {
      e.stopPropagation();
      const path = el.dataset.path.split("|").map((part) => (Number.isNaN(Number(part)) ? part : Number(part)));
      const type = el.dataset.type;
      let label = "Editar valor";
      let value = "";
      let rows = 3;
      // Buscar el valor actual
      const valueDiv = el.parentElement.querySelector('.edit-cell-value');
      if (valueDiv) value = valueDiv.textContent;
      if (type === "date") label = "Editar fecha";
      else if (type === "textarea") label = "Editar texto";
      else label = "Editar valor";
      if (el.dataset.rows) rows = Number(el.dataset.rows);
      openEditPopup({label, value, type, path, rows});
    };
  });
}

// Muestra el popup de edición para una celda editable
function openEditPopup({label, value, type, path, rows}) {
  let popupState = { path, type };
  let editPopup = document.getElementById("editPopup");
  let editPopupLabel = document.getElementById("editPopupLabel");
  let editPopupField = document.getElementById("editPopupField");
  let editPopupCancel = document.getElementById("editPopupCancel");
  let editPopupSave = document.getElementById("editPopupSave");

  if (!editPopup) {
    alert("No se encontró el popup de edición en el DOM.");
    return;
  }

  editPopupLabel.textContent = label || "Editar valor";
  let fieldHtml = "";
  if (type === "textarea") {
    fieldHtml = `<textarea id='editPopupInput' rows='${rows||4}' style='width:100%;font-size:1.1rem;padding:10px;border-radius:8px;border:1px solid #cbd6e2;'>${escapeHtml(value||"")}</textarea>`;
  } else {
    fieldHtml = `<input id='editPopupInput' type='${type||"text"}' value='${escapeHtml(value||"")}' style='width:100%;font-size:1.1rem;padding:10px;border-radius:8px;border:1px solid #cbd6e2;' />`;
  }
  editPopupField.innerHTML = fieldHtml;
  editPopup.style.display = "flex";
  setTimeout(()=>{
    document.getElementById("editPopupInput").focus();
    if(type!=="date")document.getElementById("editPopupInput").select();
  }, 100);

  // Cierre y guardar
  editPopupCancel.onclick = closeEditPopup;
  editPopupSave.onclick = function() {
    if (!popupState) return;
    const val = document.getElementById("editPopupInput").value;
    // Actualiza el dato en el estado global y vuelve a renderizar
    if (typeof window.updateField === 'function') {
      window.updateField(popupState.path, val);
    } else {
      alert('Falta implementar window.updateField(path, valor) para guardar el dato.');
    }
    if (typeof window.render === 'function') {
      window.render();
    }
    closeEditPopup();
  };
  editPopup.onclick = function(e) {
    if (e.target === editPopup) closeEditPopup();
  };

  function closeEditPopup() {
    editPopup.style.display = "none";
    popupState = null;
  }
}

// Utilidad para escapar HTML
function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
