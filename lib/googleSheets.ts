// Using a simpler approach to fetch public sheet data
// For public sheets, we can use the fetch API with the sheet's CSV export URL
// or the Google Sheets API without auth if the sheet is public.
// Given we need structured data, let's use a simpler fetch approach with the CSV export URL.

export async function getSheetData(spreadsheetId: string, sheetName: string) {
  console.log('getSheetData called with ID:', spreadsheetId, 'and Sheet:', sheetName);
  const url = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(sheetName)}&range=A:AI`;
  
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    
    const text = await response.text();
    const openParen = text.indexOf('(');
    const closeParen = text.lastIndexOf(')');
    
    if (openParen === -1 || closeParen === -1) {
        console.error('Invalid Google Sheets response format');
        return [];
    }
    
    const jsonString = text.substring(openParen + 1, closeParen);
    const json = JSON.parse(jsonString);
    
    if (!json.table || !Array.isArray(json.table.rows)) {
      console.warn('No valid table rows found in sheet');
      return [];
    }
    
    const headers = json.table.cols ? json.table.cols.map((col: any) => col.label) : [];
    const rows = json.table.rows.map((row: any) => 
      row.c ? row.c.map((cell: any) => (cell ? cell.v : null)) : []
    );
    
    return [headers, ...rows];
  } catch (error) {
    console.error('Error fetching sheet data:', error);
    return [];
  }
}
