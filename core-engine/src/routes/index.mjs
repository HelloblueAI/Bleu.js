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
//  Copyright (c) 2025, Helloblue Inc.
//  Open-Source Community Edition

import { setupBroadcastRoute } from './broadcast.mjs';
import { setupGenerateEggRoute } from './generate-egg.mjs';
import { setupHealthRoute } from './healthcheck.mjs';

// Export route setup functions
export { setupBroadcastRoute, setupGenerateEggRoute, setupHealthRoute };

// Enhanced lazy loading with better error handling and types
export const lazyLoadRoute = async (routeName) => {
  try {
    const routes = {
      broadcast: () =>
        import('./broadcast.mjs').then((m) => m.setupBroadcastRoute),

      generateEgg: () =>
        import('./generate-egg.mjs').then((m) => m.setupGenerateEggRoute),

      health: () => import('./healthcheck.mjs').then((m) => m.setupHealthRoute),
    };

    const loadRoute = routes[routeName];
    if (!loadRoute) {
      throw new Error(
        `Route '${routeName}' not found. Available routes: ${Object.keys(routes).join(', ')}`,
      );
    }

    return await loadRoute();
  } catch (error) {
    console.error(`Failed to load route '${routeName}':`, {
      error: error.message,
      stack: error.stack,
      routeName,
      timestamp: new Date().toISOString(),
    });

    throw new Error(`Route loading failed: ${error.message}`);
  }
};

// Helper function to setup all routes at once
export const setupAllRoutes = async (app) => {
  try {
    setupBroadcastRoute(app);
    setupGenerateEggRoute(app);
    setupHealthRoute(app);

    console.info('✅ All routes initialized successfully', {
      timestamp: new Date().toISOString(),
      routes: ['broadcast', 'generateEgg', 'health'],
    });
  } catch (error) {
    console.error('❌ Failed to initialize routes:', {
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
    });
    throw error;
  }
};

// Route configuration for documentation/type checking
export const routeConfig = {
  broadcast: {
    path: '/api/broadcast',
    methods: ['POST'],
    requiresAuth: true,
  },
  generateEgg: {
    path: '/api/generate-egg',
    methods: ['POST'],
    requiresAuth: true,
  },
  health: {
    path: '/api/health',
    methods: ['GET'],
    requiresAuth: false,
  },
};
