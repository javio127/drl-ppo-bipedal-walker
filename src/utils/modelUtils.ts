import * as tf from '@tensorflow/tfjs';

// Model and normalization data
let model: tf.GraphModel | null = null;
let normalizationData: any = null;

export const loadModel = async (): Promise<tf.GraphModel> => {
  try {
    // Load the TensorFlow.js model
    console.log('Loading model from /model/model.json...');
    model = await tf.loadGraphModel('/model/model.json');
    
    // Load normalization data
    console.log('Loading normalization data...');
    const response = await fetch('/model/data.json');
    normalizationData = await response.json();
    
    console.log('Model and normalization data loaded successfully');
    return model;
  } catch (error) {
    console.error('Error loading model:', error);
    throw error;
  }
};

export const normalizeState = (state: number[]): number[] => {
  if (!normalizationData) {
    console.warn('Normalization data not loaded, returning state as-is');
    return state;
  }
  
  const { obs_rms_mean, obs_rms_var, eps } = normalizationData;
  
  // Apply the same normalization as in the Python training code:
  // state = (state - obs_rms_mean) / sqrt(obs_rms_var + eps)
  // Then clip to [-10, 10]
  const normalized = state.map((value, index) => {
    const mean = obs_rms_mean[index] || 0;
    const variance = obs_rms_var[index] || 1;
    const normalizedValue = (value - mean) / Math.sqrt(variance + eps);
    
    // Clip to [-10, 10] as done in the Python code
    return Math.max(-10, Math.min(10, normalizedValue));
  });
  
  return normalized;
};

export const predictAction = async (state: number[]): Promise<number[]> => {
  if (!model) {
    throw new Error('Model not loaded');
  }
  
  try {
    // Normalize the input state
    const normalizedState = normalizeState(state);
    
    // Create tensor with batch dimension [1, stateSize]
    const inputTensor = tf.tensor2d([normalizedState]);
    
    // Run inference
    const prediction = model.predict(inputTensor) as tf.Tensor;
    
    // Extract the action values (first output - actions)
    const actionData = await prediction.data();
    
    // Clean up tensors
    inputTensor.dispose();
    prediction.dispose();
    
    // Convert to array and take first 4 values (joint torques)
    const actions = Array.from(actionData).slice(0, 4) as number[];
    
    return actions;
  } catch (error) {
    console.error('Error predicting action:', error);
    throw error;
  }
};

// Utility function to generate a random initial state for the bipedal walker
export const generateRandomState = (): number[] => {
  // BipedalWalker has 24 state dimensions:
  // [hull_angle, hull_angularVelocity, vel_x, vel_y, hip_joint_1_angle, hip_joint_1_speed, ...]
  // For demo purposes, we'll generate reasonable random values
  
  const state = new Array(24);
  
  // Hull angle (small random angle)
  state[0] = (Math.random() - 0.5) * 0.1;
  // Hull angular velocity
  state[1] = (Math.random() - 0.5) * 0.2;
  // Horizontal velocity
  state[2] = Math.random() * 0.5;
  // Vertical velocity
  state[3] = (Math.random() - 0.5) * 0.1;
  
  // Joint angles and speeds (4 joints, 2 values each = 8 values)
  for (let i = 4; i < 12; i++) {
    state[i] = (Math.random() - 0.5) * 0.3;
  }
  
  // Leg contact with ground (2 legs)
  state[12] = Math.random() > 0.5 ? 1 : 0;
  state[13] = Math.random() > 0.5 ? 1 : 0;
  
  // Lidar measurements (10 measurements)
  for (let i = 14; i < 24; i++) {
    state[i] = Math.random();
  }
  
  return state;
}; 