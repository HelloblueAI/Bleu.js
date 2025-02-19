
//  Copyright (c) 2025, Helloblue Inc.
//  Open-Source Community Edition

//  Permission is hereby granted, free of charge, to any person obtaining a copy
//  of this software and associated documentation files (the "Software"), to use,
//  copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
//  the Software, subject to the following conditions:

//  1. The above copyright notice and this permission notice shall be included in
//     all copies or substantial portions of the Software.
//  2. Contributions to this project are welcome and must adhere to the project's
//     contribution guidelines.
//  3. The name "Helloblue Inc." and its contributors may not be used to endorse
//     or promote products derived from this software without prior written consent.

//  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
//  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
//  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
//  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
//  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
//  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
//  THE SOFTWARE.
/* eslint-env jest */
const isDebug = process.env.DEBUG_TESTS === 'true';


afterEach(() => {
    if (global.server) {
        try {
            global.server.close(() => {
                if (isDebug) console.info('✅ Server closed after test suite.');
            });
        } catch (error) {
            console.error('❌ Error closing server:', error);
        }
    }


    jest.restoreAllMocks();
    jest.resetModules();
    jest.clearAllMocks();
    jest.clearAllTimers();

    if (isDebug) console.info('✅ Jest cleanup completed.');
});


global.__TEST_ENV__ = {
    apiBaseUrl: 'http://localhost:4000',
    defaultTimeout: 5000,
};


jest.mock('fs', () => ({
    readFileSync: jest.fn(() => 'mocked file content'),
    writeFileSync: jest.fn(),
    existsSync: jest.fn(() => true),
}));

jest.mock('path', () => ({
    join: jest.fn((...args) => args.join('/')),
}));


jest.spyOn(global.console, 'log').mockImplementation((...args) => isDebug && console.info('[LOG]:', ...args));
jest.spyOn(global.console, 'error').mockImplementation((...args) => isDebug && console.info('[ERROR]:', ...args));
jest.spyOn(global.console, 'warn').mockImplementation((...args) => isDebug && console.info('[WARN]:', ...args));

if (isDebug) console.info('✅ Jest test setup initialized.');
