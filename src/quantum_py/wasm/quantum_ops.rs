use wasm_bindgen::prelude::*;
use std::f64::consts::PI;
use std::slice;

#[wasm_bindgen]
pub struct QuantumState {
    data: Vec<f64>,
    size: usize,
}

#[wasm_bindgen]
impl QuantumState {
    #[wasm_bindgen(constructor)]
    pub fn new(size: usize) -> QuantumState {
        let mut data = vec![0.0; size * size];
        for i in 0..size {
            data[i * size + i] = 1.0;
        }
        QuantumState { data, size }
    }

    pub fn apply_gate(&mut self, gate: &[f64], qubit: usize) {
        let mut new_data = vec![0.0; self.size * self.size];
        for i in 0..self.size {
            for j in 0..self.size {
                let i_qubit = (i >> qubit) & 1;
                let j_qubit = (j >> qubit) & 1;
                new_data[i * self.size + j] = gate[i_qubit * 2 + j_qubit] * self.data[i * self.size + j];
            }
        }
        self.data = new_data;
    }

    pub fn apply_cnot(&mut self, control: usize, target: usize) {
        let mut new_data = vec![0.0; this.size * this.size];
        for i in 0..this.size {
            for j in 0..this.size {
                let i_control = (i >> control) & 1;
                let i_target = (i >> target) & 1;
                let j_control = (j >> control) & 1;
                let j_target = (j >> target) & 1;

                if i_control == 1 && i_target != j_target {
                    new_data[i * this.size + j] = this.data[i * this.size + j];
                } else {
                    new_data[i * this.size + j] = this.data[i * this.size + j];
                }
            }
        }
        this.data = new_data;
    }

    pub fn measure(&self, basis: &str) -> Vec<f64> {
        let mut probabilities = vec![0.0; self.size];
        match basis {
            "z" => {
                for i in 0..self.size {
                    probabilities[i] = self.data[i * self.size + i].powi(2);
                }
            }
            "x" => {
                let hadamard = vec![
                    1.0 / 2.0_f64.sqrt(), 1.0 / 2.0_f64.sqrt(),
                    1.0 / 2.0_f64.sqrt(), -1.0 / 2.0_f64.sqrt(),
                ];
                let mut temp_state = self.clone();
                temp_state.apply_gate(&hadamard, 0);
                for i in 0..self.size {
                    probabilities[i] = temp_state.data[i * self.size + i].powi(2);
                }
            }
            "y" => {
                let y_gate = vec![
                    0.0, -1.0,
                    1.0, 0.0,
                ];
                let mut temp_state = self.clone();
                temp_state.apply_gate(&y_gate, 0);
                for i in 0..self.size {
                    probabilities[i] = temp_state.data[i * self.size + i].powi(2);
                }
            }
            _ => panic!("Unsupported basis"),
        }
        probabilities
    }

    pub fn get_entropy(&self) -> f64 {
        let mut entropy = 0.0;
        for i in 0..this.size {
            let prob = this.data[i * this.size + i].powi(2);
            if prob > 0.0 {
                entropy -= prob * prob.log2();
            }
        }
        entropy
    }

    pub fn apply_qft(&mut self, start: usize, end: usize) {
        let n = end - start;
        for i in 0..n {
            self.apply_hadamard(start + i);
            for j in 1..n-i {
                let phase = 2.0 * PI / (1 << j);
                self.apply_phase_gate(start + i + j, phase);
            }
        }
        // Reverse qubits
        for i in 0..n/2 {
            self.apply_swap(start + i, end - 1 - i);
        }
    }

    pub fn phase_estimation(&mut self, unitary: &[f64], precision: usize) -> f64 {
        let mut phase = 0.0;
        for i in 0..precision {
            self.apply_hadamard(i);
            for j in 0..(1 << i) {
                self.apply_unitary(unitary);
            }
            self.apply_controlled_phase(i, precision, -2.0 * PI / (1 << (precision - i)));
        }
        self.apply_inverse_qft(0, precision);
        phase
    }

    pub fn apply_error_correction(&mut self, syndrome: &[bool]) {
        // Apply error correction based on syndrome measurement
        for (i, &bit) in syndrome.iter().enumerate() {
            if bit {
                match i {
                    0 => self.apply_x(0),
                    1 => self.apply_z(0),
                    2 => self.apply_x(1),
                    3 => self.apply_z(1),
                    _ => {}
                }
            }
        }
    }

    pub fn apply_hadamard(&mut self, qubit: usize) {
        let hadamard = vec![
            1.0 / 2.0_f64.sqrt(), 1.0 / 2.0_f64.sqrt(),
            1.0 / 2.0_f64.sqrt(), -1.0 / 2.0_f64.sqrt(),
        ];
        self.apply_gate(&hadamard, qubit);
    }

    pub fn apply_phase_gate(&mut self, qubit: usize, phase: f64) {
        let phase_gate = vec![
            1.0, 0.0,
            0.0, (phase * std::f64::consts::I).exp(),
        ];
        self.apply_gate(&phase_gate, qubit);
    }

    pub fn apply_swap(&mut self, qubit1: usize, qubit2: usize) {
        let swap = vec![
            1.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 1.0, 0.0,
            0.0, 1.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 1.0,
        ];
        self.apply_gate(&swap, qubit1);
    }

    pub fn apply_unitary(&mut self, unitary: &[f64]) {
        let mut new_data = vec![0.0; self.size * self.size];
        for i in 0..self.size {
            for j in 0..self.size {
                for k in 0..self.size {
                    new_data[i * self.size + j] += unitary[i * self.size + k] * self.data[k * self.size + j];
                }
            }
        }
        self.data = new_data;
    }

