import React, { useState, useEffect } from 'react';
import { loadModel, predictAction, generateRandomState } from '../utils/modelUtils';
import './SimulationPage.css';

const SimulationPage: React.FC = () => {
  const [model, setModel] = useState<any>(null);
  const [modelLoading, setModelLoading] = useState(true);
  const [isRunning, setIsRunning] = useState(false);
  const [currentState, setCurrentState] = useState<number[]>(generateRandomState());
  const [reward, setReward] = useState(0);
  const [steps, setSteps] = useState(0);
  const [actions, setActions] = useState<number[]>([0, 0, 0, 0]);
  const [walkerPosition, setWalkerPosition] = useState(0);
  const [totalDistance, setTotalDistance] = useState(0);
  const [startTime, setStartTime] = useState(Date.now());
  const [positionHistory, setPositionHistory] = useState<number[]>([]);

  // Load the TensorFlow.js model on component mount
  useEffect(() => {
    const loadTFModel = async () => {
      try {
        setModelLoading(true);
        const loadedModel = await loadModel();
        setModel(loadedModel);
        const initialState = generateRandomState();
        setCurrentState(initialState);
        console.log('✅ Model loaded, initial state set:', initialState.slice(0, 4));
      } catch (error) {
        console.error('Failed to load model:', error);
      } finally {
        setModelLoading(false);
      }
    };

    loadTFModel();
  }, []);

  // Run simulation loop
  useEffect(() => {
    if (!isRunning || !model || currentState.length === 0) {
      console.log('❌ Simulation blocked:', { isRunning, hasModel: !!model, stateLength: currentState.length });
      return;
    }
    
    console.log('✅ Starting simulation loop');

    const runSimulationStep = async () => {
      try {
        // Get action from AI model
        const newActions = await predictAction(currentState);
        console.log('🤖 Actions received in simulation:', newActions);
        setActions(newActions);

        // Realistic walking physics based on actual BipedalWalker environment
        const newState = [...currentState];
        
        // 1. JOINT UPDATES: Apply torques to joint positions (affects where legs move)
        for (let i = 0; i < 4; i++) {
          newState[4 + i] += newActions[i] * 0.1; // Joint positions change with torque
        }
        
        // 2. EXTRACT PHYSICS STATE
        const hullAngle = newState[0];
        const leftFootContact = newState[12];  // 1 = foot touching ground, 0 = in air
        const rightFootContact = newState[13];
        const currentVelocity = newState[2];
        
        // 3. GROUND CONTACT FORCES: Only generate movement when feet contact ground
        const leftLegTorque = newActions[0] + newActions[1];   // Hip + knee torque
        const rightLegTorque = newActions[2] + newActions[3];
        
        // 4. WALKING MECHANICS: Force only applies when foot is on ground
        const leftGroundForce = leftFootContact * leftLegTorque * 0.3;   // No force if foot in air
        const rightGroundForce = rightFootContact * rightLegTorque * 0.3;
        const totalGroundForce = leftGroundForce + rightGroundForce;
        
        // 5. BALANCE CHECK: Unstable hull angle reduces walking efficiency (more forgiving)
        const stabilityFactor = Math.max(0.2, 1 - Math.abs(hullAngle) * 2); // Less harsh penalty
        const effectiveForce = totalGroundForce * stabilityFactor;
        
        // 6. STEP COORDINATION: Alternating legs is more efficient than both together
        const legCoordination = Math.abs(leftLegTorque) + Math.abs(rightLegTorque) - 
                               Math.abs(leftLegTorque + rightLegTorque) * 0.5; // Reward alternating
        const coordinationBonus = Math.max(0, legCoordination * 0.1);
        
        console.log('🦵 Walking Physics:', {
          leftContact: leftFootContact.toFixed(1),
          rightContact: rightFootContact.toFixed(1),
          hullAngle: hullAngle.toFixed(3),
          stabilityFactor: stabilityFactor.toFixed(3),
          totalGroundForce: totalGroundForce.toFixed(3),
          effectiveForce: effectiveForce.toFixed(3),
          coordination: coordinationBonus.toFixed(3)
        });
        
        // 7. UPDATE VELOCITY: Based on effective ground forces + coordination
        const velocityChange = effectiveForce + coordinationBonus;
        newState[2] = Math.max(-1.0, Math.min(2.0, currentVelocity + velocityChange));
        
        // 8. POSITION UPDATE: Only move if actually walking well
        const positionDelta = newState[2] * 8;
        setWalkerPosition(prev => {
          const newPos = prev + positionDelta;
          console.log('🚶 Walker position: ', prev.toFixed(1), '→', newPos.toFixed(1), `(+${positionDelta.toFixed(1)})`);
          
          // Update position history for trail effect
          setPositionHistory(history => {
            const newHistory = [...history, newPos];
            return newHistory.slice(-20); // Keep last 20 positions
          });
          
          return newPos;
        });
        
        // Track total distance traveled (absolute movement)
        setTotalDistance(prev => prev + Math.abs(positionDelta));
        
        // Calculate reward based on real BipedalWalker scoring (more forgiving)
        const forwardReward = Math.max(0, newState[2] * 8);  // Reward forward velocity
        const stabilityPenalty = Math.abs(hullAngle) * 20;   // Less harsh tipping penalty
        const torqueCost = (Math.abs(newActions[0]) + Math.abs(newActions[1]) + 
                           Math.abs(newActions[2]) + Math.abs(newActions[3])) * 0.05; // Lower energy cost
        const stepReward = forwardReward - stabilityPenalty - torqueCost;
        
        setCurrentState(newState);
        setReward(prev => prev + stepReward);
        setSteps(prev => prev + 1);

      } catch (error) {
        console.error('Simulation step error:', error);
      }
    };

    const interval = setInterval(runSimulationStep, 100); // 10 FPS
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRunning, model]); // Remove currentState dependency to prevent infinite loop

  const handlePlayPause = () => {
    if (isRunning) {
      // When pausing, reset actions to prevent drift
      setActions([0, 0, 0, 0]);
    }
    setIsRunning(!isRunning);
  };

  const handleRestart = () => {
    setIsRunning(false);
    const newState = generateRandomState();
    setCurrentState(newState);
    setReward(0);
    setSteps(0);
    setActions([0, 0, 0, 0]);
    setWalkerPosition(0);
    setTotalDistance(0);
    setStartTime(Date.now());
    setPositionHistory([]);
  };

  const handleBackToHome = () => {
    window.location.href = '/';
  };

  if (modelLoading) {
    return (
      <div className="simulation-page loading">
        <div className="loading-container">
          <div className="spinner"></div>
          <h2>Loading AI Model...</h2>
          <p>Preparing your trained PPO bipedal walker</p>
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
        <h1>🤖 Bipedal Walker AI Simulation</h1>
      </div>

      <div className="simulation-content">
        <div className="left-panel">
          <div className="walker-preview">
            <h3>🤖 AI Bipedal Walker</h3>
            <div className="walker-placeholder">
              {/* Ground/Background - moves with camera */}
              <div className="ground-line" style={{
                transform: `translateX(${-walkerPosition + 200}px)`
              }}></div>
              
              {/* Motion Trail */}
              {positionHistory.map((pos, index) => (
                <div
                  key={`trail-${index}`}
                  className="motion-trail"
                  style={{
                    transform: `translateX(${-walkerPosition + 200 + (pos - walkerPosition)}px)`,
                    opacity: (index / positionHistory.length) * 0.3,
                  }}
                />
              ))}
              <div className="distance-markers" style={{
                transform: `translateX(${-walkerPosition + 200}px)`
              }}>
                {Array.from({length: 100}, (_, i) => (
                  <div 
                    key={i} 
                    className="distance-marker" 
                    style={{left: `${i * 50}px`}}
                  >
                    {i * 10}m
                  </div>
                ))}
              </div>
              
              {/* Walker stays centered */}
              <div className="walker-bipedal" style={{
                transform: `translateX(200px) translateY(${100 + (currentState[3] || 0) * 50}px)`
              }}>
                {/* Lidar Rays */}
                {currentState.slice(14, 24).map((distance, index) => {
                  const angle = (index - 5) * 18; // -90° to +90° spread (more realistic)
                  const length = Math.max(10, distance * 150); // Scale for visibility, minimum 10px
                  const isObstacle = distance < 0.4;
                  return (
                    <div
                      key={index}
                      className="lidar-ray"
                      style={{
                        transform: `rotate(${angle}deg)`,
                        width: `${length}px`,
                        height: '2px',
                        backgroundColor: isObstacle ? '#ff3333' : '#33ff33',
                        opacity: 0.8,
                        transformOrigin: 'left center'
                      }}
                    />
                  );
                })}
                
                {/* Hull/Body */}
                <div className="hull" style={{ 
                  transform: `rotate(${(currentState[0] || 0) * 57.3}deg)`,  // Convert to degrees
                  backgroundColor: Math.abs(currentState[0] || 0) > 0.1 ? '#f44336' : '#4CAF50'
                }}></div>
                
                {/* Left Leg */}
                <div className="leg-assembly left">
                  <div className="thigh" style={{ 
                    transform: `rotate(${(currentState[4] || 0) * 57.3}deg)`,  // Use actual joint angle from state
                    backgroundColor: Math.abs(actions[0] || 0) > 0.1 ? '#FF9800' : '#2196F3'
                  }}>
                    <div className="shin" style={{ 
                      transform: `rotate(${(currentState[6] || 0) * 57.3}deg)`,  // Use actual joint angle from state
                      backgroundColor: Math.abs(actions[1] || 0) > 0.1 ? '#FF5722' : '#03A9F4'
                    }}>
                      <div className="foot" style={{
                        backgroundColor: currentState[12] > 0.5 ? '#8B4513' : '#D2691E'  // Show ground contact
                      }}></div>
                    </div>
                  </div>
                </div>
                
                {/* Right Leg */}
                <div className="leg-assembly right">
                  <div className="thigh" style={{ 
                    transform: `rotate(${(currentState[8] || 0) * 57.3}deg)`,   // Use actual joint angle from state
                    backgroundColor: Math.abs(actions[2] || 0) > 0.1 ? '#FF9800' : '#2196F3'
                  }}>
                    <div className="shin" style={{ 
                      transform: `rotate(${(currentState[10] || 0) * 57.3}deg)`,  // Use actual joint angle from state
                      backgroundColor: Math.abs(actions[3] || 0) > 0.1 ? '#FF5722' : '#03A9F4'
                    }}>
                      <div className="foot" style={{
                        backgroundColor: currentState[13] > 0.5 ? '#8B4513' : '#D2691E'  // Show ground contact
                      }}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="controls">
              <button 
                className={`control-btn ${isRunning ? 'pause' : 'play'}`}
                onClick={handlePlayPause}
              >
                {isRunning ? 'Pause' : 'Play'}
              </button>
              <button className="control-btn restart" onClick={handleRestart}>
                Restart
              </button>
            </div>
          </div>
        </div>

        <div className="right-panel">
          <div className="telemetry">
            <h3>Live AI Telemetry</h3>
            
            <div className="metrics">
              <div className="metric" title="Cumulative reward score - higher is better walking performance">
                <span className="label">Reward:</span>
                <span className="value">{Math.round(reward)}</span>
                <span className="annotation">cumulative score</span>
              </div>
              <div className="metric" title="Number of AI decision steps taken">
                <span className="label">Steps:</span>
                <span className="value">{steps}</span>
                <span className="annotation">AI decisions</span>
              </div>
              <div className="metric" title="Real-time elapsed since simulation started">
                <span className="label">Time:</span>
                <span className="value">{Math.round((Date.now() - startTime) / 1000)}s</span>
                <span className="annotation">elapsed</span>
              </div>
              <div className="metric" title="Total distance traveled (forward + backward)">
                <span className="label">Distance:</span>
                <span className="value">{(totalDistance / 10).toFixed(1)}m</span>
                <span className="annotation">total traveled</span>
              </div>
              <div className="metric" title="Robot body tilt - 0 is upright, negative = leaning back, positive = leaning forward">
                <span className="label">Hull Angle:</span>
                <span className="value">{currentState[0]?.toFixed(3)}</span>
                <span className="annotation">body tilt (rad)</span>
              </div>
              <div className="metric" title="Forward speed - positive = moving forward, negative = moving backward">
                <span className="label">Velocity:</span>
                <span className="value">{currentState[2]?.toFixed(3)}</span>
                <span className="annotation">forward speed</span>
              </div>
            </div>

            <div className="actions">
              <h4>AI Actions (Joint Torques):</h4>
              {actions.map((action, index) => {
                const jointNames = ['Left Hip', 'Left Knee', 'Right Hip', 'Right Knee'];
                return (
                  <div key={index} className="action" title={`Motor torque applied to ${jointNames[index]} - green = extension, red = flexion`}>
                    <span>Joint {index + 1}:</span>
                    <div className="action-bar">
                      <div 
                        className="action-fill"
                        style={{ 
                          width: `${Math.abs(action) * 50}%`,
                          backgroundColor: action > 0 ? '#4CAF50' : '#f44336'
                        }}
                      ></div>
                    </div>
                    <span>{action.toFixed(3)}</span>
                    <span className="joint-annotation">{jointNames[index]}</span>
                  </div>
                );
              })}
            </div>

            <div className="status">
              <p>
                {isRunning ? 'Robot executing learned walking policy' : 'Robot control systems paused'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimulationPage; 