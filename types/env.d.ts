declare namespace NodeJS {
  interface ProcessEnv {
    NEXT_PUBLIC_API_URL: string;
    DATABASE_URL: string;
    // Add other environment variables here
  }
}
