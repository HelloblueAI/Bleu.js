const seedDatabase = require('./backend/tests/seedDatabase.test');

beforeAll(async () => {
  await seedDatabase();
});
