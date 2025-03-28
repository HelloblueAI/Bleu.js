// Sample code with various code quality aspects to test

/**
 * @description A complex function with high cyclomatic complexity
 * @param {number} x - Input number
 * @returns {number} Processed result
 */
function complexFunction(x) {
    if (x < 0) {
        return -x;
    }
    if (x > 100) {
        return x * 2;
    }
    if (x % 2 === 0) {
        return x / 2;
    }
    if (x % 3 === 0) {
        return x * 3;
    }
    if (x % 5 === 0) {
        return x * 5;
    }
    return x;
}

// Duplicate code block
function duplicateFunction(x) {
    if (x < 0) {
        return -x;
    }
    if (x > 100) {
        return x * 2;
    }
    if (x % 2 === 0) {
        return x / 2;
    }
    if (x % 3 === 0) {
        return x * 3;
    }
    if (x % 5 === 0) {
        return x * 5;
    }
    return x;
}

// Performance bottleneck
function performanceBottleneck(arr) {
    let result = [];
    for (let i = 0; i < arr.length; i++) {
        for (let j = 0; j < arr.length; j++) {
            result.push(arr[i] * arr[j]);
        }
    }
    return result;
}

// Security vulnerability
function unsafeEval(code) {
    return eval(code); // Security risk
}

// Style issues
const styleIssues = {
    'no-semicolon': 'missing semicolon',
    'camelCase': 'should be camelCase',
    'indentation': '    inconsistent indentation'
}

// Unused variable
const unusedVariable = 'This is never used';

// Missing documentation
function undocumentedFunction(x) {
    return x * x;
}

// Complex nested callbacks
function complexCallbacks(callback) {
    setTimeout(() => {
        callback(() => {
            setTimeout(() => {
                callback(() => {
                    setTimeout(() => {
                        callback();
                    }, 1000);
                });
            }, 1000);
        });
    }, 1000);
}

// Memory leak potential
class MemoryLeak {
    constructor() {
        this.listeners = [];
    }
    
    addListener(listener) {
        this.listeners.push(listener);
    }
    
    // Missing removeListener method
}

// Export for testing
module.exports = {
    complexFunction,
    duplicateFunction,
    performanceBottleneck,
    unsafeEval,
    styleIssues,
    undocumentedFunction,
    complexCallbacks,
    MemoryLeak
}; 