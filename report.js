const STORAGE_KEY = "monterrey-participaciones-v3";

const reportBody = document.getElementById("reportBody");
const emptyState = document.getElementById("emptyState");
const search = document.getElementById("search");

function getData() {
  return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
}

function esc(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function render() {
  const data = getData();
  const q = search.value.trim().toLowerCase();

  const filtered = data.filter(item => {
    const text = `${item.date} ${item.time} ${item.invoice} ${item.prize}`.toLowerCase();
    return !q || text.includes(q);
  });

  document.getElementById("total").textContent = data.length;
  document.getElementById("invoiceCount").textContent =
    new Set(data.map(x => String(x.invoice))).size;
  document.getElementById("prizeCount").textContent = data.length;

  reportBody.innerHTML = filtered.map(item => `
    <tr>
      <td>${esc(item.date)}</td>
      <td>${esc(item.time)}</td>
      <td>${esc(item.invoice)}</td>
      <td>${esc(item.prize)}</td>
    </tr>
  `).join("");

  emptyState.style.display = filtered.length ? "none" : "block";
}

function downloadCsv() {
  const data = getData();

  if (!data.length) {
    alert("No hay registros para exportar.");
    return;
  }

  const rows = [
    ["Fecha", "Hora", "Factura", "Premio"],
    ...data.map(x => [x.date, x.time, x.invoice, x.prize])
  ];

  const csv = rows.map(row =>
    row.map(v => `"${String(v ?? "").replaceAll('"', '""')}"`).join(",")
  ).join("\n");

  const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `reporte-monterrey-${new Date().toISOString().slice(0,10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

document.getElementById("downloadCsv").addEventListener("click", downloadCsv);

document.getElementById("resetData").addEventListener("click", () => {
  if (confirm("¿Borrar todas las participaciones guardadas en este navegador?")) {
    localStorage.removeItem(STORAGE_KEY);
    render();
  }
});

search.addEventListener("input", render);
render();
