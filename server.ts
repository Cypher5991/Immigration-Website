import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const app = express();
const PORT = 3000;
const HOST = '0.0.0.0';

// Security & Parsing Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Custom Security Headers
app.use((req: Request, res: Response, next: NextFunction) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('X-Environment-Stage', process.env.NODE_ENV || 'staging');
  next();
});

// Lazy-initialized Gemini AI client
let aiClient: GoogleGenAI | null = null;
function getAIClient(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return aiClient;
}

// API Routes
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    mode: 'maintenance',
    environment: process.env.NODE_ENV || 'staging',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

app.get('/api/staging/info', (req: Request, res: Response) => {
  res.json({
    appName: 'Global Dreams Immigration & Visa Consultants',
    version: '1.0.0-maintenance',
    appUrl: process.env.APP_URL || 'http://localhost:3000',
    maintenanceMode: true,
    features: {
      aiAssessmentEnabled: Boolean(process.env.GEMINI_API_KEY),
      contactFormActive: true,
      secureHeadersActive: true,
      internalNavigationDisabled: true,
    },
  });
});

// Contact & Inquiry Submission Route
app.post('/api/contact', async (req: Request, res: Response) => {
  try {
    const { name, email, phone, country, visaType, message } = req.body;

    if (!name || (!email && !phone)) {
      res.status(400).json({
        success: false,
        error: 'Please provide your name and at least an email address or phone number.',
      });
      return;
    }

    console.log(`[GLOBAL DREAMS INQUIRY] Received consultation request from ${name} (${email || phone}) for ${visaType || 'General'} Visa to ${country || 'Any'}`);

    let aiAdvice: string | null = null;

    const ai = getAIClient();
    if (ai) {
      try {
        const prompt = `You are a senior visa & immigration specialist for Global Dreams Immigration Consultants. 
Provide a concise, highly professional 2-sentence guidance note for an inquiry regarding a ${visaType || 'General'} visa to ${country || 'Canada/UK/Australia'}.
User inquiry: "${message || 'Interested in visa application and eligibility evaluation.'}"`;

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
        });

        aiAdvice = response.text || null;
      } catch (err) {
        console.warn('[Gemini AI Guidance] Skipped AI response generation:', err);
      }
    }

    res.json({
      success: true,
      message: 'Your inquiry has been received. A Global Dreams counselor will contact you within 24 hours.',
      inquiryId: `GD-${Date.now().toString(36).toUpperCase()}`,
      aiAssessment: aiAdvice,
    });
  } catch (error) {
    console.error('Error handling contact submission:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Serve Static Assets & Maintenance Mode Handler
const rootDir = process.cwd();

// Maintenance Mode Routing Middleware:
// Direct all HTML / Navigation requests to Global Dreams Coming Soon (index.html)
// Allow static assets (css, js, images, font files, etc.) and /api/* routes through.
app.use((req: Request, res: Response, next: NextFunction) => {
  if (req.method !== 'GET') return next();

  const reqPath = req.path;

  // 1. Skip API routes
  if (reqPath.startsWith('/api/')) return next();

  // 2. Allow static asset files (.css, .js, .png, .jpg, .jpeg, .svg, .ico, .woff, .woff2, .ttf)
  const isStaticAsset = /\.(css|js|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot|ps1)$/i.test(reqPath);
  if (isStaticAsset) {
    const exactFilePath = path.join(rootDir, reqPath);
    if (fs.existsSync(exactFilePath) && fs.statSync(exactFilePath).isFile()) {
      return res.sendFile(exactFilePath);
    }
  }

  // 3. For all internal page requests (/about, /services, /countries, /visas, /contact, etc.),
  // internal navigation is disabled. Serve the Global Dreams coming soon page!
  const indexPath = path.join(rootDir, 'index.html');
  if (fs.existsSync(indexPath)) {
    return res.sendFile(indexPath);
  }

  next();
});

// Serve static assets directory
app.use(express.static(rootDir));

// SPA Fallback to index.html (Global Dreams Coming Soon page)
app.get('*', (req: Request, res: Response) => {
  const indexPath = path.join(rootDir, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send('Global Dreams Website - Maintenance Mode');
  }
});

// Start Server
if (!process.env.VERCEL) {
  app.listen(PORT, HOST, () => {
    console.log(`[STAGING SERVER] Immigration Website server running at http://${HOST}:${PORT}`);
  });
}

export default app;

