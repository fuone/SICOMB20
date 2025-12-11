
/* 
# Configuração do Google Sheets (Backend)

Para conectar este aplicativo ao Google Sheets, siga os passos abaixo:

1. Crie uma nova Planilha Google.
2. **Renomeie a aba principal (geralmente "Página1") para "MAIN".**
3. Na primeira linha da aba "MAIN", começando na coluna **C** até a coluna **Q** (Intervalo **C1:Q1**), crie os seguintes cabeçalhos (exatamente nesta ordem):
   `id`, `data`, `veiculo`, `km`, `posto`, `combustivel`, `precoL`, `precoB`, `formaPagto`, `app`, `qtd`, `total`, `obs`, `user`, `active`
   *(Nota: A ordem das colunas foi alterada para incluir o veículo logo após a data)*.
4. No menu, vá em **Extensões** > **Apps Script**.
5. Apague todo o código do arquivo `Code.gs` e cole o código abaixo.

**Nota:** 
- O código abaixo foi configurado para buscar as opções de cadastro na planilha de configurações (`1lKGQJ3LUMOGgIQALcwJaQ3VVelT1gWPgFPmkpLpxv0w`).
- Os carros estão no intervalo R3:T17 da planilha de configurações.
- Os registros de abastecimento serão lidos e gravados estritamente no intervalo **C1:Q** da aba **MAIN**.
*/
```javascript
// ID da planilha de configurações fornecido
const CONFIG_SPREADSHEET_ID = "1lKGQJ3LUMOGgIQALcwJaQ3VVelT1gWPgFPmkpLpxv0w";
const DATA_RANGE = "C1:Q1000"; // Intervalo de dados (Aumentado para suportar mais linhas)
const START_COL = 3; // Coluna C é a coluna 3

function doGet(e) {
  const action = e.parameter.action;
  
  // Ação para ler os registros da aba MAIN
  if (action === 'read') {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("MAIN");
    
    if (!sheet) {
      return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: 'Aba "MAIN" não encontrada.' }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // Pega valores do intervalo fixo
    const data = sheet.getRange(DATA_RANGE).getValues();
    const headers = data.shift(); // Remove headers (primeira linha do range)
    
    // Filtra linhas vazias (onde o ID, coluna 0 do range, é vazio)
    // NOVA ORDEM: id(0), data(1), veiculo(2), km(3), posto(4), combustivel(5), precoL(6), precoB(7), formaPagto(8), app(9), qtd(10), total(11), obs(12), user(13), active(14)
    const records = data
      .filter(row => row[0] !== "" && row[0] !== null)
      .map(row => {
        return {
          id: row[0],
          data: formatDate(row[1]),
          veiculo: row[2],
          km: row[3],
          posto: row[4],
          combustivel: row[5],
          precoL: row[6],
          precoBomba: row[7] || row[6],
          formaPagto: row[8],
          app: row[9],
          qtd: row[10],
          total: row[11],
          obs: row[12],
          user: row[13],
          active: row[14]
        };
      });
    
    return ContentService.createTextOutput(JSON.stringify({ status: 'success', data: records }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  // AÇÃO: Buscar opções de configuração da planilha específica
  if (action === 'config') {
    try {
      const configSs = SpreadsheetApp.openById(CONFIG_SPREADSHEET_ID);
      const configSheet = configSs.getSheets()[0]; 

      function getList(rangeA1) {
        const rows = configSheet.getRange(rangeA1).getValues();
        return rows
          .filter(function(row) {
            const value = row[0];
            // Se tiver segunda coluna (checkbox de ativo), verifica
            if (row.length > 1 && typeof row[1] === 'boolean') {
                 return value !== "" && value !== null && row[1] === true;
            }
            return value !== "" && value !== null;
          })
          .map(function(row) {
            return String(row[0]); 
          });
      }

      // Função específica para ler carros (R3:T17) -> [Nome, Padrão?, Ativo?]
      function getVehicles() {
        const rows = configSheet.getRange("R3:T17").getValues();
        const vehicles = [];
        for (let i = 0; i < rows.length; i++) {
            const name = rows[i][0];
            const isDefault = rows[i][1]; // Coluna S
            const isActive = rows[i][2];  // Coluna T
            
            if (name && isActive === true) {
                vehicles.push({
                    name: String(name),
                    isDefault: isDefault === true,
                    isActive: true
                });
            }
        }
        return vehicles;
      }

      const fuels = getList("H3:I15"); // Coluna I é 'Ativo'
      const payments = getList("J3:K30");
      const apps = getList("L3:M15");
      const vehicles = getVehicles();
      
      return ContentService.createTextOutput(JSON.stringify({
        status: 'success',
        data: {
          fuels: fuels,
          payments: payments,
          apps: apps,
          vehicles: vehicles
        }
      })).setMimeType(ContentService.MimeType.JSON);

    } catch (err) {
      return ContentService.createTextOutput(JSON.stringify({ 
        status: 'error', 
        message: 'Erro ao ler configurações: ' + err.toString() 
      })).setMimeType(ContentService.MimeType.JSON);
    }
  }
}

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("MAIN");

    if (!sheet) {
      return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: 'Aba "MAIN" não encontrada.' }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    // Ler todo o range de dados para encontrar espaço vazio ou ID para update
    const rangeData = sheet.getRange(DATA_RANGE).getValues();

    // Adapter: Frontend envia 'precoBomba', backend usa coluna 7 (precoB)
    const precoBombaVal = body.precoB || body.precoBomba || body.precoL;

    // Constroi array na ordem correta das colunas
    const rowData = [
        body.id,
        body.data,
        body.veiculo || '', // Coluna C (Index 2)
        body.km,
        body.posto,
        body.combustivel,
        body.precoL,
        precoBombaVal,
        body.formaPagto,
        body.app || '',
        body.qtd,
        body.total,
        body.obs,
        body.user,
        body.active
    ];

    if (body.action === 'create') {
      let emptyRowIndex = -1;
      for (let i = 1; i < rangeData.length; i++) {
        if (!rangeData[i][0]) {
           emptyRowIndex = i;
           break;
        }
      }

      if (emptyRowIndex === -1) {
         return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: 'Limite de registros atingido.' }))
          .setMimeType(ContentService.MimeType.JSON);
      }

      const sheetRowNum = 1 + emptyRowIndex;
      sheet.getRange(sheetRowNum, START_COL, 1, rowData.length).setValues([rowData]);

      return ContentService.createTextOutput(JSON.stringify({ status: 'success', action: 'create' }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    if (body.action === 'update') {
      const rowIndex = rangeData.findIndex(row => row[0] === body.id);
      if (rowIndex === -1) {
         return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: 'ID not found' }))
          .setMimeType(ContentService.MimeType.JSON);
      }
      const sheetRowNum = 1 + rowIndex;
      sheet.getRange(sheetRowNum, START_COL, 1, rowData.length).setValues([rowData]);
      
      return ContentService.createTextOutput(JSON.stringify({ status: 'success', action: 'update' }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function formatDate(dateVal) {
  if (dateVal instanceof Date) {
    return dateVal.toISOString().split('T')[0];
  }
  return dateVal;
}
```