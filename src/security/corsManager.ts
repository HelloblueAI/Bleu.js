import cors from 'cors';
import { Express } from 'express';
import { SecurityConfig } from './types';

/**
 * Manages CORS (Cross-Origin Resource Sharing) configuration and policies.
 */
export class CORSManager {
    private config: SecurityConfig;

    constructor(config: SecurityConfig) {
        this.config = config;
    }

    /**
     * Configures CORS for the Express application.
     * @param app Express application instance
     */
    public configureCORS(app: Express): void {
        const corsOptions = {
            origin: this.config.allowedOrigins || '*',
            methods: this.config.allowedMethods || ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
            allowedHeaders: this.config.allowedHeaders || ['Content-Type', 'Authorization'],
            exposedHeaders: this.config.exposedHeaders || [],
            credentials: this.config.allowCredentials || false,
            maxAge: this.config.maxAge || 86400,
            preflightContinue: false,
            optionsSuccessStatus: 204
        };

        app.use(cors(corsOptions));
    }

    /**
     * Updates CORS configuration.
     * @param newConfig Updated security configuration
     */
    public updateConfig(newConfig: Partial<SecurityConfig>): void {
        this.config = { ...this.config, ...newConfig };
    }

    /**
     * Validates origin against allowed origins.
     * @param origin Origin to validate
     * @returns Whether the origin is allowed
     */
    public isOriginAllowed(origin: string): boolean {
        if (!this.config.allowedOrigins || this.config.allowedOrigins === '*') {
            return true;
        }

        const allowedOrigins = Array.isArray(this.config.allowedOrigins)
            ? this.config.allowedOrigins
            : [this.config.allowedOrigins];

        return allowedOrigins.some(allowedOrigin => {
            if (allowedOrigin instanceof RegExp) {
                return allowedOrigin.test(origin);
            }
            return allowedOrigin === origin;
        });
    }

    /**
     * Gets current CORS configuration.
     * @returns Current CORS configuration
     */
    public getConfig(): SecurityConfig {
        return { ...this.config };
    }
} 