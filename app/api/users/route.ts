import { NextResponse } from "next/server";
import { GetRanking } from "../../../src/server/usecases/GetRanking";
import { GetAvailableUsers } from "../../../src/server/usecases/GetAvailableUsers";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const pathname = url.pathname;

  if (pathname.endsWith('/users/available') || pathname.endsWith('/users/available/')) {
    const usecase = new GetAvailableUsers();
    const result = await usecase.execute();
    return NextResponse.json(result);
  }

  if (pathname.endsWith('/users/ranking') || pathname.endsWith('/ranking')) {
    const usecase = new GetRanking();
    const result = await usecase.execute();
    return NextResponse.json(result);
  }

  return NextResponse.json({ error: 'Not found' }, { status: 404 });
}
