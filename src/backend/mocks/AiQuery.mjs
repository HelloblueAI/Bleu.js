export const find = jest.fn().mockResolvedValue([]);

/**
 * Mock function to find an AI query by ID.
 * @param {string} id - The ID of the AI query.
 * @returns {Promise<Object|null>} - The AI query object or null if not found.
 */
export const findById = jest.fn((id) => {
  return Promise.resolve(
    id === 'valid-id'
      ? {
          _id: 'valid-id',
          conditions: [{ key: 'age', operator: 'greater_than', value: 18 }],
          actions: ['approve'],
        }
      : null,
  );
});

/**
 * Mock function to save an AI query.
 * @returns {Promise<boolean>} - True if save is successful.
 */
export const save = jest.fn().mockResolvedValue(true);

/**
 * Mock function to update an AI query by ID.
 * @param {string} id - The ID of the AI query.
 * @returns {Promise<Object>} - The updated AI query object.
 */
export const findByIdAndUpdate = jest.fn((id) =>
  Promise.resolve({
    _id: id,
    conditions: [{ key: 'age', operator: 'greater_than', value: 18 }],
    actions: ['reject'],
  }),
);

/**
 * Mock function to delete an AI query by ID.
 * @returns {Promise<boolean>} - True if deletion is successful.
 */
export const findByIdAndDelete = jest.fn().mockResolvedValue(true);
