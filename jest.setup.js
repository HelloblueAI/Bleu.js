jest.setTimeout(30000); // Set a higher timeout if your tests require more time

afterEach(() => {
  jest.resetModules(); 
});
