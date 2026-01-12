import { defineConfig } from "supabase-functions";

export default defineConfig([
  {
    functions: [{ glob: "*/index.ts" }],
    env: {
      path: "../.env.local",
    },
  },
]);
