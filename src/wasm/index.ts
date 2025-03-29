import * as tf from '@tensorflow/tfjs';
import { setWasmPaths } from '@tensorflow/tfjs-backend-wasm';

// Initialize WASM backend
export async function initWasm() {
  try {
    // Set WASM paths
    setWasmPaths('/wasm/');
    
    // Initialize WASM backend
    await tf.setBackend('wasm');
    await tf.ready();
    
    console.log('WASM backend initialized successfully');
    return true;
  } catch (error) {
    console.error('Failed to initialize WASM backend:', error);
    return false;
  }
}

// Export WASM-specific operations
export const wasmOps = {
  // Add WASM-specific operations here
  // These will be optimized for WASM execution
}; 