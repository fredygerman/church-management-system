import { createEnv } from "@t3-oss/env-nextjs"
import { z } from "zod"

export const env = createEnv({
  server: {
    // NextAuth
    NEXTAUTH_SECRET: z.string().min(1),
    
    // JWT
    JWT_SECRET: z.string().min(1),
    
    // API
    API_BASE_URL: z.string().url(),
  },
  
  client: {
    // API
    NEXT_PUBLIC_API_BASE_URL: z.string().url(),
  },
  
  runtimeEnv: {
    // Server-side vars
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    JWT_SECRET: process.env.JWT_SECRET,
    API_BASE_URL: process.env.API_BASE_URL,
    
    // Client-side vars
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
  },
})
