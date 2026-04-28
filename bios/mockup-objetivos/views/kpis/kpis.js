function setupKpiMobileLabels() {
    const table = document.querySelector('#kpis table');
    if (!table) return;

    const headers = Array.from(table.querySelectorAll('thead th')).map((th) =>
        th.textContent.replace(/\s+/g, ' ').trim()
    );

    table.querySelectorAll('tbody tr').forEach((row) => {
        if (row.classList.contains('category-row')) return;
        Array.from(row.children).forEach((cell, index) => {
            cell.dataset.label = headers[index] || `Col ${index + 1}`;
        });
    });
}

setupKpiMobileLabels();
