import React from 'react';
// import { useNavigate } from 'react-router-dom';
import './LandingPage.css';

const LandingPage: React.FC = () => {
  // const navigate = useNavigate();

  const prompts = [
    "Show me a clumsy start",
    "Watch it stumble then improve",
    "See the learning in action",
    "From failure to success"
  ];

  const handleRunSimulation = () => {
    // navigate('/simulate');
    window.location.href = '/simulate';
  };

  return (
    <div className="landing-page">
      <div className="hero-section">
        <h1 className="hero-title">Watch a machine learn to walk</h1>
        <p className="hero-subtitle">
          Experience reinforcement learning in real-time as an AI agent discovers how to walk
        </p>
        <button className="cta-button" onClick={handleRunSimulation}>
          Run Simulation
        </button>
      </div>

      <div className="prompts-section">
        <h3>What you'll see:</h3>
        <div className="prompts-carousel">
          {prompts.map((prompt, index) => (
            <div key={index} className="prompt-card">
              "{prompt}"
            </div>
          ))}
        </div>
      </div>

      <div className="info-section">
        <p>
          This interactive experience shows a trained PPO (Proximal Policy Optimization) agent 
          learning to control a bipedal walker. Watch live telemetry, reward progression, 
          and visual cues that reveal the learning process.
        </p>
      </div>
    </div>
  );
};

export default LandingPage; 