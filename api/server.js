const express = require('express');
const bodyParser = require('body-parser');
const { google } = require('googleapis');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
const SPREADSHEET_ID = process.env.REACT_APP_GOOGLE_SHEETS_SPREADSHEET_ID;

// Check if environment variables are loaded correctly
if (!SPREADSHEET_ID || !process.env.REACT_APP_GOOGLE_SHEETS_CLIENT_EMAIL || !process.env.REACT_APP_GOOGLE_SHEETS_PRIVATE_KEY) {
  console.error('❌ [Config Error] Missing environment variables. Please ensure REACT_APP_GOOGLE_SHEETS_SPREADSHEET_ID, REACT_APP_GOOGLE_SHEETS_CLIENT_EMAIL, and REACT_APP_GOOGLE_SHEETS_PRIVATE_KEY are set.');
  process.exit(1);
}

// Google Sheets API authentication
const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.REACT_APP_GOOGLE_SHEETS_CLIENT_EMAIL,
    private_key: process.env.REACT_APP_GOOGLE_SHEETS_PRIVATE_KEY.replace(/\\n/g, '\n'),
  },
  scopes: SCOPES,
});

const sheets = google.sheets({ version: 'v4', auth });

app.use(cors());
app.use(bodyParser.json());

// Enhanced console log with timestamps and log levels
function log(level, message, data = {}) {
  console.log(`${new Date().toISOString()} [${level}] ${message}`, data);
}

// Utility function to format RUT
const formatRUT = (rut) => {
  return rut ? rut.replace(/[^0-9kK]/g, '').toUpperCase() : '';
};

// Function to retrieve data from Google Sheets
async function getSheetData(sheetId, range) {
  try {
    log('INFO', 'Fetching data from Google Sheets', { sheetId, range });
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: range,
    });
    log('SUCCESS', 'Data fetched successfully from Google Sheets', { rowCount: response.data.values.length });
    return response.data.values || [];
  } catch (error) {
    log('ERROR', `Failed to fetch data from Google Sheets: ${error.message}`, { sheetId, range });
    throw new Error('Google Sheets data retrieval failed');
  }
}

// Function to handle the data fetching logic
async function handleDataFetch(rut, res) {
  if (!rut) {
    log('WARN', 'RUT not provided in request');
    return res.status(400).json({ success: false, error: 'El RUT es obligatorio' });
  }

  try {
    log('INFO', 'Attempting to fetch data for RUT', { rut });
    const sheetData = await getSheetData(SPREADSHEET_ID, 'Hoja 1!A2:AD'); // Range adjusted to include column AD

    // Log total rows fetched
    log('DEBUG', 'Sheet Data Retrieved', { totalRows: sheetData.length });

    // Filter rows for the given RUT
    const filteredRows = sheetData.filter(row => row[10] && formatRUT(row[10]) === formatRUT(rut));
    
    if (filteredRows.length === 0) {
      log('WARN', 'No data found for RUT', { rut });
      return res.status(404).json({ success: false, error: `No se encuentra RUT: ${rut}` });
    }

    // Log details of found rows
    log('INFO', 'Found data for RUT', { rut, rowsFound: filteredRows.length });

    // Prepare the response data
    const data = {
      nombre: filteredRows[0][11],
      rut: filteredRows[0][10],
      juntaVecinos: filteredRows[0][28] || 'No disponible',
      direccionRetiro: filteredRows[0][29] || 'No disponible',
      gifts: filteredRows.map((row, index) => {
        let status;
        switch (row[6]) {
          case 'Cumple':
            status = 'green';
            break;
          case 'No cumple':
            status = 'red';
            break;
          case 'Cumple con observaciones':
            status = 'yellow';
            break;
          default:
            status = 'blank';
        }

        let observacion = row[5] ? row[5].trim() : 'Sin observaciones'; // Check the column that stores observations

        return {
          id: `gift${index + 1}`,
          name: row[17] || 'Desconocido',
          status: status,
          observacion: observacion || 'Sin observaciones', // Ensure no empty string for observation
        };
      }),
    };

    // Log the response data for debugging purposes
    log('INFO', 'Data successfully prepared for response', data);

    // Send the data back to the client
    res.status(200).json({ success: true, data });
  } catch (error) {
    log('ERROR', 'Error while handling data fetch', { error: error.message });
    res.status(500).json({ success: false, error: 'Internal server error', details: error.message });
  }
}

// GET endpoint to retrieve the data by RUT
app.get('/api/getData', async (req, res) => {
  const { rut } = req.query;
  log('INFO', 'GET request received', { rut });
  await handleDataFetch(rut, res);
});

// POST endpoint to retrieve the data by RUT
app.post('/api/getData', async (req, res) => {
  const { rut } = req.body;
  log('INFO', 'POST request received', { rut });
  await handleDataFetch(rut, res);
});

// Start the server
app.listen(port, () => {
  log('INFO', `Server running on port ${port}`, { port });
  console.log('API Endpoints:');
  console.log('  GET /api/getData?rut=<your_rut> - Retrieve data for a specific RUT');
  console.log('  POST /api/getData - Retrieve data for a specific RUT with a JSON body { "rut": "<your_rut>" }');
});
