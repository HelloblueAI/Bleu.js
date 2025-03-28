use wasm_bindgen::prelude::*;
use js_sys::{Array, Object, Reflect};
use std::collections::{HashMap, HashSet};
use std::iter::FromIterator;
use regex::Regex;
use serde::{Serialize, Deserialize};
use serde_json::Value;

#[wasm_bindgen]
pub struct Optimizer {
    rules: HashMap<String, OptimizationRule>,
    patterns: HashMap<String, Regex>,
    metrics: OptimizationMetrics,
}

#[derive(Serialize, Deserialize)]
struct OptimizationRule {
    pattern: String,
    replacement: String,
    priority: u32,
    category: String,
    description: String,
}

#[derive(Serialize, Deserialize)]
struct OptimizationMetrics {
    total_optimizations: u32,
    successful_optimizations: u32,
    failed_optimizations: u32,
    average_improvement: f64,
    optimization_history: Vec<OptimizationResult>,
}

#[derive(Serialize, Deserialize)]
struct OptimizationResult {
    timestamp: String,
    rule_applied: String,
    improvement_percentage: f64,
    original_size: usize,
    optimized_size: usize,
}

#[wasm_bindgen]
impl Optimizer {
    #[wasm_bindgen(constructor)]
    pub fn new() -> Optimizer {
        let mut rules = HashMap::new();
        let mut patterns = HashMap::new();

        // Performance optimization rules
        rules.insert(
            "for_loop".to_string(),
            OptimizationRule {
                pattern: r"for\s*\(\s*let\s+i\s*=\s*0\s*;\s*i\s*<\s*arr\.length\s*;\s*i\+\+\s*\)".to_string(),
                replacement: "for (const item of arr)".to_string(),
                priority: 1,
                category: "performance".to_string(),
                description: "Convert traditional for loop to for...of".to_string(),
            },
        );

        rules.insert(
            "map_filter".to_string(),
            OptimizationRule {
                pattern: r"arr\.filter\([^)]+\)\.map\([^)]+\)".to_string(),
                replacement: "arr.map($2).filter($1)".to_string(),
                priority: 2,
                category: "performance".to_string(),
                description: "Optimize chained filter and map operations".to_string(),
            },
        );

        // Memory optimization rules
        rules.insert(
            "array_spread".to_string(),
            OptimizationRule {
                pattern: r"Array\.from\([^)]+\)".to_string(),
                replacement: "[...$1]".to_string(),
                priority: 3,
                category: "memory".to_string(),
                description: "Use spread operator instead of Array.from".to_string(),
            },
        );

        // Code style optimization rules
        rules.insert(
            "arrow_function".to_string(),
            OptimizationRule {
                pattern: r"function\s*\([^)]*\)\s*{\s*return\s+([^}]+)\s*}".to_string(),
                replacement: "($1) => $2".to_string(),
                priority: 4,
                category: "style".to_string(),
                description: "Convert simple functions to arrow functions".to_string(),
            },
        );

        // Compile regex patterns
        for (key, rule) in &rules {
            patterns.insert(key.clone(), Regex::new(&rule.pattern).unwrap());
        }

        Optimizer {
            rules,
            patterns,
            metrics: OptimizationMetrics {
                total_optimizations: 0,
                successful_optimizations: 0,
                failed_optimizations: 0,
                average_improvement: 0.0,
                optimization_history: Vec::new(),
            },
        }
    }

