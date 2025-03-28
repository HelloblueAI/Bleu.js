"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
exports.createLogger = createLogger;
const winston_1 = __importDefault(require("winston"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const logsDir = path_1.default.join(process.cwd(), 'logs');
// Create logs directory if it doesn't exist
if (!fs_1.default.existsSync(logsDir)) {
    fs_1.default.mkdirSync(logsDir, { recursive: true });
}
const logFormat = winston_1.default.format.combine(winston_1.default.format.timestamp(), winston_1.default.format.json());
function createLogger(level = 'info') {
    return winston_1.default.createLogger({
        level,
        format: logFormat,
        transports: [
            new winston_1.default.transports.Console({
                format: winston_1.default.format.combine(winston_1.default.format.colorize(), winston_1.default.format.simple())
            }),
            new winston_1.default.transports.File({
                filename: path_1.default.join(logsDir, 'error.log'),
                level: 'error'
            }),
            new winston_1.default.transports.File({
                filename: path_1.default.join(logsDir, 'combined.log')
            })
        ]
    });
}
exports.logger = createLogger();
//# sourceMappingURL=logger.js.map