import { NextResponse } from "next/server";
import { z } from "zod";
import { AddUserToGroup } from "../../../src/server/usecases/AddUserToGroup";

const Schema = z.object({ groupId: z.string(), userIds: z.array(z.string()).min(1) });

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = Schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid body', details: parsed.error }, { status: 400 });

  try {
    const usecase = new AddUserToGroup();
    const result = await usecase.execute(parsed.data);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
}
