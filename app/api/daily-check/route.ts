import { NextResponse } from "next/server";
import { GetOrCreateDailyCheck } from "../../../src/server/usecases/GetOrCreateDailyCheck";
import { UpdateDailyChecks } from "../../../src/server/usecases/UpdateDailyChecks";
import { requireAuth } from "../../../src/server/lib/route-guards";
import { z } from "zod";

export async function POST(request: Request) {
  try {
    const userId = await requireAuth(request);
    const usecase = new GetOrCreateDailyCheck();
    const result = await usecase.execute({ userId });
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 401 },
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const userId = await requireAuth(request);
    const body = await request.json();
    const parsed = z
      .object({
        read_bible: z.boolean().optional(),
        read_lesson: z.boolean().optional(),
      })
      .refine(
        (data) =>
          data.read_bible !== undefined || data.read_lesson !== undefined,
        {
          message: "At least one of read_bible or read_lesson must be provided",
        },
      )
      .safeParse(body);
    if (!parsed.success)
      return NextResponse.json(
        { error: "Invalid body", details: parsed.error },
        { status: 400 },
      );

    const usecase = new UpdateDailyChecks();
    const result = await usecase.execute({ userId, ...parsed.data });
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 401 },
    );
  }
}
