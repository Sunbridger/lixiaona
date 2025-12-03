import React from 'react';

export const Card: React.FC<{ children: React.ReactNode; className?: string; title?: string }> = ({ children, className = '', title }) => {
  return (
    <div className={`bg-white rounded-3xl p-5 shadow-soft border border-rose-50 ${className}`}>
      {title && <h3 className="text-lg font-bold text-gray-700 mb-3">{title}</h3>}
      {children}
    </div>
  );
};