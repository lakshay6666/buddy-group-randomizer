import { env } from "cloudflare:workers";

type AssignmentRow = { name: string; group_no: number };

function publicAssignment(row: AssignmentRow) {
  return { name: row.name, groupNo: row.group_no, groupName: `Group ${row.group_no}` };
}

function cleanName(value: unknown) {
  return typeof value === "string" ? value.trim().replace(/\s+/g, " ").slice(0, 80) : "";
}

function cleanToken(value: unknown) {
  return typeof value === "string" && /^[a-zA-Z0-9-]{20,80}$/.test(value) ? value : "";
}

export async function GET(request: Request) {
  const token = cleanToken(new URL(request.url).searchParams.get("token"));
  if (!token) return Response.json({ error: "A valid check-in token is required." }, { status: 400 });
  try {
    const row = await env.DB.prepare("SELECT name, group_no FROM assignments WHERE token = ? LIMIT 1").bind(token).first<AssignmentRow>();
    return row ? Response.json({ assignment: publicAssignment(row) }) : Response.json({ assignment: null }, { status: 404 });
  } catch (error) {
    console.error("assignment lookup failed", error);
    return Response.json({ error: "Group assignments are temporarily unavailable." }, { status: 503 });
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { name?: unknown; token?: unknown };
    const name = cleanName(body.name);
    const token = cleanToken(body.token);
    if (name.length < 2) return Response.json({ error: "Please enter your name." }, { status: 400 });
    if (!token) return Response.json({ error: "Your browser could not create a check-in token. Please try again." }, { status: 400 });

    const inserted = await env.DB.prepare(`
      WITH options(group_no) AS (VALUES (1), (2), (3), (4), (5), (6), (7)),
      chosen(group_no) AS (
        SELECT options.group_no
        FROM options
        LEFT JOIN (
          SELECT group_no, COUNT(*) AS member_count FROM assignments GROUP BY group_no
        ) AS totals ON totals.group_no = options.group_no
        ORDER BY COALESCE(totals.member_count, 0) ASC, random()
        LIMIT 1
      )
      INSERT INTO assignments (token, name, group_no)
      SELECT ?1, ?2, chosen.group_no FROM chosen
      WHERE NOT EXISTS (SELECT 1 FROM assignments WHERE token = ?1)
      RETURNING name, group_no
    `).bind(token, name).first<AssignmentRow>();

    const row = inserted ?? await env.DB.prepare("SELECT name, group_no FROM assignments WHERE token = ? LIMIT 1").bind(token).first<AssignmentRow>();
    if (!row) throw new Error("Assignment was not saved");
    return Response.json({ assignment: publicAssignment(row) }, { status: inserted ? 201 : 200 });
  } catch (error) {
    console.error("assignment creation failed", error);
    return Response.json({ error: "We could not save your group. Please try again." }, { status: 503 });
  }
}
