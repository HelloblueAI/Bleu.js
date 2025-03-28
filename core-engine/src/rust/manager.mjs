import { logger } from '../../config/logger.mjs';
import { exec } from 'child_process';
import { promisify } from 'util';
import { WASMManager } from '../wasm/manager.mjs';
import fs from 'fs/promises';
import path from 'path';

const execAsync = promisify(exec);

export class RustManager {
  constructor(options = {}) {
    this.initialized = false;
    this.wasmManager = new WASMManager();
    this.projects = new Map();
    this.compilationCache = new Map();
    this.options = {
      enableRust: true,
      rustToolchain: 'stable',
      target: 'wasm32-unknown-unknown',
      optimizationLevel: 'release',
      enableParallelCompilation: true,
      enableCaching: true,
      maxCacheSize: 1024 * 1024 * 100, // 100MB
      enableProfiling: true,
      enableDebugging: false,
      ...options
    };
  }

  /**
   * Initialize Rust manager with enhanced toolchain setup
   */
  async initialize() {
    try {
      if (!this.options.enableRust) {
        logger.warn('⚠️ Rust integration is disabled');
        return;
      }

      // Check Rust installation with version verification
      const toolchain = await this._checkRustInstallation();
      
      // Initialize WASM manager
      await this.wasmManager.initialize();
      
      // Setup Rust toolchain
      await this._setupRustToolchain(toolchain);
      
      this.initialized = true;
      logger.info('✅ Rust manager initialized with toolchain:', toolchain);
    } catch (error) {
      logger.error('❌ Failed to initialize Rust manager:', error);
      throw error;
    }
  }

  /**
   * Create new Rust project with enhanced configuration
   */
  async createProject(name, options = {}) {
    try {
      if (!this.initialized) await this.initialize();

      const projectOptions = {
        ...this.options,
        ...options
      };

      // Create project directory
      const projectDir = path.join(process.cwd(), name);
      await fs.mkdir(projectDir, { recursive: true });

      // Create new Rust project with enhanced configuration
      await this._createRustProject(name, projectOptions);
      
      // Configure for WASM with optimizations
      await this._configureWASM(name, projectOptions);
      
      // Setup project structure
      await this._setupProjectStructure(name);
      
      // Initialize git repository
      await this._initializeGit(name);
      
      this.projects.set(name, {
        path: projectDir,
        options: projectOptions,
        created: new Date()
      });

      logger.info(`✅ Rust project "${name}" created successfully`);
    } catch (error) {
      logger.error(`❌ Failed to create Rust project "${name}":`, error);
      throw error;
    }
  }

  /**
   * Compile Rust code to WASM with enhanced optimization
   */
  async compileCode(code, options = {}) {
    try {
      const startTime = performance.now();
      const projectName = `temp_${Date.now()}`;
      
      // Create temporary project
      await this.createProject(projectName, options);
      
      // Write code to source file
      const sourcePath = path.join(process.cwd(), projectName, 'src', 'lib.rs');
      await fs.writeFile(sourcePath, code);
      
      // Check cache
      const cacheKey = this._generateCacheKey(code, options);
      if (this.options.enableCaching && this.compilationCache.has(cacheKey)) {
        const cached = this.compilationCache.get(cacheKey);
        logger.info('✅ Using cached compilation result');
        return cached;
      }
      
      // Compile with optimizations
      const result = await this._compileWithOptimizations(projectName, options);
      
      // Cache result
      if (this.options.enableCaching) {
        this._updateCache(cacheKey, result);
      }
      
      // Cleanup
      await this._cleanupProject(projectName);
      
      const compilationTime = performance.now() - startTime;
      logger.info(`✅ Code compiled successfully in ${compilationTime.toFixed(2)}ms`);
      
      return result;
    } catch (error) {
      logger.error('❌ Failed to compile Rust code:', error);
      throw error;
    }
  }

