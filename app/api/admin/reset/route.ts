import { env } from "cloudflare:workers";

export async function POST(request: Request) {
  const configuredCode = (env as unknown as { ADMIN_RESET_CODE?: string }).ADMIN_RESET_CODE ?? "";
  const suppliedCode = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";

  if (!configuredCode || suppliedCode !== configuredCode) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const result = await env.DB.prepare("DELETE FROM assignments").run();
    return Response.json({ deleted: result.meta.changes ?? 0, total: 0 });
  } catch (error) {
    console.error("assignment reset failed", error);
    return Response.json({ error: "Assignments could not be reset." }, { status: 503 });
  }
}
