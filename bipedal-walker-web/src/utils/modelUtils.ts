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
    
    console.log('📊 Normalization data loaded:');
    console.log('  obs_rms_mean sample:', normalizationData.obs_rms_mean?.slice(0, 4));
    console.log('  obs_rms_var sample:', normalizationData.obs_rms_var?.slice(0, 4));
    console.log('  eps:', normalizationData.eps);
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
    console.log('📊 State analysis:');
    console.log('  Raw state sample:', state.slice(0, 4));
    console.log('  Normalized sample:', normalizedState.slice(0, 4));
    console.log('  Model input shape:', model.inputs[0].shape);
    console.log('  Model output shape:', model.outputs[0].shape);
    
    // Create tensor with batch dimension [1, stateSize]
    const inputTensor = tf.tensor2d([normalizedState]);
    console.log('  Input tensor shape:', inputTensor.shape);
    
    // Run inference
    const prediction = model.predict(inputTensor);
    console.log('  Prediction type:', typeof prediction);
    console.log('  Prediction instanceof tf.Tensor:', prediction instanceof tf.Tensor);
    console.log('  Prediction is array:', Array.isArray(prediction));
    
    // Handle different prediction types
    let actionTensor: tf.Tensor;
    if (Array.isArray(prediction)) {
      // Model returns multiple outputs, take the first one
      actionTensor = prediction[0] as tf.Tensor;
      console.log('  Taking first output from array, shape:', actionTensor.shape);
    } else {
      // Single tensor output
      actionTensor = prediction as tf.Tensor;
      console.log('  Single tensor output, shape:', actionTensor.shape);
    }
    
    // Extract the action values (first output - actions)
    const actionData = await actionTensor.data();
    console.log('  Raw prediction output (first 8):', Array.from(actionData).slice(0, 8));
    console.log('  Full prediction length:', actionData.length);
    
    // Clean up tensors
    inputTensor.dispose();
    actionTensor.dispose();
    
    // Convert to array and take first 4 values (joint torques)
    const actions = Array.from(actionData).slice(0, 4) as number[];
    console.log('  Extracted actions:', actions);
    
    // Check if model produces reasonable actions
    console.log('🔍 Checking model output quality...');
    if (actions.every(a => Math.abs(a) < 0.001)) {
      console.warn('🚨 Model producing zero actions, using demo actions');
      const time = Date.now() * 0.003;
      const demoActions = [
        0.8 * Math.sin(time),
        0.6 * Math.sin(time + Math.PI/2),
        0.8 * Math.sin(time + Math.PI),
        0.6 * Math.sin(time + Math.PI + Math.PI/2)
      ];
      console.log('🦵 Demo actions:', demoActions);
      return demoActions;
    } else {
      console.log('✅ Model producing valid actions:', actions);
    }
    
    // Original model check (commented out for debugging)
    /*
    if (actions.every(a => Math.abs(a) < 0.01)) {
      const demoActions = [...];
      return demoActions;
    }
    */
    
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
  // Let's use more realistic starting values similar to training
  
  const state = new Array(24);
  
  // Hull angle (small random angle around upright)
  state[0] = (Math.random() - 0.5) * 0.2;
  // Hull angular velocity (small)
  state[1] = (Math.random() - 0.5) * 0.5;
  // Horizontal velocity (start with some forward motion)
  state[2] = 0.1 + Math.random() * 0.3;
  // Vertical velocity (small)
  state[3] = (Math.random() - 0.5) * 0.2;
  
  // Joint angles and speeds (4 joints, 2 values each = 8 values)
  // Make them more realistic for walking
  for (let i = 4; i < 12; i++) {
    state[i] = (Math.random() - 0.5) * 0.5;
  }
  
  // Leg contact with ground (start with at least one foot down)
  state[12] = Math.random() > 0.3 ? 1 : 0;
  state[13] = Math.random() > 0.3 ? 1 : 0;
  // Ensure at least one foot is on ground
  if (state[12] === 0 && state[13] === 0) {
    state[12] = 1;
  }
  
  // Lidar measurements (more realistic terrain readings)
  for (let i = 14; i < 24; i++) {
    state[i] = 0.5 + (Math.random() - 0.5) * 0.3; // Around 0.5 with some variation
  }
  
  console.log('Generated initial state:', state);
  return state;
}; 