    #[wasm_bindgen]
    pub fn optimize(&mut self, code: &str) -> String {
        let mut optimized = code.to_string();
        let original_size = optimized.len();
        let mut total_improvement = 0.0;
        let mut successful_optimizations = 0;

        // Sort rules by priority
        let mut rule_entries: Vec<_> = self.rules.iter().collect();
        rule_entries.sort_by(|a, b| b.1.priority.cmp(&a.1.priority));

        // Apply optimization rules
        for (key, rule) in rule_entries {
            if let Some(pattern) = self.patterns.get(key) {
                let before_size = optimized.len();
                optimized = pattern.replace_all(&optimized, &rule.replacement).to_string();
                let after_size = optimized.len();

                if after_size < before_size {
                    let improvement = ((before_size - after_size) as f64 / before_size as f64) * 100.0;
                    total_improvement += improvement;
                    successful_optimizations += 1;

                    // Record optimization result
                    self.metrics.optimization_history.push(OptimizationResult {
                        timestamp: chrono::Utc::now().to_rfc3339(),
                        rule_applied: key.clone(),
                        improvement_percentage: improvement,
                        original_size: before_size,
                        optimized_size: after_size,
                    });
                }
            }
        }

        // Update metrics
        self.metrics.total_optimizations += 1;
        self.metrics.successful_optimizations += successful_optimizations;
        self.metrics.failed_optimizations += 1 - successful_optimizations;
        self.metrics.average_improvement = total_improvement / successful_optimizations as f64;

        // Clean up the code
        optimized = self._cleanup_code(&optimized);

        optimized
    }

    #[wasm_bindgen]
    pub fn analyze(&self, code: &str) -> JsValue {
        let mut analysis = HashMap::new();
        
        // Basic metrics
        analysis.insert("lines", code.lines().count());
        analysis.insert("characters", code.chars().count());
        analysis.insert("bytes", code.as_bytes().len());
        
        // Code structure analysis
        analysis.insert("functions", code.matches("function").count());
        analysis.insert("arrow_functions", code.matches("=>").count());
        analysis.insert("classes", code.matches("class").count());
        analysis.insert("methods", code.matches("method").count());
        
        // Variable declarations
        analysis.insert("let_declarations", code.matches("let ").count());
        analysis.insert("const_declarations", code.matches("const ").count());
        analysis.insert("var_declarations", code.matches("var ").count());
        
        // Control structures
        analysis.insert("if_statements", code.matches("if ").count());
        analysis.insert("else_statements", code.matches("else ").count());
        analysis.insert("for_loops", code.matches("for ").count());
        analysis.insert("while_loops", code.matches("while ").count());
        analysis.insert("switch_statements", code.matches("switch ").count());
        
        // Modern JavaScript features
        analysis.insert("async_functions", code.matches("async ").count());
        analysis.insert("await_keywords", code.matches("await ").count());
        analysis.insert("spread_operators", code.matches("...").count());
        analysis.insert("destructuring", code.matches("{").count());
        
        // Complexity metrics
        analysis.insert("nesting_depth", self._calculate_nesting_depth(code));
        analysis.insert("cyclomatic_complexity", self._calculate_cyclomatic_complexity(code));
        
        // Convert to JsValue
        let array = Array::new();
        for (key, value) in analysis {
            let entry = Array::new();
            entry.push(&JsValue::from_str(key));
            entry.push(&JsValue::from(value));
            array.push(&entry);
        }
        
        array.into()
    }

    #[wasm_bindgen]
    pub fn add_rule(&mut self, pattern: &str, replacement: &str, priority: u32, category: &str, description: &str) {
        let key = format!("custom_rule_{}", self.rules.len());
        self.rules.insert(
            key.clone(),
            OptimizationRule {
                pattern: pattern.to_string(),
                replacement: replacement.to_string(),
                priority,
                category: category.to_string(),
                description: description.to_string(),
            },
        );
        self.patterns.insert(key, Regex::new(pattern).unwrap());
    }

    #[wasm_bindgen]
    pub fn remove_rule(&mut self, pattern: &str) {
        if let Some(key) = self.rules.iter().find(|(_, r)| r.pattern == pattern).map(|(k, _)| k.clone()) {
            self.rules.remove(&key);
            self.patterns.remove(&key);
        }
    }

