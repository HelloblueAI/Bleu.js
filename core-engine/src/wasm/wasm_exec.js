/**
 * WASM Execution Helper
 * Provides Go-like functionality for WASM execution.
 */

// Go-like functionality for WASM execution
class Go {
  constructor() {
    this.argv = ['js'];
    this.env = {};
    this.exit = (code) => {
      if (code !== 0) {
        console.warn('exit code:', code);
      }
    };
    this._callbackTimeouts = new Map();
    this._nextCallbackTimeoutID = 1;

    const mem = () => {
      // The buffer may change when requesting more memory.
      return new DataView(this._inst.exports.memory.buffer);
    };

    const setInt64 = (addr, v) => {
      mem().setUint32(addr + 0, v, true);
      mem().setUint32(addr + 4, Math.floor(v / 4294967296), true);
    };

    const getInt64 = (addr) => {
      const low = mem().getUint32(addr + 0, true);
      const high = mem().getInt32(addr + 4, true);
      return low + high * 4294967296;
    };

    const loadValue = (addr) => {
      const f = mem().getFloat64(addr, true);
      if (f === 0) {
        return undefined;
      }
      if (!isNaN(f)) {
        return f;
      }

      const id = mem().getUint32(addr, true);
      return this._values[id];
    };

    const storeValue = (addr, v) => {
      const nanHead = 0x7FF80000;

      if (typeof v === 'number' && v !== 0) {
        if (isNaN(v)) {
          mem().setUint32(addr + 4, nanHead, true);
          mem().setUint32(addr, 0, true);
          return;
        }
        mem().setFloat64(addr, v, true);
        return;
      }

      if (v === undefined) {
        mem().setFloat64(addr, 0, true);
        return;
      }

      let id = this._values.length;
      this._values.push(v);
      mem().setUint32(addr + 4, nanHead, true);
      mem().setUint32(addr, id, true);
    };

    const loadSlice = (addr) => {
      const array = getInt64(addr + 0);
      const len = getInt64(addr + 8);
      return new Uint8Array(this._inst.exports.memory.buffer, array, len);
    };

    const loadSliceOfValues = (addr) => {
      const array = getInt64(addr + 0);
      const len = getInt64(addr + 8);
      const values = [];
      for (let i = 0; i < len; i++) {
        values.push(loadValue(array + i * 8));
      }
      return values;
    };

    const loadString = (addr) => {
      const saddr = getInt64(addr + 0);
      const len = getInt64(addr + 8);
      return decoder.decode(new DataView(this._inst.exports.memory.buffer, saddr, len));
    };

    const timeOrigin = Date.now() - performance.now();
    this.importObject = {
      go: {
        // Go's SP does not change as long as no Go code is running. Some operations (e.g., calls, getcallerspc) read the SP
        // from the Go stack header, so we must update it when memory changes without a Go call.
        _updateSP: () => { }, // TODO

        // func wasmExit(code int32)
        'runtime.wasmExit': (sp) => {
          const code = mem().getInt32(sp + 8, true);
          this.exited = true;
          delete this._inst;
          delete this._values;
          delete this._goRefCounts;
          delete this._ids;
          delete this._idPool;
          this.exit(code);
        },

        // func wasmWrite(fd uintptr, p unsafe.Pointer, n int32)
        'runtime.wasmWrite': (sp) => {
          const fd = getInt64(sp + 8);
          const p = getInt64(sp + 16);
          const n = mem().getInt32(sp + 24, true);
          fs.writeSync(fd, new Uint8Array(this._inst.exports.memory.buffer, p, n));
        },

        // func resetMemoryDataView()
        'runtime.resetMemoryDataView': (sp) => {
          this._inst.exports.memory = new WebAssembly.Memory(this._inst.exports.memory);
        },

        // func nanotime1() int64
        'runtime.nanotime1': (sp) => {
          setInt64(sp + 8, (timeOrigin + performance.now()) * 1000000);
        },

        // func walltime() (sec int64, nsec int32)
        'runtime.walltime': (sp) => {
          const view = getInt64(sp + 8);
          const time = Date.now() / 1000;
          setInt64(view, Math.floor(time));
          mem().setInt32(view + 8, (time % 1) * 1000000000, true);
        },

        // func scheduleTimeoutEvent(delay int64) int32
        'runtime.scheduleTimeoutEvent': (sp) => {
          const id = this._nextCallbackTimeoutID;
          this._nextCallbackTimeoutID++;
          this._callbackTimeouts.set(id, setTimeout(
            () => {
              this._resume();
            },
            getInt64(sp + 8) / 1000000
          ));
          mem().setInt32(sp + 16, id, true);
        },

        // func clearTimeoutEvent(id int32)
        'runtime.clearTimeoutEvent': (sp) => {
          const id = mem().getInt32(sp + 8, true);
          clearTimeout(this._callbackTimeouts.get(id));
          this._callbackTimeouts.delete(id);
        },

        // func getRandomData(r []byte)
        'runtime.getRandomData': (sp) => {
          crypto.getRandomValues(loadSlice(sp + 8));
        },

        // func finalizeRef(v ref)
        'syscall/js.finalizeRef': (sp) => {
          const id = mem().getUint32(sp + 8, true);
          this._goRefCounts[id]--;
          if (this._goRefCounts[id] === 0) {
            const v = this._values[id];
            this._values[id] = null;
            this._ids.delete(v);
            this._idPool.push(id);
          }
        },

        // func stringVal(value string) ref
        'syscall/js.stringVal': (sp) => {
          const v = loadString(sp + 8);
          storeValue(sp + 24, v);
        },

        // func valueGet(v ref, p string) ref
        'syscall/js.valueGet': (sp) => {
          const result = Reflect.get(loadValue(sp + 8), loadString(sp + 16));
          storeValue(sp + 32, result);
        },

        // func valueSet(v ref, p string, x ref)
        'syscall/js.valueSet': (sp) => {
          Reflect.set(loadValue(sp + 8), loadString(sp + 16), loadValue(sp + 32));
        },

        // func valueDelete(v ref, p string)
        'syscall/js.valueDelete': (sp) => {
          Reflect.deleteProperty(loadValue(sp + 8), loadString(sp + 16));
        },

        // func valueIndex(v ref, i int) ref
        'syscall/js.valueIndex': (sp) => {
          storeValue(sp + 24, Reflect.get(loadValue(sp + 8), getInt64(sp + 16)));
        },

        // valueSetIndex(v ref, i int, x ref)
        'syscall/js.valueSetIndex': (sp) => {
          Reflect.set(loadValue(sp + 8), getInt64(sp + 16), loadValue(sp + 24));
        },

        // func valueCall(v ref, m string, args []ref) (ref, bool)
        'syscall/js.valueCall': (sp) => {
          const v = loadValue(sp + 8);
          const m = loadString(sp + 16);
          const args = loadSliceOfValues(sp + 32);
          try {
            const result = Reflect.apply(Reflect.get(v, m), v, args);
            storeValue(sp + 56, result);
            mem().setUint8(sp + 64, 1);
          } catch (err) {
            storeValue(sp + 56, err);
            mem().setUint8(sp + 64, 0);
          }
        },

        // func valueInvoke(v ref, args []ref) (ref, bool)
        'syscall/js.valueInvoke': (sp) => {
          const v = loadValue(sp + 8);
          const args = loadSliceOfValues(sp + 16);
          try {
            const result = Reflect.apply(v, undefined, args);
            storeValue(sp + 40, result);
            mem().setUint8(sp + 48, 1);
          } catch (err) {
            storeValue(sp + 40, err);
            mem().setUint8(sp + 48, 0);
          }
        },

        // func valueNew(v ref, args []ref) (ref, bool)
        'syscall/js.valueNew': (sp) => {
          const v = loadValue(sp + 8);
          const args = loadSliceOfValues(sp + 16);
          try {
            const result = Reflect.construct(v, args);
            storeValue(sp + 40, result);
            mem().setUint8(sp + 48, 1);
          } catch (err) {
            storeValue(sp + 40, err);
            mem().setUint8(sp + 48, 0);
          }
        },

        // func valueLength(v ref) int
        'syscall/js.valueLength': (sp) => {
          setInt64(sp + 16, parseInt(loadValue(sp + 8).length));
        },

        // valuePrepareString(v ref) (ref, int)
        'syscall/js.valuePrepareString': (sp) => {
          const str = encoder.encode(String(loadValue(sp + 8)));
          storeValue(sp + 16, str);
          setInt64(sp + 24, str.length);
        },

        // valueLoadString(v ref, b []byte)
        'syscall/js.valueLoadString': (sp) => {
          const str = loadValue(sp + 8);
          loadSlice(sp + 16).set(str);
        },

        // func valueInstanceOf(v ref, t ref) bool
        'syscall/js.valueInstanceOf': (sp) => {
          mem().setUint8(sp + 24, loadValue(sp + 8) instanceof loadValue(sp + 16));
        },

        // func copyBytesToGo(dst []byte, src ref) int
        'syscall/js.copyBytesToGo': (sp) => {
          const dst = loadSlice(sp + 8);
          const src = loadValue(sp + 16);
          if (!(src instanceof Uint8Array)) {
            mem().setUint8(sp + 48, 0);
            return;
          }
          dst.set(src);
          setInt64(sp + 48, src.length);
        },

        // func copyBytesToJS(dst ref, src []byte) int
        'syscall/js.copyBytesToJS': (sp) => {
          const dst = loadValue(sp + 8);
          const src = loadSlice(sp + 16);
          if (!(dst instanceof Uint8Array)) {
            mem().setUint8(sp + 48, 0);
            return;
          }
          dst.set(src);
          setInt64(sp + 48, src.length);
        },

        debug: (value) => {
          console.log(value);
        },
      }
    };
  }

