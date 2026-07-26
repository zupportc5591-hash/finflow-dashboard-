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
  const [dailyAdditional, setDailyAdditional] = useState(0);
  const [accumulatedCases, setAccumulatedCases] = useState(0);
  const [accumulatedAmount, setAccumulatedAmount] = useState(0);
  const [accumulatedAdditional, setAccumulatedAdditional] = useState(0);
  const [todayCasesReceived, setTodayCasesReceived] = useState(0);
  const [accumulatedAmountReceived, setAccumulatedAmountReceived] = useState(0);
  const [accumulatedIncome, setAccumulatedIncome] = useState(0);
  const [pendingAmount, setPendingAmount] = useState(0);
  const [overdueCases, setOverdueCases] = useState<any[]>([]);
  const [historyData, setHistoryData] = useState<any[]>([]);

  useEffect(() => {
    async function fetchData() {
      const current = new Date(selectedDate);
      
      // Helper: Parse 'Date(y,m,d)' string
      const parseSheetDate = (dateStr: any) => {
        if (!dateStr || typeof dateStr !== 'string') return null;
        const match = dateStr.match(/Date\((\d+),(\d+),(\d+)\)/);
        if (!match) return null;
        return new Date(parseInt(match[1]), parseInt(match[2]), parseInt(match[3]));
      };

      const today = new Date(selectedDate);
      const startOfMonth = new Date(current.getFullYear(), current.getMonth(), 1);
      const endOfMonth = new Date(current.getFullYear(), current.getMonth() + 1, 0);

      // --- 1. Fetch data ---
      const dailyPcData = (await getSheetData(SHEET_ID, 'Dashboard PC')).slice(1);
      const dashboardData = (await getSheetData(SHEET_ID, 'Dashboard')).slice(1);

      // --- 2. Calculate 'ยอดเพิ่มเติม' (Tab 'Dashboard PC', Col B Date, Col M Value) ---
      let dailyAdd = 0;
      let accumAdd = 0;
      dailyPcData.forEach((row: any) => {
        const rowDate = parseSheetDate(row[1]); // Col B
        if (!rowDate) return;
        const val = parseFloat(row[12]) || 0; // Col M
        
        if (rowDate.toDateString() === today.toDateString()) dailyAdd += val;
        if (rowDate >= startOfMonth && rowDate <= endOfMonth) accumAdd += val;
      });
      setDailyAdditional(dailyAdd);
      setAccumulatedAdditional(accumAdd);

      // --- 3. Calculate Financial Metrics (Tab 'Dashboard', Col M Date, Cols N, O, P, L) ---
      let todayCases = 0;
      let accumAmountReceived = 0;
      let accumIncome = 0;
      let pending = 0;

      dashboardData.forEach((row: any) => {
        const rowDate = parseSheetDate(row[12]); // Col M
        
        // Count/Sum Today
        if (rowDate && rowDate.toDateString() === today.toDateString()) {
          todayCases += 1;
        }

        // Sum Accumulated Month
        if (rowDate && rowDate >= startOfMonth && rowDate <= endOfMonth) {
          accumAmountReceived += parseFloat(row[13]) || 0; // Col N
          accumIncome += (parseFloat(row[14]) || 0) + (parseFloat(row[15]) || 0); // Col O+P
        }

        // Pending (Col M has no Date, Col L value)
        if (!rowDate) {
          pending += parseFloat(row[11]) || 0; // Col L
        }
      });
      setTodayCasesReceived(todayCases);
      setAccumulatedAmountReceived(accumAmountReceived);
      setAccumulatedIncome(accumIncome);
      setPendingAmount(pending);
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
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-text-main mb-4 px-1">สรุปข้อมูลประจำวัน</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 bg-bg-card p-4 rounded-xl border border-border">
                  <SummaryCard title="จำนวนเคสปิดวันนี้" value={dailyCases.toString()} />
                  <SummaryCard title="ยอดปิดวงเงินวันนี้" value={`฿${dailyAmount.toLocaleString()}`} />
                  <SummaryCard title="ยอดเพิ่มเติมวันนี้" value={`฿${dailyAdditional.toLocaleString()}`} />
                </div>
              </div>

              <div className="mb-8">
                <h3 className="text-lg font-semibold text-text-main mb-4 px-1">สรุปข้อมูลสะสม</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 bg-bg-card p-4 rounded-xl border border-border">
                  <SummaryCard title="จำนวนเคสปิดวงเงินสะสม" value={accumulatedCases.toString()} />
                  <SummaryCard title="ยอดปิดวงเงินสะสม" value={`฿${accumulatedAmount.toLocaleString()}`} />
                  <SummaryCard title="ยอดเพิ่มเติมสะสม" value={`฿${accumulatedAdditional.toLocaleString()}`} />
                </div>
              </div>

              <div className="mb-8">
                <h3 className="text-lg font-semibold text-text-main mb-4 px-1">ข้อมูลการเงิน</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 bg-bg-card p-4 rounded-xl border border-border">
                  <SummaryCard title="จำนวนเคสรับเงินวันนี้" value={todayCasesReceived.toString()} />
                  <SummaryCard title="ยอดเงินรับสะสม" value={`฿${accumulatedAmountReceived.toLocaleString()}`} />
                  <SummaryCard title="รายได้สะสม" value={`฿${accumulatedIncome.toLocaleString()}`} />
                  <SummaryCard title="จำนวนเงินค้างรับ" value={`฿${pendingAmount.toLocaleString()}`} />
                </div>
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
