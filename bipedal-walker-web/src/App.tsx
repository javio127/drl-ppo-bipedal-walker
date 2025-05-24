import React from 'react';
import LandingPage from './components/LandingPage';
import SimulationPage from './components/SimulationPage';
import './App.css';

function App() {
  // Simple routing based on URL path
  const path = window.location.pathname;
  
  return (
    <div className="App">
      {path === '/simulate' ? <SimulationPage /> : <LandingPage />}
    </div>
  );
}

export default App;
