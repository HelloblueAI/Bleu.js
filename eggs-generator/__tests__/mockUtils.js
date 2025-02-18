export const createMockLogger = () => ({
  info: () => {},
  warn: () => {},
  error: () => {},
  debug: () => {}
});

export const createMockFormatters = () => ({
  combine: () => {},
  timestamp: () => {},
  printf: () => {},
  colorize: () => {},
  json: () => {}
});

export const createMockTransport = () => ({
  on: () => {},
  emit: () => {}
});

export const createWinstonMock = () => ({
  createLogger: () => createMockLogger(),
  format: createMockFormatters(),
  transports: {
    Console: () => createMockTransport(),
    File: () => createMockTransport()
  }
});
