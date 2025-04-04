// Set test timeout to 10 seconds
jest.setTimeout(10000);

// Mock Python-Shell
jest.mock('python-shell', () => ({
  PythonShell: {
    run: jest.fn().mockResolvedValue([]),
    runString: jest.fn().mockResolvedValue([])
  }
}));

// Mock TensorFlow.js
jest.mock('@tensorflow/tfjs', () => ({
  tensor: jest.fn(),
  model: jest.fn(),
  layers: {
    dense: jest.fn(),
    activation: jest.fn()
  },
  train: {
    adam: jest.fn()
  }
}));

// Mock quantum-computing
jest.mock('quantum-computing', () => ({
  QuantumCircuit: jest.fn().mockImplementation(() => ({
    addGate: jest.fn(),
    run: jest.fn().mockResolvedValue({ state: [1, 0] })
  }))
})); 