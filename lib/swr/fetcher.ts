export async function fetcher<T = unknown>(url: string): Promise<T> {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    const error = new Error("Request failed");
    (error as Error & { status?: number; info?: unknown }).status = res.status;
    try {
      (error as Error & { info?: unknown }).info = await res.json();
    } catch {
      /* ignore */
    }
    throw error;
  }
  return res.json() as Promise<T>;
}