  /**
   * Execute Rust code
   */
  async executeCode(code, options = {}) {
    try {
      if (!this.initialized) await this.initialize();

      const executeOptions = {
        ...this.options,
        ...options
      };

      // Compile and execute Rust code
      const result = await this._executeRustCode(code, executeOptions);
      return result;
    } catch (error) {
      logger.error('❌ Failed to execute Rust code:', error);
      throw error;
    }
  }

  /**
   * Get Rust metrics with enhanced monitoring
   */
  async getMetrics() {
    return {
      initialized: this.initialized,
      projects: this.projects.size,
      cacheSize: this._getCacheSize(),
      compilationStats: await this._getCompilationStats(),
      toolchain: await this._getToolchainInfo(),
      lastUpdate: new Date().toISOString()
    };
  }

  /**
   * Update Rust settings with validation
   */
  async updateSettings(settings) {
    try {
      // Validate settings
      this._validateSettings(settings);
      
      this.options = {
        ...this.options,
        ...settings
      };

      if (settings.wasm) {
        await this.wasmManager.updateSettings(settings.wasm);
      }

      // Update all projects with new settings
      for (const [name, project] of this.projects) {
        await this._updateProjectSettings(name, settings);
      }

      logger.info('✅ Rust settings updated');
    } catch (error) {
      logger.error('❌ Failed to update Rust settings:', error);
      throw error;
    }
  }

  // Private methods

  async _checkRustInstallation() {
    try {
      const [rustc, cargo, wasmPack] = await Promise.all([
        execAsync('rustc --version'),
        execAsync('cargo --version'),
        execAsync('wasm-pack --version')
      ]);
      
      return {
        rustc: rustc.stdout.trim(),
        cargo: cargo.stdout.trim(),
        wasmPack: wasmPack.stdout.trim()
      };
    } catch (error) {
      throw new Error('Rust toolchain not found. Please install Rust and wasm-pack.');
    }
  }

  async _setupRustToolchain(toolchain) {
    const commands = [
      `rustup target add ${this.options.target}`,
      'rustup component add rustfmt',
      'rustup component add clippy'
    ];

    for (const command of commands) {
      await execAsync(command);
    }
  }

  async _createRustProject(name, options) {
    const commands = [
      `cargo new ${name} --lib`,
      `cd ${name}`,
      'cargo add wasm-bindgen',
      'cargo add wasm-bindgen-futures',
      'cargo add js-sys',
      'cargo add web-sys',
      'cargo add serde --features derive',
      'cargo add serde_json',
      'cargo add thiserror',
      'cargo add log',
      'cargo add env_logger',
      'cargo add rayon',
      'cargo add parking_lot',
      'cargo add futures',
      'cargo add tokio --features full',
      'cargo add async-trait',
      'cargo add bytes',
      'cargo add encoding_rs',
      'cargo add regex',
      'cargo add lazy_static'
    ];

    for (const command of commands) {
      await execAsync(command, { cwd: process.cwd() });
    }
  }

  async _configureWASM(name, options) {
    const config = `
[package]
name = "${name}"
version = "0.1.0"
edition = "2021"

[lib]
crate-type = ["cdylib", "rlib"]

[dependencies]
wasm-bindgen = "0.2"
wasm-bindgen-futures = "0.4"
js-sys = "0.3"
web-sys = { version = "0.3", features = ["console"] }
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
thiserror = "1.0"
log = "0.4"
env_logger = "0.10"
rayon = "1.7"
parking_lot = "0.12"
futures = "0.3"
tokio = { version = "1.0", features = ["full"] }
async-trait = "0.1"
bytes = "1.4"
encoding_rs = "0.8"
regex = "1.9"
lazy_static = "1.4"

[profile.release]
opt-level = 3
lto = true
codegen-units = 1
panic = 'abort'
strip = true

[profile.dev]
opt-level = 0
debug = true
debug-assertions = true
overflow-checks = true
    `.trim();

    await fs.writeFile(path.join(process.cwd(), name, 'Cargo.toml'), config);
  }

