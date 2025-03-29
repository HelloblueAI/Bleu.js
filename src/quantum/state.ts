import { Complex } from './types';

/**
 * Represents a quantum state in the quantum computing system.
 */
export class QuantumState {
    private amplitudes: Complex[];
    private numQubits: number;

    /**
     * Creates a new quantum state.
     * @param numQubits The number of qubits in the system
     */
    constructor(numQubits: number) {
        if (!Number.isInteger(numQubits) || numQubits <= 0 || numQubits > 16) {
            throw new Error('Number of qubits must be a positive integer less than or equal to 16');
        }
        this.numQubits = numQubits;
        const dimension = Math.pow(2, numQubits);
        this.amplitudes = new Array(dimension).fill({ real: 0, imag: 0 });
        // Initialize to |0⟩ state
        this.amplitudes[0] = { real: 1, imag: 0 };
    }

    /**
     * Gets the number of qubits in the system.
     */
    public getNumQubits(): number {
        return this.numQubits;
    }

    /**
     * Gets the state vector amplitudes.
     */
    public getAmplitudes(): Complex[] {
        return [...this.amplitudes];
    }

    /**
     * Sets the amplitude for a specific basis state.
     * @param index The basis state index
     * @param amplitude The complex amplitude
     */
    public setAmplitude(index: number, amplitude: Complex): void {
        if (index < 0 || index >= this.amplitudes.length) {
            throw new Error('Invalid state index');
        }
        this.amplitudes[index] = { ...amplitude };
    }

    /**
     * Gets the probability of measuring a specific basis state.
     * @param index The basis state index
     */
    public getProbability(index: number): number {
        if (index < 0 || index >= this.amplitudes.length) {
            throw new Error('Invalid state index');
        }
        const amplitude = this.amplitudes[index];
        return amplitude.real * amplitude.real + amplitude.imag * amplitude.imag;
    }

    /**
     * Normalizes the quantum state.
     */
    public normalize(): void {
        let normSquared = 0;
        for (const amplitude of this.amplitudes) {
            normSquared += amplitude.real * amplitude.real + amplitude.imag * amplitude.imag;
        }
        const norm = Math.sqrt(normSquared);
        if (norm === 0) {
            throw new Error('Cannot normalize zero state');
        }
        this.amplitudes = this.amplitudes.map(amplitude => ({
            real: amplitude.real / norm,
            imag: amplitude.imag / norm
        }));
    }

    /**
     * Creates a tensor product with another quantum state.
     * @param other The other quantum state
     */
    public tensorProduct(other: QuantumState): QuantumState {
        const newNumQubits = this.numQubits + other.numQubits;
        const result = new QuantumState(newNumQubits);
        
        for (let i = 0; i < this.amplitudes.length; i++) {
            for (let j = 0; j < other.amplitudes.length; j++) {
                const newIndex = i * other.amplitudes.length + j;
                result.amplitudes[newIndex] = {
                    real: this.amplitudes[i].real * other.amplitudes[j].real - 
                          this.amplitudes[i].imag * other.amplitudes[j].imag,
                    imag: this.amplitudes[i].real * other.amplitudes[j].imag + 
                          this.amplitudes[i].imag * other.amplitudes[j].real
                };
            }
        }
        return result;
    }

    /**
     * Measures the quantum state, collapsing it to a basis state.
     * Returns the measured basis state index.
     */
    public measure(): number {
        const random = Math.random();
        let cumulativeProbability = 0;
        
        for (let i = 0; i < this.amplitudes.length; i++) {
            cumulativeProbability += this.getProbability(i);
            if (random <= cumulativeProbability) {
                // Collapse the state
                this.amplitudes = new Array(this.amplitudes.length).fill({ real: 0, imag: 0 });
                this.amplitudes[i] = { real: 1, imag: 0 };
                return i;
            }
        }
        
        // This should never happen with normalized states
        throw new Error('Measurement failed: state not normalized');
    }

    /**
     * Creates a copy of the quantum state.
     */
    public clone(): QuantumState {
        const copy = new QuantumState(this.numQubits);
        copy.amplitudes = this.amplitudes.map(amplitude => ({ ...amplitude }));
        return copy;
    }
} 