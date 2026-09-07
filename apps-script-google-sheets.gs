// ============================================================
// RULETA MONTERREY - GOOGLE SHEETS
// ============================================================

const SHEET_ID = "1MURkYyPyOVG4wUQUWQAjvY0X6nhaFgjTuJ9uDY9Ib8Q";
const SHEET_NAME = "Participaciones";


// ============================================================
// CONEXIÓN DE PRUEBA
// ============================================================

function doGet() {

  return ContentService
    .createTextOutput("OK - HOJA CONECTADA")
    .setMimeType(ContentService.MimeType.TEXT);

}


// ============================================================
// RECIBIR PARTICIPACIÓN
// ============================================================

function doPost(e) {

  // Evita que dos participaciones entren al mismo tiempo
  const lock = LockService.getScriptLock();

  try {

    lock.waitLock(10000);


    // --------------------------------------------------------
    // VERIFICAR DATOS RECIBIDOS
    // --------------------------------------------------------

    if (!e || !e.postData || !e.postData.contents) {

      return respuesta(
        "ERROR: No se recibió información."
      );

    }


    const data = JSON.parse(
      e.postData.contents
    );


    // --------------------------------------------------------
    // OBTENER DATOS
    // --------------------------------------------------------

    const fecha = String(
      data.fecha || ""
    ).trim();

    const hora = String(
      data.hora || ""
    ).trim();

    const regional = String(
      data.regional || ""
    ).trim();

    const factura = String(
      data.factura || ""
    ).trim();

    const premio = String(
      data.premio || ""
    ).trim();


    // --------------------------------------------------------
    // VALIDACIONES
    // --------------------------------------------------------

    if (!regional) {

      return respuesta(
        "ERROR: Falta la regional."
      );

    }


    if (!factura) {

      return respuesta(
        "ERROR: Falta la factura."
      );

    }


    if (!premio) {

      return respuesta(
        "ERROR: Falta el premio."
      );

    }


    // --------------------------------------------------------
    // ABRIR GOOGLE SHEETS
    // --------------------------------------------------------

    const spreadsheet =
      SpreadsheetApp.openById(
        SHEET_ID
      );


    let sheet =
      spreadsheet.getSheetByName(
        SHEET_NAME
      );


    // --------------------------------------------------------
    // CREAR HOJA SI NO EXISTE
    // --------------------------------------------------------

    if (!sheet) {

      sheet =
        spreadsheet.insertSheet(
          SHEET_NAME
        );

    }


    // --------------------------------------------------------
    // PREPARAR COLUMNAS
    // --------------------------------------------------------

    prepararEncabezados(sheet);


    // --------------------------------------------------------
    // BUSCAR FACTURA DUPLICADA
    //
    // Regional NO forma parte de la comparación.
    //
    // Es decir:
    //
    // Santa Cruz + factura 123
    // y
    // La Paz + factura 123
    //
    // se considera la MISMA factura.
    // --------------------------------------------------------

    const lastRow =
      sheet.getLastRow();


    if (lastRow >= 2) {

      const facturas =
        sheet
          .getRange(
            2,
            4,
            lastRow - 1,
            1
          )
          .getDisplayValues();


      const facturaDuplicada =
        facturas.some(row => {

          return String(row[0])
            .trim()
            === factura;

        });


      if (facturaDuplicada) {

        return respuesta(
          "DUPLICADA: Esta factura ya participó anteriormente."
        );

      }

    }


    // --------------------------------------------------------
    // FECHA Y HORA
    // --------------------------------------------------------

    const ahora =
      new Date();


    const fechaFinal =
      fecha ||
      Utilities.formatDate(
        ahora,
        Session.getScriptTimeZone(),
        "dd/MM/yyyy"
      );


    const horaFinal =
      hora ||
      Utilities.formatDate(
        ahora,
        Session.getScriptTimeZone(),
        "HH:mm:ss"
      );


    // --------------------------------------------------------
    // GUARDAR
    // --------------------------------------------------------

    sheet.appendRow([

      fechaFinal,

      horaFinal,

      regional,

      factura,

      premio

    ]);


    // --------------------------------------------------------
    // RESPUESTA
    // --------------------------------------------------------

    return respuesta("OK");


  } catch (error) {

    console.error(error);

    return respuesta(
      "ERROR: " + error.message
    );


  } finally {

    try {

      lock.releaseLock();

    } catch (error) {

      // No hacer nada si el lock ya fue liberado

    }

  }

}


// ============================================================
// PREPARAR ESTRUCTURA DE LA HOJA
// ============================================================

function prepararEncabezados(sheet) {

  const encabezados = [

    "Fecha",

    "Hora",

    "Regional",

    "Factura",

    "Premio"

  ];


  // ----------------------------------------------------------
  // HOJA COMPLETAMENTE VACÍA
  // ----------------------------------------------------------

  if (sheet.getLastRow() === 0) {

    sheet
      .getRange(
        1,
        1,
        1,
        5
      )
      .setValues([
        encabezados
      ]);

    return;

  }


  // ----------------------------------------------------------
  // LEER ENCABEZADOS ACTUALES
  // ----------------------------------------------------------

  const actual =
    sheet
      .getRange(
        1,
        1,
        1,
        Math.max(
          5,
          sheet.getLastColumn()
        )
      )
      .getDisplayValues()[0];


  // ----------------------------------------------------------
  // CASO 1:
  // YA ESTÁ CORRECTA
  // ----------------------------------------------------------

  if (

    actual[0] === "Fecha" &&

    actual[1] === "Hora" &&

    actual[2] === "Regional" &&

    actual[3] === "Factura" &&

    actual[4] === "Premio"

  ) {

    return;

  }


  // ----------------------------------------------------------
  // CASO 2:
  // ESTRUCTURA ANTIGUA
  //
  // Fecha | Hora | Factura | Premio
  //
  // Se inserta Regional en C.
  // ----------------------------------------------------------

  if (

    actual[0] === "Fecha" &&

    actual[1] === "Hora" &&

    actual[2] === "Factura" &&

    actual[3] === "Premio"

  ) {

    sheet.insertColumnBefore(3);


    sheet
      .getRange(
        1,
        1,
        1,
        5
      )
      .setValues([
        encabezados
      ]);


    return;

  }


  // ----------------------------------------------------------
  // CASO 3:
  // ESTRUCTURA DESCONOCIDA
  // ----------------------------------------------------------

  sheet
    .getRange(
      1,
      1,
      1,
      5
    )
    .setValues([
      encabezados
    ]);

}


// ============================================================
// CONFIGURAR HOJA MANUALMENTE
// ============================================================

function configurarHoja() {

  const spreadsheet =
    SpreadsheetApp.openById(
      SHEET_ID
    );


  let sheet =
    spreadsheet.getSheetByName(
      SHEET_NAME
    );


  if (!sheet) {

    sheet =
      spreadsheet.insertSheet(
        SHEET_NAME
      );

  }


  prepararEncabezados(
    sheet
  );


  Logger.log(
    "Hoja configurada correctamente."
  );

}


// ============================================================
// RESPUESTA
// ============================================================

function respuesta(mensaje) {

  return ContentService

    .createTextOutput(
      mensaje
    )

    .setMimeType(
      ContentService.MimeType.TEXT
    );

}