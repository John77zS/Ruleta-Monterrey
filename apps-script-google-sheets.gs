// GOOGLE APPS SCRIPT - RULETA MONTERREY
// Reemplaza el valor de SHEET_ID por el ID REAL de tu Google Sheet.
// La pestaña debe llamarse exactamente: Participaciones

const SHEET_ID = "PEGA_AQUI_TU_SHEET_ID";
const SHEET_NAME = "Participaciones";

function getSheet() {
  return SpreadsheetApp
    .openById(SHEET_ID)
    .getSheetByName(SHEET_NAME);
}

function doGet() {
  try {
    const sheet = getSheet();

    if (!sheet) {
      return ContentService.createTextOutput(
        "ERROR - NO EXISTE LA HOJA PARTICIPACIONES"
      );
    }

    return ContentService.createTextOutput("OK - HOJA CONECTADA");

  } catch (error) {
    return ContentService.createTextOutput("ERROR: " + error.message);
  }
}

function doPost(e) {
  const lock = LockService.getScriptLock();

  try {
    lock.waitLock(10000);

    const sheet = getSheet();

    if (!sheet) {
      return jsonResponse({
        success: false,
        message: "No existe la hoja Participaciones"
      });
    }

    const data = JSON.parse(e.postData.contents);
    const factura = String(data.factura || "").trim();

    if (!factura) {
      return jsonResponse({
        success: false,
        message: "Número de factura vacío"
      });
    }

    // COLUMNA C = FACTURA
    const lastRow = sheet.getLastRow();

    if (lastRow >= 2) {
      const facturas = sheet
        .getRange(2, 3, lastRow - 1, 1)
        .getDisplayValues()
        .flat()
        .map(valor => String(valor).trim());

      if (facturas.includes(factura)) {
        return jsonResponse({
          success: false,
          duplicate: true,
          message: "Esta factura ya participó"
        });
      }
    }

    // Hoja:
    // A Fecha | B Hora | C Factura | D Premio
    sheet.appendRow([
      data.fecha,
      data.hora,
      factura,
      data.premio
    ]);

    return jsonResponse({
      success: true,
      duplicate: false,
      message: "Participación registrada correctamente"
    });

  } catch (error) {
    return jsonResponse({
      success: false,
      message: error.message
    });

  } finally {
    try {
      lock.releaseLock();
    } catch (_) {}
  }
}

function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
