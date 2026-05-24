import { NextResponse } from "next/server";
import { GetRanking } from "../../../src/server/usecases/GetRanking";

export async function GET(request: Request) {
  try {
    const usecase = new GetRanking();
    const result = await usecase.execute();
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 },
    );
  }
}
