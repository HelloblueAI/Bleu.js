// Mock implementation of TensorFlow.js
const tf = {
    setBackend: jest.fn(),
    ready: jest.fn().mockResolvedValue(undefined),
    tensor3d: jest.fn().mockReturnValue({
        dataSync: jest.fn().mockReturnValue(new Float32Array(224 * 224 * 3)),
        dispose: jest.fn(),
        shape: [1, 224, 224, 3]
    }),
    disposeVariables: jest.fn(),
    tensor: jest.fn().mockReturnValue({
        dataSync: jest.fn().mockReturnValue(new Float32Array(10)),
        dispose: jest.fn(),
        shape: [1, 10]
    }),
    zeros: jest.fn().mockReturnValue({
        dataSync: jest.fn().mockReturnValue(new Float32Array(10)),
        dispose: jest.fn(),
        shape: [1, 10]
    }),
    dispose: jest.fn(),
    memory: jest.fn().mockReturnValue({
        numTensors: 0,
        numDataBuffers: 0,
        numBytes: 0,
        unreliable: false
    }),
    tidy: jest.fn((name, fn) => fn()),
    browser: {
        fromPixels: jest.fn().mockReturnValue({
            dataSync: jest.fn().mockReturnValue(new Float32Array(224 * 224 * 3)),
            dispose: jest.fn(),
            shape: [224, 224, 3]
        })
    }
};

module.exports = tf; 