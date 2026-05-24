import { NextResponse } from "next/server";
import { UpdateEvent } from "../../../../src/server/usecases/UpdateEvent";
import { requireAuth } from "../../../../src/server/lib/route-guards";
import { z } from "zod";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await requireAuth(request);
    const { id } = await params;
    const body = await request.json();
    const parsed = z
      .object({
        name: z.string().optional(),
        date: z.string().optional(),
        location: z.string().optional(),
        grupoId: z.string().optional().nullable(),
      })
      .safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid body", details: parsed.error },
        { status: 400 }
      );
    }

    const usecase = new UpdateEvent();
    const result = await usecase.execute({
      id,
      ...parsed.data,
    });
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 401 }
    );
  }
}
