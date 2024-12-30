const { google } = require('googleapis');

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
const SPREADSHEET_ID = process.env.REACT_APP_GOOGLE_SHEETS_SPREADSHEET_ID;

const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.REACT_APP_GOOGLE_SHEETS_CLIENT_EMAIL,
    private_key: process.env.REACT_APP_GOOGLE_SHEETS_PRIVATE_KEY.replace(/\\n/g, '\n'),
  },
  scopes: SCOPES,
});

const sheets = google.sheets({ version: 'v4', auth });

module.exports = {
  sheets,
  SPREADSHEET_ID,
};
