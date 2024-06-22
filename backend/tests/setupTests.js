afterEach(() => {
  if (global.server) {
    global.server.close(() => {
      console.log('Server closed after test suite.');
    });
  }
});
