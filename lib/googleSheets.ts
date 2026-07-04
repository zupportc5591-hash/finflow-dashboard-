// Using a simpler approach to fetch public sheet data
// For public sheets, we can use the fetch API with the sheet's CSV export URL
// or the Google Sheets API without auth if the sheet is public.
// Given we need structured data, let's use a simpler fetch approach with the CSV export URL.

export async function getSheetData(spreadsheetId: string, sheetName: string) {
  console.log('getSheetData called with ID:', spreadsheetId, 'and Sheet:', sheetName);
  const url = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:json&sheet=${sheetName}`;
  
  try {
    const response = await fetch(url);
    console.log('Fetch response status:', response.status);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    
    const text = await response.text();
    console.log('Raw response length:', text.length);
    
    // Google returns a JSONP-like response
    const jsonString = text.substring(47).slice(0, -2);
    const json = JSON.parse(jsonString);
    
    if (!json.table || !json.table.rows) {
      console.warn('No data found in sheet or unexpected structure');
      return [];
    }
    
    const rows = json.table.rows.map((row: any) => 
      row.c.map((cell: any) => cell ? cell.v : null)
    );
    
    return rows;
  } catch (error) {
    console.error('Error fetching sheet data:', error);
    return [];
  }
}