  async run(instance) {
    this._inst = instance;
    this._values = [ // JS values that Go currently has references to, indexed by reference id
      NaN,
      0,
      null,
      true,
      false,
      globalThis,
      this,
    ];
    this._goRefCounts = new Array(this._values.length).fill(Infinity); // number of references that Go has to a JS value, indexed by reference id
    this._ids = new Map([ // mapping from JS values to reference ids
      [0, 1],
      [null, 2],
      [true, 3],
      [false, 4],
      [globalThis, 5],
      [this, 6],
    ]);
    this._idPool = []; // unused ids that have been garbage collected
    this.exited = false; // whether the Go program has exited

    // Pass command line arguments
    const offset = 4096;

    const strPtr = (str) => {
      const ptr = offset + this._inst.exports.memory.buffer.byteLength;
      const bytes = encoder.encode(str + '\0');
      new Uint8Array(this._inst.exports.memory.buffer, offset, bytes.length).set(bytes);
      this._inst.exports.memory.grow(Math.ceil((offset + bytes.length + 8) / 65536));
      const ptr2 = offset + bytes.length;
      new DataView(this._inst.exports.memory.buffer).setUint32(ptr2, ptr, true);
      return ptr2;
    };
    const argc = this.argv.length;

    const argvPtrs = [];
    this.argv.forEach((arg) => {
      argvPtrs.push(strPtr(arg));
    });
    argvPtrs.push(0);

    const argv = offset + 4 * argc;
    new Uint8Array(this._inst.exports.memory.buffer, offset, 4 * argc).set(new Uint32Array(argvPtrs));
    this._inst.exports.memory.grow(Math.ceil((argv + 8) / 65536));
    new DataView(this._inst.exports.memory.buffer).setUint32(argv, argc, true);
    new DataView(this._inst.exports.memory.buffer).setUint32(argv + 4, argvPtrs[0], true);

    this._inst.exports.run(argc, argv);
    if (this.exited) {
      this._resume();
    }
    await this._scheduleEventLoop();
  }

  _resume() {
    if (this.exited) {
      if (this.exited) {
        this._resume();
      }
      return;
    }
    this._inst.exports.resume();
    if (this.exited) {
      return;
    }
    this._resume();
  }

  _scheduleEventLoop() {
    const pauseTime = 1;
    const _this = this;
    function schedule(pause) {
      setTimeout(_this._resume.bind(this), pause);
    }
    schedule(pauseTime);
  }
}

// Text encoder/decoder
const encoder = new TextEncoder();
const decoder = new TextDecoder();

// Export Go class
self.Go = Go; 