import { NextResponse } from "next/server";
import { GetDailyChecksHistory } from "../../../../src/server/usecases/GetDailyChecksHistory";
import { requireAuth } from "../../../../src/server/lib/route-guards";

export async function GET(request: Request) {
  try {
    const userId = await requireAuth(request);
    const usecase = new GetDailyChecksHistory();
    const result = await usecase.execute({ userId });
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 401 },
    );
  }
}
