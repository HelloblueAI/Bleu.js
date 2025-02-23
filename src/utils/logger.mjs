class Logger {
  info(message, data = {}) {
    console.log(`ℹ️ [INFO] ${message}`, data);
  }

  warn(message, data = {}) {
    console.warn(`⚠️ [WARN] ${message}`, data);
  }

  error(message, data = {}) {
    console.error(`❌ [ERROR] ${message}`, data);
  }
}

export default Logger;
