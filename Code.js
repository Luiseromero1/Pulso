/**
 * @OnlyCurrentDoc
 */

/**
 * CÓDIGO.GS (VERSIÓN FINAL)
 * Este archivo contiene toda la lógica del lado del servidor.
 */
function doGet(e) {
  return HtmlService.createTemplateFromFile('Index')
      .evaluate()
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.DEFAULT);
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

function getMenuData() {
  try {
    const userEmail = Session.getActiveUser().getEmail();
    const projectId = 'bigquerypruebas-464902';
    const sql = `SELECT * FROM \`bigquerypruebas-464902.inspecciones_db.obtener_menu_por_usuario\`('${userEmail}');`;
    const request = { query: sql, useLegacySql: false };
    
    let queryResults = BigQuery.Jobs.query(request, projectId);
    const jobId = queryResults.jobReference.jobId;
    
    while (!queryResults.jobComplete) {
      Utilities.sleep(300);
      queryResults = BigQuery.Jobs.getQueryResults(projectId, jobId);
    }
    
    let allRows = [];
    if (queryResults.rows) {
      allRows = allRows.concat(queryResults.rows);
    }

    let pageToken = queryResults.pageToken;
    while (pageToken) {
      const nextPageResult = BigQuery.Jobs.getQueryResults(projectId, jobId, { pageToken: pageToken });
      if (nextPageResult.rows) {
        allRows = allRows.concat(nextPageResult.rows);
      }
      pageToken = nextPageResult.pageToken;
    }

    let menuItems = [];
    if (allRows.length > 0) {
      const headers = queryResults.schema.fields.map(field => field.name);
      menuItems = allRows.map(row => {
        const rowData = {};
        row.f.forEach((cell, index) => {
          rowData[headers[index]] = cell.v;
        });
        return rowData;
      });
    }
    
    Logger.log("Total de elementos recuperados de BigQuery: " + menuItems.length);
    Logger.log(JSON.stringify(menuItems, null, 2));

    return {
      user: { email: userEmail },
      menuData: menuItems
    };

  } catch (e) {
    Logger.log("Error en getMenuData: " + e.toString());
    return { error: e.toString() };
  }
}