    #[wasm_bindgen]
    pub fn get_rules(&self) -> JsValue {
        let array = Array::new();
        for (key, rule) in &self.rules {
            let entry = Object::new();
            Reflect::set(
                &entry,
                &JsValue::from_str("key"),
                &JsValue::from_str(key),
            ).unwrap();
            Reflect::set(
                &entry,
                &JsValue::from_str("pattern"),
                &JsValue::from_str(&rule.pattern),
            ).unwrap();
            Reflect::set(
                &entry,
                &JsValue::from_str("replacement"),
                &JsValue::from_str(&rule.replacement),
            ).unwrap();
            Reflect::set(
                &entry,
                &JsValue::from_str("priority"),
                &JsValue::from(rule.priority),
            ).unwrap();
            Reflect::set(
                &entry,
                &JsValue::from_str("category"),
                &JsValue::from_str(&rule.category),
            ).unwrap();
            Reflect::set(
                &entry,
                &JsValue::from_str("description"),
                &JsValue::from_str(&rule.description),
            ).unwrap();
            array.push(&entry);
        }
        array.into()
    }

    #[wasm_bindgen]
    pub fn get_metrics(&self) -> JsValue {
        serde_wasm_bindgen::to_value(&self.metrics).unwrap()
    }

    // Private methods

    fn _cleanup_code(&self, code: &str) -> String {
        let mut cleaned = code.to_string();

        // Remove unnecessary whitespace
        cleaned = cleaned.replace("  ", " ").trim().to_string();

        // Remove empty lines
        cleaned = cleaned
            .lines()
            .filter(|line| !line.trim().is_empty())
            .collect::<Vec<_>>()
            .join("\n");

        // Add proper spacing around operators
        cleaned = cleaned
            .replace("+", " + ")
            .replace("-", " - ")
            .replace("*", " * ")
            .replace("/", " / ")
            .replace("=", " = ")
            .replace("==", " == ")
            .replace("===", " === ")
            .replace("!=", " != ")
            .replace("!==", " !==")
            .replace(">", " > ")
            .replace("<", " < ")
            .replace(">=", " >= ")
            .replace("<=", " <= ");

        // Remove extra spaces
        cleaned = cleaned.replace("  ", " ").trim().to_string();

        cleaned
    }

    fn _calculate_nesting_depth(&self, code: &str) -> u32 {
        let mut depth = 0;
        let mut max_depth = 0;
        let mut in_string = false;
        let mut string_char = ' ';

        for c in code.chars() {
            match c {
                '"' | '\'' => {
                    if !in_string {
                        in_string = true;
                        string_char = c;
                    } else if c == string_char {
                        in_string = false;
                    }
                }
                '{' if !in_string => depth += 1,
                '}' if !in_string => {
                    if depth > 0 {
                        depth -= 1;
                        max_depth = max_depth.max(depth);
                    }
                }
                _ => {}
            }
        }

        max_depth
    }

    fn _calculate_cyclomatic_complexity(&self, code: &str) -> u32 {
        let mut complexity = 1; // Base complexity

        // Count control structures
        complexity += code.matches("if ").count() as u32;
        complexity += code.matches("else ").count() as u32;
        complexity += code.matches("for ").count() as u32;
        complexity += code.matches("while ").count() as u32;
        complexity += code.matches("catch ").count() as u32;
        complexity += code.matches("&&").count() as u32;
        complexity += code.matches("||").count() as u32;

        complexity
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_optimizer_creation() {
        let optimizer = Optimizer::new();
        assert!(!optimizer.rules.is_empty());
        assert!(!optimizer.patterns.is_empty());
    }

    #[test]
    fn test_basic_optimization() {
        let mut optimizer = Optimizer::new();
        let code = "for (let i = 0; i < arr.length; i++) { console.log(arr[i]); }";
        let optimized = optimizer.optimize(code);
        assert!(optimized.contains("for (const item of arr)"));
    }

    #[test]
    fn test_code_analysis() {
        let optimizer = Optimizer::new();
        let code = "function test() { if (true) { console.log('test'); } }";
        let analysis = optimizer.analyze(code);
        assert!(analysis.is_object());
    }

    #[test]
    fn test_rule_management() {
        let mut optimizer = Optimizer::new();
        let initial_rules = optimizer.rules.len();
        
        optimizer.add_rule(
            "test_pattern",
            "test_replacement",
            1,
            "test",
            "Test rule"
        );
        assert_eq!(optimizer.rules.len(), initial_rules + 1);
        
        optimizer.remove_rule("test_pattern");
        assert_eq!(optimizer.rules.len(), initial_rules);
    }
} 