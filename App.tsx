import React from 'react';
import EscherWeave from './components/EscherWeave';

function App() {
  return (
    <div className="w-screen h-screen bg-slate-950 overflow-hidden flex flex-col">
      <header className="sr-only">Escher Card Weave</header>
      <main className="flex-1 relative">
        {/* Background ambience */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_rgba(30,41,59,1)_0%,_rgba(15,23,42,1)_100%)] pointer-events-none" />
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(#334155 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        
        <EscherWeave />
      </main>
    </div>
  );
}

export default App;