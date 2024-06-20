/* eslint-env node, jest */
const { seedDatabase } = require('../services/seedDatabase');

beforeAll(() => {
  console.log = jest.fn();
  console.error = jest.fn();
});

afterAll(() => {
  console.log.mockRestore();
  console.error.mockRestore();
});

test('should seed the database', async () => {
  await seedDatabase();
  expect(console.log).toHaveBeenCalledWith('Database seeded successfully');
});
