import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/db/schema.js",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url:
      process.env.DATABASE_URL ||
      "postgresql://neondb_owner:npg_KhIcY2g3VWbe@ep-raspy-art-a14bbhex-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require",
  },
});
