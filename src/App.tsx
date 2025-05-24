import React from 'react';
// import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
// import LandingPage from './components/LandingPage';
// import SimulationPage from './components/SimulationPage';
import './App.css';

function App() {
  return (
    <div className="App">
      <div style={{ 
        minHeight: '100vh', 
        background: 'linear-gradient(135deg, #1e1e1e 0%, #2d2d2d 50%, #1a1a1a 100%)',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: '2rem'
      }}>
        <h1 style={{ fontSize: '3rem', margin: 0 }}>🤖 Bipedal Walker AI</h1>
        <p style={{ fontSize: '1.2rem', textAlign: 'center', maxWidth: '600px' }}>
          Your interactive bipedal walker web app is loading...
        </p>
        <button style={{
          background: 'linear-gradient(45deg, #4CAF50, #45a049)',
          color: 'white',
          border: 'none',
          padding: '1rem 2rem',
          fontSize: '1.1rem',
          borderRadius: '50px',
          cursor: 'pointer'
        }}>
          🚀 Test Button
        </button>
      </div>
    </div>
  );
}

export default App; 