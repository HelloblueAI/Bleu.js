class Engine {
  /**
   * Evaluates input data and returns alerts based on conditions.
   * @param {Object} data - Input data containing various conditions.
   * @returns {Array} - List of alert messages based on the evaluated data.
   */
  evaluate(data) {
    if (!data || typeof data !== 'object') {
      throw new Error(
        '❌ Invalid input. Expected an object with evaluation parameters.',
      );
    }

    if (!('temperature' in data)) {
      throw new Error('❌ Missing "temperature" property in input data.');
    }

    if (typeof data.temperature !== 'number') {
      throw new Error('❌ Invalid "temperature" value. Expected a number.');
    }

    if (data.temperature > 100) {
      return [{ message: '🔥 Extremely high temperature detected' }];
    }

    return [{ message: '⚠️ High temperature detected' }];
  }
}

export default Engine;
