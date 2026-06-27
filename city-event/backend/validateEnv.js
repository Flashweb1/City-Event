import dotenv from 'dotenv';
import fs from 'fs';

export default function validateEnvironment() {
  if (fs.existsSync('.env')) {
    dotenv.config();
  }

  const NODE_ENV = process.env.NODE_ENV || 'development';

  const requiredVars = [];
  // Stripe is mandatory in production — fall back to a placeholder in dev only.
  if (NODE_ENV === 'production') {
    requiredVars.push('STRIPE_SECRET_KEY');
  }
  const recommendedVars = [
    'JWT_SECRET',
    'STRIPE_SECRET_KEY',
    'PAYSTACK_SECRET_KEY',
    'STRIPE_WEBHOOK_SECRET',
    'FRONTEND_URL',
    'FIREBASE_PROJECT_ID',
    'SMTP_HOST',
    'SMTP_PORT',
    'SMTP_USER',
    'SMTP_PASS',
    'SMTP_FROM',
  ];

  const missingRequired = requiredVars.filter(envVar => !process.env[envVar]);

  if (missingRequired.length > 0) {
    console.error('❌ FATAL ERROR: Missing required environment variables:');
    missingRequired.forEach(envVar => console.error(`   - ${envVar}`));
    console.error('\nPlease check your .env file or copy from .env.example.');
    process.exit(1);
  }

  const missingRecommended = recommendedVars.filter(envVar => !process.env[envVar]);
  if (missingRecommended.length > 0) {
    console.warn('⚠️  Warning: Missing recommended environment variables:');
    missingRecommended.forEach(envVar => console.warn(`   - ${envVar}`));
    console.warn('Some features may not work without these.');
  }

  console.log('✅ Environment variables validated successfully.');
}

