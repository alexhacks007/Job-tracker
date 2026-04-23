import React from 'react';

const Skeleton = ({ className }) => {
  return (
    <div className={`relative overflow-hidden bg-white/5 rounded-2xl ${className}`}>
      <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer" />
    </div>
  );
};

export default Skeleton;
