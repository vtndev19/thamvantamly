import type { Config } from "@react-router/dev/config";

export default {
  // SPA mode: Firebase Auth, localStorage và Realtime Database là client-only
  // SSR gây hydration mismatch với các API này
  ssr: false,
} satisfies Config;

