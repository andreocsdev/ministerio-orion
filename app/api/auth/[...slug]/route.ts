import { NextResponse } from "next/server";
import { auth } from "../../../../src/server/lib/auth";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const proxied = new Request(url.toString(), {
    method: request.method,
    headers: request.headers,
  });
  const res = await auth.handler(proxied as unknown as Request);
  const body = await res.text();
  return new Response(body, {
    status: res.status,
    headers: res.headers as unknown as HeadersInit,
  });
}

export async function POST(request: Request) {
  const url = new URL(request.url);
  const proxied = new Request(url.toString(), {
    method: request.method,
    headers: request.headers,
    body: await request.text(),
  });
  const res = await auth.handler(proxied as unknown as Request);
  const body = await res.text();
  return new Response(body, {
    status: res.status,
    headers: res.headers as unknown as HeadersInit,
  });
}
