module.exports = () => {
  // Add custom Jest matchers
  process.env.NODE_ENV = 'test';

  global.console = {
    log: jest.fn(), 
    error: jest.fn(), 
    warn: jest.fn(), 
    info: jest.fn(), 
  };
};
