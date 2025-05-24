import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import './TelemetryPanel.css';

interface SimulationState {
  reward: number;
  steps: number;
  timeElapsed: number;
  isRunning: boolean;
  episode: number;
}

interface TelemetryPanelProps {
  simulationState: SimulationState;
}

interface DataPoint {
  step: number;
  reward: number;
  cumulativeReward: number;
}

const TelemetryPanel: React.FC<TelemetryPanelProps> = ({ simulationState }) => {
  const [rewardHistory, setRewardHistory] = useState<DataPoint[]>([]);
  const [maxReward, setMaxReward] = useState(0);
  const [avgReward, setAvgReward] = useState(0);

  useEffect(() => {
    // Update reward history for the chart
    setRewardHistory(prev => {
      const newPoint = {
        step: simulationState.steps,
        reward: simulationState.reward,
        cumulativeReward: simulationState.reward
      };

      const updated = [...prev, newPoint];
      
      // Keep only the last 100 data points for performance
      return updated.slice(-100);
    });

    // Update statistics
    setMaxReward(prev => Math.max(prev, simulationState.reward));
    
    if (rewardHistory.length > 0) {
      const sum = rewardHistory.reduce((acc, point) => acc + point.reward, 0);
      setAvgReward(sum / rewardHistory.length);
    }
  }, [simulationState]);

  // Reset when episode changes
  useEffect(() => {
    setRewardHistory([]);
    setMaxReward(0);
    setAvgReward(0);
  }, [simulationState.episode]);

  const getStatusColor = () => {
    if (simulationState.reward > 200) return '#4CAF50'; // Good
    if (simulationState.reward > 100) return '#FF9800'; // Okay
    return '#f44336'; // Poor
  };

  const getLearningStatus = () => {
    if (simulationState.reward > 250) return 'Excellent Walker!';
    if (simulationState.reward > 200) return 'Learning Well';
    if (simulationState.reward > 100) return 'Making Progress';
    if (simulationState.reward > 50) return 'Early Learning';
    return 'Finding Balance';
  };

  return (
    <div className="telemetry-panel">
      <div className="panel-header">
        <h3>Live Telemetry</h3>
        <div className={`status-indicator ${simulationState.isRunning ? 'running' : 'paused'}`}>
          {simulationState.isRunning ? '🟢 Running' : '⏸️ Paused'}
        </div>
      </div>

      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-label">Episode</div>
          <div className="metric-value">{simulationState.episode}</div>
        </div>

        <div className="metric-card">
          <div className="metric-label">Steps</div>
          <div className="metric-value">{simulationState.steps.toLocaleString()}</div>
        </div>

        <div className="metric-card">
          <div className="metric-label">Time Elapsed</div>
          <div className="metric-value">{simulationState.timeElapsed.toFixed(1)}s</div>
        </div>

        <div className="metric-card reward-card" style={{ borderColor: getStatusColor() }}>
          <div className="metric-label">Current Reward</div>
          <div className="metric-value" style={{ color: getStatusColor() }}>
            {simulationState.reward}
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-label">Max Reward</div>
          <div className="metric-value">{Math.round(maxReward)}</div>
        </div>

        <div className="metric-card">
          <div className="metric-label">Avg Reward</div>
          <div className="metric-value">{Math.round(avgReward)}</div>
        </div>
      </div>

      <div className="learning-status">
        <div className="status-label">Learning Status:</div>
        <div className="status-text" style={{ color: getStatusColor() }}>
          {getLearningStatus()}
        </div>
      </div>

      <div className="chart-container">
        <h4>Reward Progression</h4>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={rewardHistory}>
            <CartesianGrid strokeDasharray="3 3" stroke="#444" />
            <XAxis 
              dataKey="step" 
              stroke="#ccc"
              fontSize={12}
            />
            <YAxis 
              stroke="#ccc"
              fontSize={12}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#2d2d2d', 
                border: '1px solid #444',
                borderRadius: '8px'
              }}
            />
            <Line 
              type="monotone" 
              dataKey="reward" 
              stroke="#4CAF50" 
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="performance-indicators">
        <div className="indicator">
          <span className="indicator-label">Stability:</span>
          <div className="progress-bar">
            <div 
              className="progress-fill"
              style={{ 
                width: `${Math.min(100, (simulationState.reward / 200) * 100)}%`,
                backgroundColor: getStatusColor()
              }}
            ></div>
          </div>
        </div>

        <div className="indicator">
          <span className="indicator-label">Forward Progress:</span>
          <div className="progress-bar">
            <div 
              className="progress-fill"
              style={{ 
                width: `${Math.min(100, (simulationState.steps / 1000) * 100)}%`,
                backgroundColor: '#2196F3'
              }}
            ></div>
          </div>
        </div>
      </div>

      <div className="debug-info">
        <h4>Debug Info</h4>
        <div className="debug-text">
          <p>FPS: ~10 (simulated)</p>
          <p>Model: PPO Bipedal Walker</p>
          <p>State Space: 24D</p>
          <p>Action Space: 4D Continuous</p>
        </div>
      </div>
    </div>
  );
};

export default TelemetryPanel; 