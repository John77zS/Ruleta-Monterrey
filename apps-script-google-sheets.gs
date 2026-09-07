const SHEET_NAME = "Participaciones";


// ==========================================
// GET
// ==========================================

function doGet(e) {

  const action =
    e &&
    e.parameter &&
    e.parameter.action
      ? e.parameter.action
      : "";

  // ------------------------------------------
  // COMPROBAR FACTURA
  // ------------------------------------------

  if (action === "checkInvoice") {

    const invoice =
      String(
        e.parameter.invoice || ""
      ).trim();

    if (!invoice) {

      return respuesta({
        ok: false,
        error: "Factura no proporcionada"
      });

    }

    const exists =
      facturaExiste(invoice);

    return respuesta({
      ok: true,
      exists: exists
    });
  }


  return respuesta({
    ok: true,
    message: "API Ruleta Monterrey funcionando"
  });
}


// ==========================================
// POST
// ==========================================

function doPost(e) {

  try {

    const data =
      JSON.parse(
        e.postData.contents
      );


    const spreadsheet =
      SpreadsheetApp.getActiveSpreadsheet();


    const sheet =
      spreadsheet.getSheetByName(
        SHEET_NAME
      );


    if (!sheet) {

      throw new Error(
        "No existe la hoja: " +
        SHEET_NAME
      );

    }


    const invoice =
      String(
        data.factura || ""
      ).trim();


    if (!invoice) {

      return respuesta({
        ok: false,
        error: "Factura no proporcionada"
      });

    }


    // ==========================================
    // SEGURIDAD:
    // VOLVER A COMPROBAR LA FACTURA
    // ==========================================

    if (facturaExiste(invoice)) {

      return respuesta({
        ok: false,
        duplicate: true,
        error:
          "Esta factura ya participó."
      });

    }


    // ==========================================
    // DATOS
    // ==========================================

    const fecha =
      data.fecha ||
      Utilities.formatDate(
        new Date(),
        "America/La_Paz",
        "dd/MM/yyyy"
      );


    const hora =
      data.hora ||
      Utilities.formatDate(
        new Date(),
        "America/La_Paz",
        "HH:mm:ss"
      );


    const regional =
      String(
        data.regional || ""
      ).trim();


    const premio =
      String(
        data.premio || ""
      ).trim();


    // ==========================================
    // GUARDAR
    // ==========================================

    sheet.appendRow([
      fecha,
      hora,
      regional,
      invoice,
      premio
    ]);


    return respuesta({
      ok: true,
      saved: true
    });


  } catch (error) {

    return respuesta({
      ok: false,
      error: error.message
    });

  }
}


// ==========================================
// COMPROBAR SI FACTURA EXISTE
// ==========================================

function facturaExiste(invoice) {

  const spreadsheet =
    SpreadsheetApp.getActiveSpreadsheet();


  const sheet =
    spreadsheet.getSheetByName(
      SHEET_NAME
    );


  if (!sheet) {
    throw new Error(
      "No existe la hoja: " +
      SHEET_NAME
    );
  }


  const lastRow =
    sheet.getLastRow();


  // Solo encabezados
  if (lastRow < 2) {
    return false;
  }


  // ==========================================
  // LA COLUMNA D ES FACTURA
  // ==========================================

  const values =
    sheet
      .getRange(
        2,
        4,
        lastRow - 1,
        1
      )
      .getDisplayValues();


  const normalizedInvoice =
    String(invoice)
      .trim()
      .toLowerCase();


  return values.some(row => {

    return String(row[0])
      .trim()
      .toLowerCase() ===
      normalizedInvoice;

  });
}


// ==========================================
// RESPUESTA JSON
// ==========================================

function respuesta(data) {

  return ContentService
    .createTextOutput(
      JSON.stringify(data)
    )
    .setMimeType(
      ContentService.MimeType.JSON
    );
}