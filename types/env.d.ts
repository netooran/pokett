declare namespace NodeJS {
  interface ProcessEnv {
    NEXT_PUBLIC_API_URL: string;
    DATABASE_URL: string;
    MONGODB_URI: string;
    DB_NAME: string;
    // Add other environment variables here
  }
}
