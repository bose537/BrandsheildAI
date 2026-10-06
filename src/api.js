export async function api(path, options = {}) {
  let response;
  try {
    response = await fetch("/api" + path, {
      ...options,
      headers: { "Content-Type": "application/json", ...options.headers },
      body:
        options.body === undefined ? undefined : JSON.stringify(options.body),
    });
  } catch {
    throw new Error("Local server unavailable. Start the backend, then retry.");
  }
  const data = await response.json().catch(() => ({}));
  if (!response.ok)
    throw new Error(data.error || "The request failed. Please retry.");
  return data;
}
