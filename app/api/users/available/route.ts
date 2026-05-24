import { NextResponse } from "next/server";
import { GetAvailableUsers } from "../../../../src/server/usecases/GetAvailableUsers";

export async function GET(request: Request) {
  try {
    const usecase = new GetAvailableUsers();
    const result = await usecase.execute();
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 },
    );
  }
}
