import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// One shared .env at the project root
const dir = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(dir, "..", ".env") });

export default {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_REGISTRY_ADDRESS: process.env.NEXT_PUBLIC_REGISTRY_ADDRESS || "",
    NEXT_PUBLIC_CHAIN_ID: process.env.NEXT_PUBLIC_CHAIN_ID || "11155111",
    NEXT_PUBLIC_DEMO_MODE: process.env.NEXT_PUBLIC_DEMO_MODE || "false"
  }
};
