import React from 'react';

const DataTable = ({ title, headers, data }: { title: string; headers: string[]; data: any[][] }) => (
  <div className="bg-bg-card rounded-xl border border-border mb-8 overflow-hidden">
    <div className="px-6 py-4 border-b border-border">
      <h3 className="font-bold text-text-main">{title}</h3>
    </div>
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-text-muted border-b border-border">
            {headers.map((h, i) => <th key={i} className="px-6 py-3 text-left font-semibold">{h}</th>)}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {data.map((row, i) => (
            <tr key={i} className="hover:bg-white/5 transition-colors">
              {row.map((cell, j) => <td key={j} className="px-6 py-4 text-text-main">{cell}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

export default DataTable;
