// pages/api/retrieveData.js

import { sheets, SPREADSHEET_ID } from '../../lib/sheets';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { rut } = req.body;

    try {
      // Assuming you have a method to search by RUT in your sheet, adjust the range if needed
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: `Hoja 1!A2:AD6798`,  // Example range, adjust as needed
      });

      // Process response to find matching row based on RUT
      const rows = response.data.values;
      const matchedRow = rows.find(row => row[1] === rut); // Assuming RUT is in the 2nd column

      if (matchedRow) {
        // Format matched row data as needed
        res.status(200).json({ success: true, data: matchedRow });
      } else {
        res.status(404).json({ success: false, message: 'RUT not found' });
      }
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  } else {
    res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }
}
