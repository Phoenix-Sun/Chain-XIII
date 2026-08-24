interface D1Statement {
  all<T = unknown>(): Promise<{ results: T[]; success: boolean }>;
}

interface D1Database {
  prepare(query: string): D1Statement;
}

interface Env {
  ASSETS: {
    fetch(request: Request): Promise<Response>;
  };
  DB: D1Database;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/api/health") {
      const tableCheck = await env.DB
        .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'save_slots'")
        .all<{ name: string }>();

      return Response.json({
        ok: true,
        service: "chain-xiii",
        runtime: "cloudflare-workers",
        d1: {
          connected: tableCheck.success,
          saveSlotsTable: tableCheck.results.some((table) => table.name === "save_slots"),
        },
        timestamp: new Date().toISOString(),
      });
    }

    return env.ASSETS.fetch(request);
  },
};
