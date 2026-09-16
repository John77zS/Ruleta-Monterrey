const SHEET_NAME = "Participaciones";
const TIMEZONE = "America/La_Paz";

function doGet(e) {
  const action = e && e.parameter ? e.parameter.action || "" : "";
  const callback = e && e.parameter ? e.parameter.callback || "" : "";

  if (action === "warmup") {
    try {
      const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
      if (!spreadsheet) throw new Error("No se pudo acceder al Spreadsheet.");
      return responder({ ok: true, warmup: true }, callback);
    } catch (error) {
      return responder({ ok: false, warmup: false, error: error.message }, callback);
    }
  }

  if (action === "checkInvoice") {
    const invoice = normalizarFactura(e.parameter.invoice || "");
    if (!invoice) return responder({ ok: false, error: "Factura no proporcionada." }, callback);

    try {
      const exists = facturaExiste(invoice);
      return responder({ ok: true, exists: exists }, callback);
    } catch (error) {
      return responder({ ok: false, error: error.message }, callback);
    }
  }

  if (action === "registerParticipation") {
    const invoice = normalizarFactura(e.parameter.invoice || "");
    if (!invoice) return responder({ ok: false, error: "Factura no proporcionada." }, callback);

    const lock = LockService.getScriptLock();
    try {
      lock.waitLock(10000);

      if (facturaExiste(invoice)) {
        return responder({
          ok: false,
          duplicate: true,
          error: "Esta factura ya participó."
        }, callback);
      }

      const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
      if (!sheet) throw new Error("No existe la hoja: " + SHEET_NAME);

      const columns = asegurarColumnas(sheet);
      const ahora = new Date();
      const fecha = e.parameter.fecha || Utilities.formatDate(ahora, TIMEZONE, "dd/MM/yyyy");
      const hora = e.parameter.hora || Utilities.formatDate(ahora, TIMEZONE, "HH:mm:ss");
      const regional = String(e.parameter.regional || "").trim();
      const sucursal = String(e.parameter.sucursal || "").trim();
      const premio = String(e.parameter.premio || "").trim();

      escribirParticipacion(sheet, columns, fecha, hora, regional, sucursal, invoice, premio);

      return responder({ ok: true, saved: true }, callback);
    } catch (error) {
      return responder({ ok: false, error: error.message }, callback);
    } finally {
      try { lock.releaseLock(); } catch (error) {}
    }
  }

  return ContentService
    .createTextOutput("OK - HOJA CONECTADA")
    .setMimeType(ContentService.MimeType.TEXT);
}

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      throw new Error("No se recibió información.");
    }

    const data = JSON.parse(e.postData.contents);
    const invoice = normalizarFactura(data.factura || "");
    if (!invoice) throw new Error("Factura no proporcionada.");

    const lock = LockService.getScriptLock();
    lock.waitLock(10000);

    try {
      if (facturaExiste(invoice)) {
        return respuestaJSON({
          ok: false,
          duplicate: true,
          error: "Esta factura ya participó."
        });
      }

      const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
      if (!sheet) throw new Error("No existe la hoja: " + SHEET_NAME);

      const columns = asegurarColumnas(sheet);
      const ahora = new Date();
      const fecha = data.fecha || Utilities.formatDate(ahora, TIMEZONE, "dd/MM/yyyy");
      const hora = data.hora || Utilities.formatDate(ahora, TIMEZONE, "HH:mm:ss");
      const regional = String(data.regional || "").trim();
      const sucursal = String(data.sucursal || "").trim();
      const premio = String(data.premio || "").trim();

      escribirParticipacion(sheet, columns, fecha, hora, regional, sucursal, invoice, premio);

      return respuestaJSON({ ok: true, saved: true });
    } finally {
      lock.releaseLock();
    }
  } catch (error) {
    return respuestaJSON({ ok: false, error: error.message });
  }
}

function facturaExiste(invoice) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  if (!sheet) throw new Error("No existe la hoja: " + SHEET_NAME);

  const buscada = normalizarFactura(invoice);
  if (!buscada) return false;

  const columns = asegurarColumnas(sheet);
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return false;

  const valores = sheet.getRange(2, columns.factura, lastRow - 1, 1).getDisplayValues();
  for (const fila of valores) {
    if (normalizarFactura(fila[0]) === buscada) return true;
  }
  return false;
}

function asegurarColumnas(sheet) {
  const required = ["Fecha", "Hora", "Regional", "Sucursal", "Factura", "Premio"];

  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, required.length).setValues([required]);
    return { fecha: 1, hora: 2, regional: 3, sucursal: 4, factura: 5, premio: 6 };
  }

  let headers = sheet.getRange(1, 1, 1, Math.max(sheet.getLastColumn(), 1)).getDisplayValues()[0]
    .map(h => String(h || "").trim());

  let facturaIndex = headers.findIndex(h => h.toLowerCase() === "factura");
  let sucursalIndex = headers.findIndex(h => h.toLowerCase() === "sucursal");

  if (facturaIndex === -1) {
    throw new Error("No se encontró la columna Factura en la hoja Participaciones.");
  }

  // Migración automática: si la hoja antigua no tiene Sucursal,
  // insertamos la columna antes de Factura para conservar el orden.
  if (sucursalIndex === -1) {
    sheet.insertColumnBefore(facturaIndex + 1);
    sheet.getRange(1, facturaIndex + 1).setValue("Sucursal");
    headers = sheet.getRange(1, 1, 1, Math.max(sheet.getLastColumn(), 1)).getDisplayValues()[0]
      .map(h => String(h || "").trim());
  }

  const indexOf = name => {
    const index = headers.findIndex(h => h.toLowerCase() === name.toLowerCase());
    if (index === -1) throw new Error("No se encontró la columna " + name + ".");
    return index + 1;
  };

  return {
    fecha: indexOf("Fecha"),
    hora: indexOf("Hora"),
    regional: indexOf("Regional"),
    sucursal: indexOf("Sucursal"),
    factura: indexOf("Factura"),
    premio: indexOf("Premio")
  };
}

function escribirParticipacion(sheet, columns, fecha, hora, regional, sucursal, invoice, premio) {
  const row = sheet.getLastRow() + 1;
  sheet.getRange(row, columns.fecha).setValue(fecha);
  sheet.getRange(row, columns.hora).setValue(hora);
  sheet.getRange(row, columns.regional).setValue(regional);
  sheet.getRange(row, columns.sucursal).setValue(sucursal);
  sheet.getRange(row, columns.factura).setValue(invoice);
  sheet.getRange(row, columns.premio).setValue(premio);
}

function normalizarFactura(valor) {
  return String(valor || "")
    .trim()
    .replace(/\s+/g, "")
    .replace(/\D/g, "");
}

function responder(data, callback) {
  const json = JSON.stringify(data);
  if (callback) {
    return ContentService
      .createTextOutput(callback + "(" + json + ");")
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService
    .createTextOutput(json)
    .setMimeType(ContentService.MimeType.JSON);
}

function respuestaJSON(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
