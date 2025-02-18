'use strict';

/* eslint-env node */

class Engine {
  evaluate(data) {
    if (data.temperature > 100) {
      return [
        {
          message: 'Extremely high temperature detected',
        },
      ];
    }
    return [
      {
        message: 'High temperature detected',
      },
    ];
  }
}
module.exports = Engine;
