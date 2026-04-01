export function shouldUseLocalDB() {
  if (import.meta.env.VITE_USE_LOCAL_DB === "true") {
    return true;
  }

  if (import.meta.env.DEV) {
    return true;
  }

  return false;
}
