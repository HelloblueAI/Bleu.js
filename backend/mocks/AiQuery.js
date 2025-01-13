export const find = jest.fn().mockResolvedValue([]);
export const findById = jest.fn((id) => {
  if (id === 'valid-id') {
    return Promise.resolve({
      _id: 'valid-id',
      conditions: [{ key: 'age', operator: 'greater_than', value: 18 }],
      actions: ['approve'],
    });
  }
  return Promise.resolve(null);
});
export const save = jest.fn().mockResolvedValue(true);
export const findByIdAndUpdate = jest.fn().mockResolvedValue({
  _id: 'valid-id',
  conditions: [{ key: 'age', operator: 'greater_than', value: 18 }],
  actions: ['reject'],
});
export const findByIdAndDelete = jest.fn().mockResolvedValue(true);
