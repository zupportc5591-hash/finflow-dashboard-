import { GoogleAuth } from 'google-auth-library';
import { google } from 'googleapis';
import { NextResponse } from 'next/server';

const SHEET_ID = '1C5Th5V8I6homdPsm6FJbwLpSIpiCAGXnhMWsXMP8knw';
const FOLDER_ID = '1sSw_OywQLhawFLbd0MySezuHlZNUiRZb';
const STATUS_COL_INDEX = 52; // Column BA

export async function POST() {
  try {
    const credentialsJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
    if (!credentialsJson) {
      console.error('GOOGLE_SERVICE_ACCOUNT_JSON is not set');
      return NextResponse.json({ error: 'Configuration error' }, { status: 500 });
    }
    const auth = new GoogleAuth({
      credentials: JSON.parse(credentialsJson),
      scopes: ['https://www.googleapis.com/auth/spreadsheets', 'https://www.googleapis.com/auth/drive.file'],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    const drive = google.drive({ version: 'v3', auth });

    // 1. Fetch data (simplified fetch of the active month tab)
    // In a real scenario, you might need to iterate through all month tabs
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: 'FFJul 26!A:BA',
    });

    const rows = response.data.values || [];
    const headers = rows[0];

    // 2. Identify rows that need a voucher (BA is empty)
    for (let i = 1; i < rows.length; i++) {
      if (!rows[i][STATUS_COL_INDEX]) {
        // --- 3. Logic to generate PDF (Placeholder) ---
        // For now, we simulate PDF content and upload it.
        // You would use a library like 'puppeteer' or 'pdfkit' here.
        const fileName = `PaymentVoucher_${rows[i][0]}_${new Date().getTime()}.txt`;
        const fileContent = `Voucher for ${rows[i][3]} - Amount: ${rows[i][33]}`;

        // 4. Upload to Google Drive
        const file = await drive.files.create({
          requestBody: {
            name: fileName,
            parents: [FOLDER_ID],
          },
          media: {
            mimeType: 'text/plain', // Change to application/pdf later
            body: fileContent,
          },
          fields: 'id',
          supportsAllDrives: true,
        });

        // 5. Update Sheet
        await sheets.spreadsheets.values.update({
          spreadsheetId: SHEET_ID,
          range: `FFJul 26!BA${i + 1}`,
          valueInputOption: 'RAW',
          requestBody: { values: [['Generated']] },
        });
      }
    }

    return NextResponse.json({ message: 'Vouchers processed successfully' });
  } catch (error: any) {
    console.error('Error generating vouchers:', error);
    return NextResponse.json({ error: error.message || 'Failed to process vouchers' }, { status: 500 });
  }
}
