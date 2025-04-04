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

import { Router } from 'express';
import { transports, createLogger } from 'winston';
import { env } from './config/env.js';

const logger = createLogger({
  transports: [new transports.Console()],
});

const router = Router();

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Google OAuth routes
router.get('/auth/google', (req, res) => {
  const clientId = '400378871552-fhsndhlrqt9l3k5m3lailtlh6jjg8ocs.apps.googleusercontent.com';
  const redirectUri = 'http://localhost:3002/api/auth/google/callback';

  console.log('Google OAuth configuration:', {
    clientId,
    redirectUri,
    processEnv: {
      GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
      GOOGLE_REDIRECT_URI: process.env.GOOGLE_REDIRECT_URI
    }
  });

  const googleAuthUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  googleAuthUrl.searchParams.append('client_id', clientId);
  googleAuthUrl.searchParams.append('redirect_uri', redirectUri);
  googleAuthUrl.searchParams.append('response_type', 'code');
  googleAuthUrl.searchParams.append('scope', 'email profile');

  res.redirect(googleAuthUrl.toString());
});

router.get('/auth/google/callback', async (req, res) => {
  try {
    console.log('Received Google callback:', req.query);
    const { code } = req.query;
    // TODO: Exchange code for tokens and handle user authentication
    res.json({ success: true, code });
  } catch (error) {
    console.error('Google OAuth error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
});

router.get('/auth/github', (req, res) => {
  const clientId = process.env.GITHUB_CLIENT_ID;
  const redirectUri = process.env.GITHUB_REDIRECT_URI;
  const scope = 'user:email';
  
  const authUrl = `https://github.com/login/oauth/authorize?` +
    `client_id=${clientId}&` +
    `redirect_uri=${redirectUri}&` +
    `scope=${scope}`;
  
  res.redirect(authUrl);
});

router.get('/auth/github/callback', async (req, res) => {
  try {
    const { code } = req.query;
    // TODO: Exchange code for tokens and handle user authentication
    res.json({ success: true, code });
  } catch (error) {
    console.error('GitHub OAuth error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
});

// Existing route
router.post('/api/route', async (req, res) => {
  try {
    logger.info('Processing request');
    return res.json({ success: true });
  } catch (error) {
    let errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Error processing request:', errorMessage);
    return res.status(500).json({
      success: false,
      error: errorMessage,
    });
  }
});

export default router;
