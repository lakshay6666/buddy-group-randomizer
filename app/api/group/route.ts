import { env } from "cloudflare:workers";

type StudentRow = { name: string; created_at: string };

function getBuddyCodes() {
  const value = (env as unknown as { BUDDY_CODES?: string }).BUDDY_CODES ?? "";
  return value.split(",").map((code) => code.trim().toUpperCase());
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { groupNo?: unknown; code?: unknown };
    const groupNo = Number(body.groupNo);
    const code = typeof body.code === "string" ? body.code.trim().toUpperCase() : "";
    const codes = getBuddyCodes();

    if (!Number.isInteger(groupNo) || groupNo < 1 || groupNo > 7) {
      return Response.json({ error: "Choose a valid group." }, { status: 400 });
    }
    if (!codes[groupNo - 1] || code !== codes[groupNo - 1]) {
      return Response.json({ error: "That access code does not match this group." }, { status: 403 });
    }

    const result = await env.DB.prepare(
      "SELECT name, created_at FROM assignments WHERE group_no = ? ORDER BY created_at ASC, id ASC"
    ).bind(groupNo).all<StudentRow>();

    return Response.json(
      { groupNo, groupName: `Group ${groupNo}`, students: result.results.map((row) => ({ name: row.name })) },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("buddy roster failed", error);
    return Response.json({ error: "The group list is temporarily unavailable." }, { status: 503 });
  }
}
