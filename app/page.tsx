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
      const templateData = (await getSheetData(SHEET_ID, 'Template')).slice(1);
      
      const parseSheetDate = (dateStr: any) => {
        if (!dateStr || typeof dateStr !== 'string') return null;
        
        // Handle 'Date(y,m,d)' format
        const match = dateStr.match(/Date\((\d+),(\d+),(\d+)\)/);
        if (match) return `${match[1]}-${(parseInt(match[2]) + 1).toString().padStart(2, '0')}-${match[3].padStart(2, '0')}`;
        
        // Handle 'DD/MM/YYYY' format
        const parts = dateStr.split('/');
        if (parts.length === 3) {
          const day = parts[0].padStart(2, '0');
          const month = parts[1].padStart(2, '0');
          const year = parts[2];
          return `${year}-${month}-${day}`;
        }
        return null;
      };

      const dailyCasesCount = templateData.reduce((count: number, row: any, index: number) => {
        const rowDateStr = parseSheetDate(row[16]); // Col Q (Index 16)
        if (index < 5) console.log(`Row ${index} - Col Q Date Str: ${row[16]}, Parsed Date: ${rowDateStr}, Selected: ${selectedDate}`);
        
        if (rowDateStr === selectedDate) {
          return count + 1;
        }
        return count;
      }, 0);
      
      console.log('Calculated dailyCasesCount:', dailyCasesCount);
      setDailyCases(dailyCasesCount);

      setDailyAmount(0);
      setDailyAdditional(0);
      setAccumulatedCases(0);
      setAccumulatedAmount(0);
      setAccumulatedAdditional(0);
      setTodayCasesReceived(0);
      setAccumulatedAmountReceived(0);
      setAccumulatedIncome(0);
      setPendingAmount(0);
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
