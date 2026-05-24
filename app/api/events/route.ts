import { NextResponse } from "next/server";
import { z } from "zod";
import { CreateEvent } from "../../../src/server/usecases/CreateEvent";
import { GetEvents } from "../../../src/server/usecases/GetEvents";

const BodySchema = z.object({
  name: z.string(),
  date: z.string(),
  location: z.string(),
  grupoId: z.string().optional(),
});

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: "Invalid body", details: parsed.error }, { status: 400 });

  const usecase = new CreateEvent();
  try {
    const result = await usecase.execute(parsed.data);
    return NextResponse.json(result, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
}

export async function GET() {
  const usecase = new GetEvents();
  try {
    const result = await usecase.execute();
    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
