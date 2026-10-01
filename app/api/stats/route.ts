import { env } from "cloudflare:workers";

type GroupRow = { group_no: number; member_count: number };

export async function GET() {
  try {
    const result = await env.DB.prepare(`
      WITH options(group_no) AS (VALUES (1), (2), (3), (4), (5), (6), (7), (8))
      SELECT options.group_no, COUNT(assignments.id) AS member_count
      FROM options
      LEFT JOIN assignments ON assignments.group_no = options.group_no
      GROUP BY options.group_no ORDER BY options.group_no
    `).all<GroupRow>();
    const groups = result.results.map((row) => ({ groupNo: row.group_no, groupName: `Group ${row.group_no}`, count: Number(row.member_count) }));
    return Response.json({ groups, total: groups.reduce((sum, group) => sum + group.count, 0) }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("group stats failed", error);
    return Response.json({ error: "Live totals are temporarily unavailable." }, { status: 503 });
  }
}
