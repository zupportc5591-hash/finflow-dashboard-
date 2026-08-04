'use client';
import { useState, useEffect } from 'react';
import SummaryCard from '@/components/SummaryCard';
import { OverdueTableAdvanced } from '@/components/OverdueTableAdvanced';
import { getSheetData } from '@/lib/googleSheets';

const SHEET_ID = '151piROO58-UHrrRmhBX9PD6RvdiiOjMMMaXE6wInwaQ';
const ADDITIONAL_SHEET_ID = '16mIGhs05nydPrZEqVXg8aFeez-6cV3t2VyHZibccpc4';

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
  const [monthlyReceivedCases, setMonthlyReceivedCases] = useState(0);
  const [monthlyFeeIncome, setMonthlyFeeIncome] = useState(0);
  const [riderMileage, setRiderMileage] = useState<{ [key: string]: number }>({});
  const [historyData, setHistoryData] = useState<any[]>([]);

  useEffect(() => {
    async function fetchData() {
      try {
        console.log('Fetching Template data...');
        const allTemplateData = await getSheetData(SHEET_ID, 'Template');
        console.log('Template Data (Headers):', allTemplateData[0]);
        console.log('Template Data (Sample Row 1):', allTemplateData[1]);
        
        if (!allTemplateData || allTemplateData.length <= 1) {
          console.warn('Template data too short or invalid');
          return;
        }
        const templateData = allTemplateData.slice(1);
        
        const stepMap = new Map<string, string>();
        templateData.forEach((row: any) => {
          if (row && Array.isArray(row)) {
            const id = row[0]; 
            const step = row[12]; 
            if (id) stepMap.set(id, step || '-');
          }
        });
        
        console.log('Fetching Dashboard data...');
        const allDashboardData = await getSheetData(ADDITIONAL_SHEET_ID, 'Dashboard');
        const dashboardData = allDashboardData && allDashboardData.length > 1 ? allDashboardData.slice(1) : [];
        
        console.log('Fetching Additional data...');
        const allAdditionalData = await getSheetData(ADDITIONAL_SHEET_ID, 'Dashboard PC');
        const additionalData = allAdditionalData && allAdditionalData.length > 1 ? allAdditionalData.slice(1) : [];
      
        const parseSheetDate = (dateStr: any) => {
            if (!dateStr || typeof dateStr !== 'string') return null;
            const match = dateStr.match(/Date\((\d+),(\d+),(\d+)\)/);
            if (match) return `${match[1]}-${(parseInt(match[2]) + 1).toString().padStart(2, '0')}-${match[3].padStart(2, '0')}`;
            const parts = dateStr.split('/');
            if (parts.length === 3) return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
            return null;
        };

        let dailyCasesCount = 0, dailyAmountSum = 0, dailyAdditionalSum = 0;
        let accumulatedCasesCount = 0, accumulatedAmountSum = 0, accumulatedAdditionalSum = 0;
        let todayCasesReceivedCount = 0, accumulatedAmountReceivedSum = 0, accumulatedIncomeSum = 0, pendingAmountSum = 0;
        let overdueCasesList: any[] = [];
        let monthlyReceivedCasesCount = 0, monthlyFeeIncomeSum = 0, monthlyFeeIncomeCount = 0;
        let riderMileageMap: { [key: string]: number } = { "ตุ๋ย": 0, "พี": 0 };

        const selectedDateObj = new Date(selectedDate);
        const selectedMonth = selectedDateObj.getMonth();
        const selectedYear = selectedDateObj.getFullYear();

        templateData.forEach((row: any) => {
            if (!row || !Array.isArray(row)) return;
            const rowDateStr = parseSheetDate(row[14]);
            // Robust parsing: remove commas and other non-numeric chars except decimal point
            const amountStr = String(row[34] || '0').replace(/[^0-9.-]+/g, '');
            const amount = parseFloat(amountStr) || 0;

            if (rowDateStr) {
                // Debug log
                console.log(`[Debug] Row Date: ${rowDateStr}, Amount: ${amount}, Selected Date: ${selectedDate}`);
                
                const rowDate = new Date(rowDateStr);
                if (rowDateStr === selectedDate) {
                    dailyCasesCount += 1; dailyAmountSum += amount;
                }
                if (rowDate.getMonth() === selectedMonth && rowDate.getFullYear() === selectedYear) {
                    accumulatedCasesCount += 1; accumulatedAmountSum += amount;
                }
            }
        });
        
        additionalData.forEach((row: any) => {
            if (!row || !Array.isArray(row)) return;
            const rowDateStr = parseSheetDate(row[1]);
            if (rowDateStr) {
                const rowDate = new Date(rowDateStr);
                const amount = parseFloat(row[12]) || 0;
                if (rowDateStr === selectedDate) dailyAdditionalSum += amount;
                if (rowDate.getMonth() === selectedMonth && rowDate.getFullYear() === selectedYear) accumulatedAdditionalSum += amount;
            }
        });

        // Monthly Analytics date range
        const day = selectedDateObj.getDate();
        let startDate, endDate;
        if (day >= 26) {
            startDate = new Date(selectedYear, selectedMonth, 26);
            endDate = new Date(selectedYear, selectedMonth + 1, 25);
        } else {
            startDate = new Date(selectedYear, selectedMonth - 1, 26);
            endDate = new Date(selectedYear, selectedMonth, 25);
        }

        dashboardData.forEach((row: any) => {
            if (!row || !Array.isArray(row)) return;
            if (!row[13]) pendingAmountSum += parseFloat(row[11]) || 0;
            
            const type = row[4], exceededDays = parseFloat(row[19]) || 0;
            const latestStep = stepMap.get(row[1]) || type;
            if ((type === 'จำนำ' && exceededDays > 10) || (type === 'HP' && exceededDays > 20)) {
                overdueCasesList.push({ id: row[1], name: row[2], latestStep, exceededDays, dates: {} });
            }

            const rowDateStr = parseSheetDate(row[12]);
            if (rowDateStr) {
                const rowDate = new Date(rowDateStr);
                if (rowDateStr === selectedDate) todayCasesReceivedCount += 1;
                if (rowDate.getMonth() === selectedMonth && rowDate.getFullYear() === selectedYear) {
                    accumulatedAmountReceivedSum += parseFloat(row[13]) || 0;
                    accumulatedIncomeSum += parseFloat(row[15]) || 0;
                }
                if (rowDate >= startDate && rowDate <= endDate) {
                    if (row[13]) monthlyReceivedCasesCount += 1;
                    monthlyFeeIncomeSum += parseFloat(row[8]) || 0;
                    monthlyFeeIncomeCount += 1;
                }
                if (rowDate.getMonth() === selectedMonth && rowDate.getFullYear() === selectedYear) {
                    const rider = row[20], mileage = parseFloat(row[21]) || 0;
                    if (rider) riderMileageMap[rider] = (riderMileageMap[rider] || 0) + mileage;
                }
            }
        });
        
        setDailyCases(dailyCasesCount);
        setDailyAmount(dailyAmountSum);
        setDailyAdditional(dailyAdditionalSum);
        setAccumulatedCases(accumulatedCasesCount);
        setAccumulatedAmount(accumulatedAmountSum);
        setAccumulatedAdditional(accumulatedAdditionalSum);
        setTodayCasesReceived(todayCasesReceivedCount);
        setAccumulatedAmountReceived(accumulatedAmountReceivedSum);
        setAccumulatedIncome(accumulatedIncomeSum);
        setPendingAmount(pendingAmountSum);
        setOverdueCases(overdueCasesList);
        setMonthlyReceivedCases(monthlyReceivedCasesCount);
        setMonthlyFeeIncome(monthlyFeeIncomeSum - (monthlyFeeIncomeCount * 1000));
        setRiderMileage(riderMileageMap);

      } catch (error) {
        console.error('Error fetching data:', error);
      }
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
            <section className="mt-8">
              <h2 className="text-xl font-bold text-text-main mb-6">ข้อมูลสรุปประจำเดือน</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <SummaryCard title="จำนวนเคสที่ได้รับเงินในเดือนนี้" value={monthlyReceivedCases.toString()} />
                <SummaryCard title="รายได้จากค่าธรรมเนียมใช้วงเงิน (เดือนนี้)" value={`฿${monthlyFeeIncome.toLocaleString()}`} />
              </div>

              <div className="bg-bg-card rounded-xl border border-border overflow-hidden">
                <div className="p-4 border-b border-border">
                  <h3 className="font-bold text-text-main">จำนวน กม. ของ Rider แต่ละคน</h3>
                </div>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-text-muted border-b border-border">
                      <th className="p-4 text-left">ชื่อ Rider</th>
                      <th className="p-4 text-right">ระยะทางรวม (กม.)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {Object.entries(riderMileage).map(([rider, mileage]) => (
                      <tr key={rider} className="hover:bg-white/5 transition-colors">
                        <td className="p-4">{rider}</td>
                        <td className="p-4 text-right">{mileage.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
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
