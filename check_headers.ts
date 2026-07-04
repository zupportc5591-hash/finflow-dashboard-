import { getSheetData } from './lib/googleSheets';

const SHEET_ID = '1C5Th5V8I6homdPsm6FJbwLpSIpiCAGXnhMWsXMP8knw';

async function getHeaders() {
  const data = await getSheetData(SHEET_ID, 'FFJul 26');
  console.log('Headers:', data[0]);
}

getHeaders();
