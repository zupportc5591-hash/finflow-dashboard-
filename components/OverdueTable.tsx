import React from 'react';

const OverdueTable = () => {
  const data = [
    { id: 'FF-001', customer: 'สมชาย ใจดี', step: 'รอเอกสาร', delay: '3 วัน' },
    { id: 'FF-005', customer: 'สมหญิง รักเรียน', step: 'ตรวจสอบไฟแนนซ์', delay: '1 วัน' },
  ];

  return (
    <div className="bg-bg-card rounded-xl border border-border mt-6 overflow-hidden">
      <div className="p-4 border-b border-border">
        <h2 className="font-bold text-text-main">เคสที่เกินกำหนด</h2>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-text-muted border-b border-border">
            <th className="p-4 text-left">ID</th>
            <th className="p-4 text-left">ลูกค้า</th>
            <th className="p-4 text-left">ขั้นตอน</th>
            <th className="p-4 text-left">ล่าช้า</th>
            <th className="p-4 text-left">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {data.map((item) => (
            <tr key={item.id} className="hover:bg-white/5 transition-colors">
              <td className="p-4 text-text-main">{item.id}</td>
              <td className="p-4 text-text-main">{item.customer}</td>
              <td className="p-4 text-text-main">{item.step}</td>
              <td className="p-4 text-red-400 font-bold">{item.delay}</td>
              <td className="p-4"><a href="#" className="text-brand-blue hover:underline">แก้ไข</a></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default OverdueTable;
