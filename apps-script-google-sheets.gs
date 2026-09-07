const SHEET_NAME = "Participaciones";

function doGet(e) {
  const action = e && e.parameter ? e.parameter.action : "";

  if (action === "checkInvoice") {
    const invoice = String(e.parameter.invoice || "").trim();

    if (!invoice) {
      return ContentService
        .createTextOutput(JSON.stringify({
          ok: false,
          error: "Factura no proporcionada"
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    const exists = facturaExiste(invoice);

    return ContentService
      .createTextOutput(JSON.stringify({
        ok: true,
        exists: exists
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  return ContentService
    .createTextOutput("OK - HOJA CONECTADA")
    .setMimeType(ContentService.MimeType.TEXT);
}

function facturaExiste(invoice) {
  const sheet = SpreadsheetApp
    .getActiveSpreadsheet()
    .getSheetByName(SHEET_NAME);

  if (!sheet) {
    throw new Error("No existe la hoja: " + SHEET_NAME);
  }

  const lastRow = sheet.getLastRow();

  if (lastRow < 2) {
    return false;
  }

  const valores = sheet
    .getRange(2, 4, lastRow - 1, 1)
    .getDisplayValues();

  const facturaBuscada = String(invoice)
    .trim()
    .toLowerCase();

  return valores.some(function(row) {
    return String(row[0])
      .trim()
      .toLowerCase() === facturaBuscada;
  });
}