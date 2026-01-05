/**
 * Environment variables for web app
 * These are validated at runtime (server-side) and build time
 */

export const env = {
  // NextAuth
  NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'http://localhost:3000',
  NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET || 'default-secret-change-in-production',

  // API
  API_BASE_URL: process.env.API_BASE_URL || 'http://localhost:3001',
  NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001',

  // App
  NODE_ENV: process.env.NODE_ENV || 'development',
  APP_URL: process.env.APP_URL || 'http://localhost:3000',
};
