declare module './quantum/core/quantum_processor' {
  export class QuantumProcessor {
    constructor(config: any);
    process(state: any): any;
  }
}

declare module './quantum/core/quantum_circuit' {
  export class QuantumCircuit {
    constructor(numQubits: number);
    addGate(gate: any): void;
    execute(): any;
  }
}

declare module './quantum/core/quantum_optimizer' {
  export class QuantumOptimizer {
    constructor(config: any);
    optimize(circuit: any): any;
  }
}

declare module './ml/enhanced_xgboost' {
  export class EnhancedXGBoost {
    constructor(config: any);
    train(data: any): Promise<any>;
    predict(data: any): Promise<any>;
  }
}

declare module './ml/train_xgboost' {
  export function trainXGBoost(config: any, data: any): Promise<any>;
}

declare module './ml/optimize' {
  export function optimize(config: any, data: any): Promise<any>;
}

declare module './ml/xgboost' {
  export class XGBoost {
    constructor(config: any);
    train(data: any): Promise<any>;
    predict(data: any): Promise<any>;
  }
}

declare module './ml/quantum_ml' {
  export class QuantumML {
    constructor(config: any);
    train(data: any): Promise<any>;
    predict(data: any): Promise<any>;
  }
}

declare module './quantum/quantum_circuit' {
  export class QuantumCircuit {
    constructor(numQubits: number);
    addGate(gate: any): void;
    execute(): any;
  }
}

declare module './quantum/quantum_state' {
  export class QuantumState {
    constructor(amplitudes: number[], phases: number[], qubits: number);
    measure(): number;
  }
} 