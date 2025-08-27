'use client';

import React from 'react';

export default function TestDisplayPage() {
  const [count, setCount] = React.useState(0);
  
  return (
    <div className="min-h-screen bg-black flex items-center justify-center text-white">
      <div className="text-center">
        <h1 className="text-2xl mb-4">Test Display Page</h1>
        <p className="mb-4">Count: {count}</p>
        <button 
          onClick={() => setCount(count + 1)}
          className="bg-brand-orange-500 px-4 py-2 rounded"
        >
          Increment
        </button>
      </div>
    </div>
  );
}