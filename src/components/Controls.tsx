import React from 'react';
import './Controls.css';

interface ControlsProps {
  onRestart: () => void;
  onPlayPause: () => void;
  isRunning: boolean;
}

const Controls: React.FC<ControlsProps> = ({ onRestart, onPlayPause, isRunning }) => {
  return (
    <div className="controls-panel">
      <div className="main-controls">
        <button 
          className={`control-button play-pause ${isRunning ? 'pause' : 'play'}`}
          onClick={onPlayPause}
        >
          {isRunning ? '⏸️ Pause' : '▶️ Play'}
        </button>
        
        <button className="control-button restart" onClick={onRestart}>
          🔄 Restart
        </button>
      </div>

      <div className="secondary-controls">
        <div className="control-group">
          <label htmlFor="terrain-select">Terrain:</label>
          <select id="terrain-select" className="control-select">
            <option value="flat">Flat Ground</option>
            <option value="hills">Small Hills</option>
            <option value="rough">Rough Terrain</option>
          </select>
        </div>

        <div className="control-group">
          <label htmlFor="pose-select">Starting Pose:</label>
          <select id="pose-select" className="control-select">
            <option value="standing">Standing</option>
            <option value="crouched">Crouched</option>
            <option value="leaning">Leaning Forward</option>
            <option value="random">Random</option>
          </select>
        </div>
      </div>

      <div className="control-info">
        <p>
          <strong>Tips:</strong> Watch how the walker adapts its gait! 
          The AI learns through trial and error, just like humans.
        </p>
      </div>
    </div>
  );
};

export default Controls; 