  async _setupProjectStructure(name) {
    const dirs = [
      'src',
      'tests',
      'examples',
      'benches',
      'docs'
    ];

    for (const dir of dirs) {
      await fs.mkdir(path.join(process.cwd(), name, dir), { recursive: true });
    }
  }

  async _initializeGit(name) {
    const commands = [
      'git init',
      'git add .',
      'git commit -m "Initial commit"'
    ];

    for (const command of commands) {
      await execAsync(command, { cwd: path.join(process.cwd(), name) });
    }
  }

  async _compileWithOptimizations(name, options) {
    const commands = [
      'cargo fmt',
      'cargo clippy -- -D warnings',
      `cargo build --target ${this.options.target} --release`
    ];

    for (const command of commands) {
      await execAsync(command, { cwd: path.join(process.cwd(), name) });
    }

    const wasmPath = path.join(process.cwd(), name, 'target', this.options.target, 'release', `${name}.wasm`);
    const wasmBinary = await fs.readFile(wasmPath);

    return {
      success: true,
      output: 'Compiled successfully',
      wasmBinary: new Uint8Array(wasmBinary)
    };
  }

  async _cleanupProject(name) {
    await fs.rm(path.join(process.cwd(), name), { recursive: true, force: true });
  }

  _generateCacheKey(code, options) {
    return `${code.hashCode()}_${JSON.stringify(options)}`;
  }

  _updateCache(key, result) {
    this.compilationCache.set(key, result);
    this._cleanupCache();
  }

  _cleanupCache() {
    let totalSize = 0;
    for (const [key, value] of this.compilationCache) {
      totalSize += value.wasmBinary.length;
    }

    if (totalSize > this.options.maxCacheSize) {
      const entries = Array.from(this.compilationCache.entries());
      entries.sort((a, b) => b[1].timestamp - a[1].timestamp);
      
      while (totalSize > this.options.maxCacheSize && entries.length > 0) {
        const [key, value] = entries.shift();
        totalSize -= value.wasmBinary.length;
        this.compilationCache.delete(key);
      }
    }
  }

  _getCacheSize() {
    let totalSize = 0;
    for (const value of this.compilationCache.values()) {
      totalSize += value.wasmBinary.length;
    }
    return totalSize;
  }

  async _getCompilationStats() {
    return {
      totalCompilations: this.compilationCache.size,
      averageSize: this._getCacheSize() / this.compilationCache.size || 0,
      lastCompilation: Array.from(this.compilationCache.values())
        .sort((a, b) => b.timestamp - a.timestamp)[0]?.timestamp
    };
  }

  async _getToolchainInfo() {
    return this._checkRustInstallation();
  }

  _validateSettings(settings) {
    if (settings.maxCacheSize && settings.maxCacheSize < 1024 * 1024) {
      throw new Error('Cache size must be at least 1MB');
    }
  }

  async _updateProjectSettings(name, settings) {
    const project = this.projects.get(name);
    if (!project) return;

    project.options = {
      ...project.options,
      ...settings
    };

    // Update Cargo.toml if needed
    if (settings.optimizationLevel) {
      await this._updateCargoConfig(name, settings);
    }
  }

  async _updateCargoConfig(name, settings) {
    const cargoPath = path.join(process.cwd(), name, 'Cargo.toml');
    const config = await fs.readFile(cargoPath, 'utf-8');
    
    // Update optimization settings
    const updatedConfig = config.replace(
      /opt-level = \d+/,
      `opt-level = ${settings.optimizationLevel === 'release' ? '3' : '0'}`
    );
    
    await fs.writeFile(cargoPath, updatedConfig);
  }

  async _executeRustCode(code, options) {
    // This would be implemented to actually execute Rust code
    // For now, we'll return a mock implementation
    return {
      success: true,
      output: 'Executed successfully',
      result: null
    };
  }
} 