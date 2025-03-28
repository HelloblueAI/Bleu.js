"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Bleu_1 = require("../Bleu");
const express_1 = __importDefault(require("express"));
const mongoose_1 = __importDefault(require("mongoose"));
jest.mock('express');
jest.mock('mongoose');
describe('Bleu', () => {
    let bleu;
    const mockApp = {
        use: jest.fn(),
        get: jest.fn(),
        listen: jest.fn().mockReturnValue({
            close: jest.fn().mockImplementation(cb => cb?.())
        })
    };
    beforeEach(() => {
        jest.clearAllMocks();
        express_1.default.mockReturnValue(mockApp);
        bleu = new Bleu_1.Bleu();
    });
    it('should initialize with default config', () => {
        expect(bleu.app).toBeDefined();
        expect(express_1.default).toHaveBeenCalled();
    });
    it('should start server and connect to MongoDB', async () => {
        await bleu.start();
        expect(mockApp.listen).toHaveBeenCalledWith(3000, expect.any(Function));
        expect(mongoose_1.default.connect).toHaveBeenCalled();
    });
    it('should handle graceful shutdown', async () => {
        await bleu.start();
        await bleu.stop();
        expect(mockApp.listen().close).toHaveBeenCalled();
        expect(mongoose_1.default.disconnect).toHaveBeenCalled();
    });
    it('should expose app and logger instances', () => {
        expect(bleu.app).toBeInstanceOf(Object);
        expect(bleu.logger).toBeDefined();
    });
});
//# sourceMappingURL=Bleu.test.js.map