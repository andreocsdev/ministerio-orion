import { NextResponse } from "next/server";
import { z } from "zod";
import { GetGroups } from "../../../src/server/usecases/GetGroups";
import { CreateGroup } from "../../../src/server/usecases/CreateGroup";

export async function GET() {
  const usecase = new GetGroups();
  try {
    const result = await usecase.execute();
    return NextResponse.json(result);
  } catch (err) {
    const e = err as Error;
    return NextResponse.json({ error: e.message, stack: e.stack }, { status: 500 });
  }
}

const CreateSchema = z.object({ name: z.string() });

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
  const usecase = new CreateGroup();
  try {
    const result = await usecase.execute(parsed.data);
    return NextResponse.json(result, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
}
