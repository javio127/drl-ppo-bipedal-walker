import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import WalkerRenderer from './WalkerRenderer';
import TelemetryPanel from './TelemetryPanel';
import Controls from './Controls';
import { loadModel, predictAction } from '../utils/modelUtils';
import './SimulationPage.css';

interface SimulationState {
  reward: number;
  steps: number;
  timeElapsed: number;
  isRunning: boolean;
  episode: number;
}

const SimulationPage: React.FC = () => {
  const navigate = useNavigate();
  const [model, setModel] = useState<any>(null);
  const [modelLoading, setModelLoading] = useState(true);
  const [simulationState, setSimulationState] = useState<SimulationState>({
    reward: 0,
    steps: 0,
    timeElapsed: 0,
    isRunning: false,
    episode: 1
  });

  // Load the TensorFlow.js model on component mount
  useEffect(() => {
    const loadTFModel = async () => {
      try {
        setModelLoading(true);
        const loadedModel = await loadModel();
        setModel(loadedModel);
        console.log('Model loaded successfully!');
      } catch (error) {
        console.error('Failed to load model:', error);
      } finally {
        setModelLoading(false);
      }
    };

    loadTFModel();
  }, []);

  const handleBackToHome = () => {
    navigate('/');
  };

  const handleRestart = () => {
    setSimulationState({
      reward: 0,
      steps: 0,
      timeElapsed: 0,
      isRunning: false,
      episode: simulationState.episode + 1
    });
  };

  const handlePlayPause = () => {
    setSimulationState(prev => ({
      ...prev,
      isRunning: !prev.isRunning
    }));
  };

  const updateSimulationState = (updates: Partial<SimulationState>) => {
    setSimulationState(prev => ({ ...prev, ...updates }));
  };

  if (modelLoading) {
    return (
      <div className="simulation-page loading">
        <div className="loading-container">
          <div className="spinner"></div>
          <h2>Loading AI Model...</h2>
          <p>Preparing the bipedal walker simulation</p>
        </div>
      </div>
    );
  }

  return (
    <div className="simulation-page">
      <div className="simulation-header">
        <button className="back-button" onClick={handleBackToHome}>
          ← Back to Home
        </button>
        <h1>Bipedal Walker AI Simulation</h1>
      </div>

      <div className="simulation-content">
        <div className="left-panel">
          <WalkerRenderer 
            model={model}
            isRunning={simulationState.isRunning}
            onStateUpdate={updateSimulationState}
          />
          
          <Controls 
            onRestart={handleRestart}
            onPlayPause={handlePlayPause}
            isRunning={simulationState.isRunning}
          />
        </div>

        <div className="right-panel">
          <TelemetryPanel simulationState={simulationState} />
        </div>
      </div>
    </div>
  );
};

export default SimulationPage; 