    pub fn apply_controlled_phase(&mut self, control: usize, target: usize, phase: f64) {
        let mut new_data = vec![0.0; self.size * self.size];
        for i in 0..self.size {
            for j in 0..self.size {
                let i_control = (i >> control) & 1;
                if i_control == 1 {
                    new_data[i * self.size + j] = (phase * std::f64::consts::I).exp() * self.data[i * self.size + j];
                } else {
                    new_data[i * self.size + j] = self.data[i * self.size + j];
                }
            }
        }
        self.data = new_data;
    }

    pub fn apply_x(&mut self, qubit: usize) {
        let x_gate = vec![0.0, 1.0, 1.0, 0.0];
        self.apply_gate(&x_gate, qubit);
    }

    pub fn apply_z(&mut self, qubit: usize) {
        let z_gate = vec![1.0, 0.0, 0.0, -1.0];
        self.apply_gate(&z_gate, qubit);
    }
}

#[wasm_bindgen]
pub fn apply_quantum_gates(state_ptr: *mut f64, gates_ptr: *mut f64, size: usize) -> *mut f64 {
    let state = unsafe { slice::from_raw_parts_mut(state_ptr, size * size) };
    let gates = unsafe { slice::from_raw_parts(gates_ptr, size * size * 4) };

    let mut quantum_state = QuantumState {
        data: state.to_vec(),
        size,
    };

    for i in 0..size {
        let gate = &gates[i * 4..(i + 1) * 4];
        quantum_state.apply_gate(gate, i);
    }

    let result = quantum_state.data.as_mut_ptr();
    std::mem::forget(quantum_state);
    result
}

#[wasm_bindgen]
pub fn measure_quantum_state(state_ptr: *mut f64, basis_ptr: *const u8, size: usize) -> *mut f64 {
    let state = unsafe { slice::from_raw_parts_mut(state_ptr, size * size) };
    let basis = unsafe { std::str::from_utf8_unchecked(slice::from_raw_parts(basis_ptr, 1)) };

    let quantum_state = QuantumState {
        data: state.to_vec(),
        size,
    };

    let probabilities = quantum_state.measure(basis);
    let result = probabilities.as_mut_ptr();
    std::mem::forget(probabilities);
    result
}

#[wasm_bindgen]
pub fn prepare_quantum_state(data_ptr: *const f64, size: usize) -> *mut f64 {
    let data = unsafe { slice::from_raw_parts(data_ptr, size) };

    let mut quantum_state = QuantumState::new(size);
    for i in 0..size {
        quantum_state.data[i * size + i] = data[i];
    }

    let result = quantum_state.data.as_mut_ptr();
    std::mem::forget(quantum_state);
    result
}

#[wasm_bindgen]
pub fn compute_quantum_entropy(state_ptr: *mut f64, size: usize) -> f64 {
    let state = unsafe { slice::from_raw_parts_mut(state_ptr, size * size) };

    let quantum_state = QuantumState {
        data: state.to_vec(),
        size,
    };

    quantum_state.get_entropy()
}

#[wasm_bindgen]
pub fn allocate_memory(size: usize) -> *mut u8 {
    let mut buffer = Vec::with_capacity(size);
    let ptr = buffer.as_mut_ptr();
    std::mem::forget(buffer);
    ptr
}

#[wasm_bindgen]
pub fn get_memory_size(ptr: *mut u8) -> usize {
    unsafe {
        let vec = Vec::from_raw_parts(ptr, 0, 0);
        let size = vec.capacity();
        std::mem::forget(vec);
        size
    }
}

#[wasm_bindgen]
pub fn free_memory(ptr: *mut u8) {
    unsafe {
        let _vec = Vec::from_raw_parts(ptr, 0, 0);
    }
}

#[wasm_bindgen]
pub fn apply_quantum_fourier_transform(state_ptr: *mut f64, start: usize, end: usize, size: usize) -> *mut f64 {
    let state = unsafe { slice::from_raw_parts_mut(state_ptr, size * size) };

    let mut quantum_state = QuantumState {
        data: state.to_vec(),
        size,
    };

    quantum_state.apply_qft(start, end);

    let result = quantum_state.data.as_mut_ptr();
    std::mem::forget(quantum_state);
    result
}

#[wasm_bindgen]
pub fn estimate_phase(state_ptr: *mut f64, unitary_ptr: *const f64, precision: usize, size: usize) -> f64 {
    let state = unsafe { slice::from_raw_parts_mut(state_ptr, size * size) };
    let unitary = unsafe { slice::from_raw_parts(unitary_ptr, size * size) };

    let mut quantum_state = QuantumState {
        data: state.to_vec(),
        size,
    };

    quantum_state.phase_estimation(unitary, precision)
}

#[wasm_bindgen]
pub fn correct_quantum_errors(state_ptr: *mut f64, syndrome_ptr: *const bool, size: usize) -> *mut f64 {
    let state = unsafe { slice::from_raw_parts_mut(state_ptr, size * size) };
    let syndrome = unsafe { slice::from_raw_parts(syndrome_ptr, 4) };

    let mut quantum_state = QuantumState {
        data: state.to_vec(),
        size,
    };

    quantum_state.apply_error_correction(syndrome);

    let result = quantum_state.data.as_mut_ptr();
    std::mem::forget(quantum_state);
    result
}
