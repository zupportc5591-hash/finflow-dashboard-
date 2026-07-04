import React from 'react';

const SummaryCard = ({ title, value, subtext, trend }: { title: string; value: string; subtext?: string; trend?: string }) => (
  <div className="bg-bg-card p-6 rounded-xl border border-border">
    <h3 className="text-text-muted text-xs font-semibold tracking-wider uppercase mb-2">{title}</h3>
    <div className="flex items-end justify-between">
      <p className="text-3xl font-bold text-text-main">{value}</p>
      {trend && <span className="text-brand-yellow text-xs font-bold bg-yellow-950/30 px-2 py-1 rounded">{trend}</span>}
    </div>
    {subtext && <p className="text-text-muted text-xs mt-2">{subtext}</p>}
  </div>
);

export default SummaryCard;
