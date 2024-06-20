/* eslint-env node, jest */
const mongoose = require('mongoose');

afterAll(async () => {
  await mongoose.disconnect();
});
