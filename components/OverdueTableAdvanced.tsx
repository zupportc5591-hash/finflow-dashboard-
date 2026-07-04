import React, { useState } from 'react';

type OverdueCase = {
  id: string;
  name: string;
  latestStep: string;
  exceededDays: number;
  dates: { [key: string]: string };
};

const OverdueCasePopup = ({ isOpen, onClose, data }: { isOpen: boolean; onClose: () => void; data: OverdueCase }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-bg-card p-6 rounded-xl border border-border max-w-lg w-full">
        <h2 className="text-xl font-bold mb-4">รายละเอียดเคสเกินกำหนด: {data.id}</h2>
        <p>ชื่อ: {data.name}</p>
        <p>ขั้นตอนล่าสุด: {data.latestStep}</p>
        <p className="text-red-400 font-bold">เกินกำหนด: {data.exceededDays} วัน</p>
        <div className="mt-4 border-t border-border pt-4">
          <h3 className="font-semibold mb-2">ประวัติวันที่:</h3>
          {Object.entries(data.dates).map(([col, date]) => {
            const stepMap: { [key: string]: string } = {
              M: 'วันที่รับเรื่อง', N: 'ยิ่นชุดโอน', O: 'ได้รับเล่ม', P: 'ส่งสำเนาให้jai',
              Q: 'รับเอกสารชุดโอนจากJAI', R: 'วันที่นัดลูกค้าไปขนส่ง', T: 'ลูกค้าไปตรวจรถ',
              U: 'แจ้งตรวจรถผ่าน', V: 'รับเล่มคืนจากขนส่ง', W: 'ส่งเล่มให้JAI'
            };
            return <p key={col} className="text-sm">{stepMap[col] || col}: {date}</p>
          })}
        </div>
        <button onClick={onClose} className="mt-6 bg-brand-blue text-white px-4 py-2 rounded">ปิด</button>
      </div>
    </div>
  );
};

export const OverdueTableAdvanced = ({ data }: { data: OverdueCase[] }) => {
  const [selectedCase, setSelectedCase] = useState<OverdueCase | null>(null);

  return (
    <>
      <div className="bg-bg-card rounded-xl border border-border mt-6 overflow-hidden">
        <div className="p-4 border-b border-border">
          <h2 className="font-bold text-text-main">เคสที่เกินกำหนด (จำนำ/HP)</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-text-muted border-b border-border">
              <th className="p-4 text-left">ID</th>
              <th className="p-4 text-left">ลูกค้า</th>
              <th className="p-4 text-left">ขั้นตอนล่าสุด</th>
              <th className="p-4 text-left">เกินกำหนด</th>
              <th className="p-4 text-left">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {data.map((item) => (
              <tr key={item.id} className="hover:bg-white/5 transition-colors">
                <td className="p-4">{item.id}</td>
                <td className="p-4">{item.name}</td>
                <td className="p-4">{item.latestStep}</td>
                <td className="p-4 text-red-400 font-bold">{item.exceededDays} วัน</td>
                <td className="p-4">
                  <button onClick={() => setSelectedCase(item)} className="text-brand-blue hover:underline">ดูรายละเอียด</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {selectedCase && <OverdueCasePopup isOpen={!!selectedCase} onClose={() => setSelectedCase(null)} data={selectedCase} />}
    </>
  );
};
