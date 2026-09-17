import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function POST(req: Request) {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Only allowed in development" }, { status: 403 });
  }

  try {
    const { id, status } = await req.json();
    if (!id || !status) {
      return NextResponse.json({ error: "Missing id or status" }, { status: 400 });
    }

    const filePath = path.join(process.cwd(), "lib", "roadmap-status.json");
    const fileContents = fs.readFileSync(filePath, "utf8");
    const statuses = JSON.parse(fileContents);

    statuses[id] = status;

    fs.writeFileSync(filePath, JSON.stringify(statuses, null, 2));

    return NextResponse.json({ success: true, statuses });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to update status" }, { status: 500 });
  }
}
