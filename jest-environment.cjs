const NodeEnvironment = require('jest-environment-node');
const { TextEncoder, TextDecoder } = require('util');

class CustomEnvironment extends NodeEnvironment {
  constructor(config) {
    super({
      ...config,
      testEnvironmentOptions: {
        url: 'http://localhost',
      },
    });
  }

  async setup() {
    await super.setup();
    this.global.TextEncoder = TextEncoder;
    this.global.TextDecoder = TextDecoder;
    this.global.ArrayBuffer = ArrayBuffer;
    this.global.Uint8Array = Uint8Array;
  }
}

module.exports = CustomEnvironment;
