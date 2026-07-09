'use client';
import { useState, useEffect } from 'react';
import SummaryCard from '@/components/SummaryCard';
import { OverdueTableAdvanced } from '@/components/OverdueTableAdvanced';
import DataTable from '@/components/DataTable';
import { getSheetData } from '@/lib/googleSheets';

const SHEET_ID = '1C5Th5V8I6homdPsm6FJbwLpSIpiCAGXnhMWsXMP8knw';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'daily' | 'monthly' | 'history'>('daily');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [dailyCases, setDailyCases] = useState(0);
  const [dailyAmount, setDailyAmount] = useState(0);
  const [monthlyAccumulatedCases, setMonthlyAccumulatedCases] = useState(0);
  const [monthlyAccumulatedAmount, setMonthlyAccumulatedAmount] = useState(0);
  const [moneyForHeartAmount, setMoneyForHeartAmount] = useState(0);
  const [pendingMoneyForHeartAmount, setPendingMoneyForHeartAmount] = useState(0);
  const [overdueCases, setOverdueCases] = useState<any[]>([]);
  const [historyData, setHistoryData] = useState<any[]>([]);

  useEffect(() => {
    async function fetchData() {
      const current = new Date(selectedDate);
      
      // Calculate tabs: All months for the current year
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const tabs = months.map(m => `FF${m} ${current.getFullYear().toString().slice(-2)}`);
      
      const allTabsData = await Promise.all(tabs.map(tab => getSheetData(SHEET_ID, tab)));
      const allRows = allTabsData.flat().slice(1); // Assuming first row is header

      // --- NEW: History Data Calculation ---
      const histData = months.map((month, index) => {
          const startRange = new Date(current.getFullYear(), index, 26);
          const endRange = new Date(current.getFullYear(), index + 1, 25);
          
          const filtered = allRows.filter((row: any) => {
            if (!row[12] || !String(row[12]).includes('Date(')) return false;
            const match = String(row[12]).match(/Date\((\d+),(\d+),(\d+)\)/);
            if (!match) return false;
            const rowDate = new Date(parseInt(match[1]), parseInt(match[2]), parseInt(match[3]));
            return rowDate >= startRange && rowDate <= endRange;
          });

          // MfH filtered for this range
          const mfhFiltered = allRows.filter((row: any) => {
            if (!row[23] || !String(row[23]).includes('Date(')) return false;
            const match = String(row[23]).match(/Date\((\d+),(\d+),(\d+)\)/);
            if (!match) return false;
            const rowDate = new Date(parseInt(match[1]), parseInt(match[2]), parseInt(match[3]));
            return rowDate >= startRange && rowDate <= endRange;
          });
          const mfhTotal = mfhFiltered.reduce((sum: number, row: any) => sum + (parseFloat(row[41]) || 0), 0);
          
          return {
              month,
              cases: filtered.length,
              amount: Math.round(filtered.reduce((sum: number, row: any) => sum + (parseFloat(row[33]) || 0), 0) * 100) / 100,
              mfhIncome: Math.round(mfhTotal * 100) / 100
          };
      });
      setHistoryData(histData);
      // --- END NEW ---

      // 1. Daily Calculation (From current tab)
      const currentTabName = `FF${current.toLocaleString('en-US', { month: 'short' })} ${current.getFullYear().toString().slice(-2)}`;
      const currData = await getSheetData(SHEET_ID, currentTabName);
      
      const dailyFiltered = currData.slice(1).filter((row: any) => {
        if (!row[12] || !String(row[12]).includes('Date(')) return false;
        const match = String(row[12]).match(/Date\((\d+),(\d+),(\d+)\)/);
        if (!match) return false;
        const normalizedDate = `${match[1]}-${(parseInt(match[2]) + 1).toString().padStart(2, '0')}-${match[3].padStart(2, '0')}`;
        return normalizedDate === selectedDate;
      });

      setDailyCases(dailyFiltered.length);
      const dailyTotal = dailyFiltered.reduce((sum: number, row: any) => sum + (parseFloat(row[33]) || 0), 0);
      setDailyAmount(Math.round(dailyTotal * 100) / 100);

      // 2. Monthly Calculation (26th of month X to 25th of month X+1)
      let startRange, endRange;
      if (current.getDate() >= 26) {
        startRange = new Date(current.getFullYear(), current.getMonth(), 26);
        endRange = new Date(current.getFullYear(), current.getMonth() + 1, 25);
      } else {
        startRange = new Date(current.getFullYear(), current.getMonth() - 1, 26);
        endRange = new Date(current.getFullYear(), current.getMonth(), 25);
      }

      const monthlyFiltered = allRows.filter((row: any) => {
        if (!row[12] || !String(row[12]).includes('Date(')) return false;
        const match = String(row[12]).match(/Date\((\d+),(\d+),(\d+)\)/);
        if (!match) return false;
        const rowDate = new Date(parseInt(match[1]), parseInt(match[2]), parseInt(match[3]));
        return rowDate >= startRange && rowDate <= endRange;
      });
      
      setMonthlyAccumulatedCases(monthlyFiltered.length);
      const monthlyTotal = monthlyFiltered.reduce((sum: number, row: any) => sum + (parseFloat(row[33]) || 0), 0);
      setMonthlyAccumulatedAmount(Math.round(monthlyTotal * 100) / 100);
      
      // 3. New MfH Logic (Col X/23 Date, Sum AP(41) - AK(36) or AQ(42) - AK(36))
      const mfhSheetName = 'งานส่วนกลาง ปี 2569';
      const mfhSheetData = await getSheetData(SHEET_ID, mfhSheetName);
      
      const parseCustomDate = (dateStr: any) => {
        if (!dateStr) return null;
        const match = String(dateStr).match(/Date\((\d+),(\d+),(\d+)\)/);
        if (match) return new Date(parseInt(match[1]), parseInt(match[2]), parseInt(match[3]));
        
        const parts = String(dateStr).split('/');
        if (parts.length === 3) {
            const day = parseInt(parts[0]);
            const month = parseInt(parts[1]) - 1;
            const year = parseInt(parts[2]);
            return new Date(year, month, day);
        }
        return null;
      };
      
      const mfhFiltered = mfhSheetData.slice(1).filter((row: any, index: number) => {
        const rowDate = parseCustomDate(row[23]);
        if (index < 5) console.log(`Row ${index} - Col 23: ${row[23]}, Parsed Date: ${rowDate}, InRange: ${rowDate && rowDate >= startRange && rowDate <= endRange}`);
        return rowDate && rowDate >= startRange && rowDate <= endRange;
      });
      
      const mfhTotal = mfhFiltered.reduce((sum: number, row: any) => {
          const rowDate = parseCustomDate(row[23]);
          if (!rowDate) return sum;
          
          const ak = parseFloat(row[36]) || 0;
          const incomeCol = (rowDate >= new Date(2026, 6, 1)) ? 42 : 41;
          const income = parseFloat(row[incomeCol]) || 0;
          console.log(`MfH Row Calc - Date: ${rowDate}, IncomeCol: ${incomeCol}, Income: ${income}, AK: ${ak}, Result: ${income - ak}`);
          
          return sum + (income - ak);
      }, 0);
      setMoneyForHeartAmount(Math.round(mfhTotal * 100) / 100);

      // Pending MfH Logic (Col M/12 Date, Col X/23 NOT Date, Sum AP/41 or AQ/42, Exclude JAI2603026)
      const pendingMfhFiltered = allRows.filter((row: any) => {
        const id = row[0];
        if (id === 'JAI2603026') return false;
        
        const isDateM = row[12] && String(row[12]).includes('Date(');
        const isDateX = row[23] && String(row[23]).includes('Date(');
        return isDateM && !isDateX;
      });

      const pendingMfhTotal = pendingMfhFiltered.reduce((sum: number, row: any) => {
        // Parse date from Col M (index 12)
        const match = String(row[12]).match(/Date\((\d+),(\d+),(\d+)\)/);
        if (!match) return sum;
        const rowDate = new Date(parseInt(match[1]), parseInt(match[2]), parseInt(match[3]));
        
        // Col AP (41) before July 2026, Col AQ (42) from July 2026
        const columnToSum = (rowDate >= new Date(2026, 6, 1)) ? 42 : 41; // July is month 6 (0-indexed)
        const value = parseFloat(row[columnToSum]) || 0;
        return sum + value;
      }, 0);
      
      setPendingMoneyForHeartAmount(Math.round(pendingMfhTotal * 100) / 100);

      // Overdue Case Logic
      const overdueList: any[] = [];
      
      allRows.forEach((row: any) => {
        if (row[23] || row[0] === 'JAI2603026') return; // Col X must be empty AND ID must not be JAI2603026

        const productType = row[31]; // Col AF
        
        const parseDate = (val: any) => {
          if (!val) return null;
          // Check for "Date(year,month,day)" format explicitly
          const match = String(val).match(/Date\((\d+),(\d+),(\d+)\)/);
          if (!match) return null;
          return new Date(parseInt(match[1]), parseInt(match[2]), parseInt(match[3]));
        };

        const dates: { [key: string]: { date: Date | null, colIndex: number } } = {
          M: { date: parseDate(row[12]), colIndex: 12 }, N: { date: parseDate(row[13]), colIndex: 13 },
          O: { date: parseDate(row[14]), colIndex: 14 }, P: { date: parseDate(row[15]), colIndex: 15 },
          Q: { date: parseDate(row[16]), colIndex: 16 }, R: { date: parseDate(row[17]), colIndex: 17 },
          T: { date: parseDate(row[19]), colIndex: 19 }, U: { date: parseDate(row[20]), colIndex: 20 },
          V: { date: parseDate(row[21]), colIndex: 21 }, W: { date: parseDate(row[22]), colIndex: 22 }
        };

        // Determine latest step and total duration
        const stepMap: { [key: string]: string } = {
          N: 'ยิ่นชุดโอน',
          O: 'ได้รับเล่ม',
          P: 'ส่งสำเนาให้jai',
          Q: 'รับเอกสารชุดโอนจากJAI',
          R: 'วันที่นัดลูกค้าไปขนส่ง',
          T: 'ลูกค้าไปตรวจรถ',
          U: 'แจ้งตรวจรถผ่าน',
          V: 'รับเล่มคืนจากขนส่ง',
          W: 'ส่งเล่มให้JAI'
        };
        
        let latestDateCol = '';
        let maxDate = new Date(0);
        Object.entries(dates).forEach(([key, val]) => {
            if (val.date && val.date > maxDate) {
                maxDate = val.date;
                latestDateCol = key;
            }
        });
        const latestStep = stepMap[latestDateCol] || 'ขั้นตอนล่าสุด';

        if (dates.M.date) {
            const today = new Date();
            const totalDays = (today.getTime() - dates.M.date.getTime()) / (1000 * 60 * 60 * 24);
            const limit = productType === 'จำนำ' ? 10 : productType === 'HP' ? 20 : 999;

            if (totalDays > limit) {
               overdueList.push({
                 id: row[0], name: `${row[3]} ${row[4]}`, latestStep, exceededDays: Math.floor(totalDays - limit),
                 dates: Object.fromEntries(Object.entries(dates).filter(([_, v]) => v.date).map(([k, v]) => [k, v.date!.toLocaleDateString()]))
               });
            }
        }
      });
      setOverdueCases(overdueList);
    }
    
    fetchData();
  }, [selectedDate]);

  const tabs = [
    { id: 'daily', label: 'Daily (Back office)' },
    { id: 'monthly', label: 'Monthly (Back office)' },
    { id: 'history', label: 'History' },
  ] as const;

  return (
    <main className="min-h-screen bg-bg-app p-8 md:p-12">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-text-main tracking-tight">Finflow Dashboard</h1>
            <p className="text-text-muted mt-1">สรุปข้อมูลความเคลื่อนไหวธุรกิจ</p>
          </div>
          <div className="text-right">
            <p className="text-text-muted text-sm mb-1">เลือกวันที่</p>
            <input 
              type="date" 
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-bg-card text-text-main border border-border rounded-xl px-6 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-brand-blue w-full md:w-auto"
            />
          </div>
        </header>
        
        <div className="flex gap-2 mt-6 border-b border-border">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-3 font-semibold transition-colors border-b-2 ${
                activeTab === tab.id
                  ? 'border-brand-blue text-brand-blue'
                  : 'border-transparent text-text-muted hover:text-text-main'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        
        <div className="mt-8">
          {activeTab === 'daily' && (
            <section>
              <div className="mb-4 text-text-muted">ข้อมูลประจำวันที่: <span className="font-bold text-text-main">{selectedDate}</span></div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                <SummaryCard title="เคสที่ปิดยอดวันนี้" value={dailyCases.toString()} />
                <SummaryCard title="ยอดเงินที่ปิดวันนี้" value={`฿${dailyAmount.toLocaleString()}`} />
                <SummaryCard title="ปิดสะสมในเดือน (เคส)" value={monthlyAccumulatedCases.toString()} />
                <SummaryCard title="ปิดสะสมในเดือน (ยอดเงิน)" value={`฿${monthlyAccumulatedAmount.toLocaleString()}`} />
                <SummaryCard title="รายได้สะสมจากเงินให้ใจ" value={`฿${moneyForHeartAmount.toLocaleString()}`} />
                <SummaryCard title="เงินค้างรับจากเงินให้ใจ" value={`฿${pendingMoneyForHeartAmount.toLocaleString()}`} />
                </div>
                <OverdueTableAdvanced data={overdueCases} />

            </section>
          )}

          {activeTab === 'monthly' && (
            <section className="text-center text-text-muted p-12">กำลังพัฒนาส่วน Monthly Analytics...</section>
          )}

          {activeTab === 'history' && (
            <section className="mt-8">
              <div className="bg-bg-card rounded-xl border border-border overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-text-muted border-b border-border">
                      <th className="p-4 text-left">เดือน</th>
                      <th className="p-4 text-right">จำนวนเคส</th>
                      <th className="p-4 text-right">ยอดเงิน (฿)</th>
                      <th className="p-4 text-right">รายได้เงินให้ใจ (฿)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {historyData.map((item, i) => (
                      <tr key={i} className="hover:bg-white/5 transition-colors">
                        <td className="p-4 font-semibold">{item.month}</td>
                        <td className="p-4 text-right">{item.cases}</td>
                        <td className="p-4 text-right">{item.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        <td className="p-4 text-right">{item.mfhIncome.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </div>
      </div>
    </main>
  );
}
