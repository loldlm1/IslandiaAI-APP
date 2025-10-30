import { NextRequest, NextResponse } from "next/server";

const DISALLOWED_HEADERS = new Set([
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
  "content-length",
  "accept-encoding",
  "host",
]);

function forwardHeaders(request: NextRequest): Headers {
  const headers = new Headers();

  request.headers.forEach((value, key) => {
    const normalizedKey = key.toLowerCase();
    if (DISALLOWED_HEADERS.has(normalizedKey)) {
      return;
    }

    headers.set(key, value);
  });

  if (!headers.has("content-type")) {
    headers.set("content-type", "application/json");
  }

  return headers;
}

function splitSetCookieHeader(header: string): string[] {
  const cookies: string[] = [];
  let current = "";

  for (let index = 0; index < header.length; index += 1) {
    const character = header[index];

    if (character === ",") {
      const remainder = header.slice(index + 1);
      if (/^\s*[!#$%&'*+\-.^_`|~0-9A-Za-z]+=/.test(remainder)) {
        if (current.trim()) {
          cookies.push(current.trim());
        }
        current = "";
        continue;
      }
    }

    current += character;
  }

  if (current.trim()) {
    cookies.push(current.trim());
  }

  return cookies;
}

function extractSetCookies(response: Response): string[] {
  const headerStore = response.headers as unknown as {
    getSetCookie?: () => string[];
    raw?: () => Record<string, string[]>;
  };

  if (typeof headerStore.getSetCookie === "function") {
    return headerStore.getSetCookie();
  }

  const rawHeaders = headerStore.raw?.();
  if (rawHeaders) {
    const setCookie = rawHeaders["set-cookie"] ?? rawHeaders["Set-Cookie"];
    if (Array.isArray(setCookie)) {
      return setCookie;
    }
  }

  const header = response.headers.get("set-cookie");
  if (!header) {
    return [];
  }

  const parsed = splitSetCookieHeader(header);
  return parsed.length > 0 ? parsed : [header];
}

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest): Promise<Response> {
  const upstreamUrl = process.env.GRAPHQL_SERVER_URL;

  if (!upstreamUrl) {
    return NextResponse.json(
      { error: "GraphQL server URL is not configured" },
      { status: 500 },
    );
  }

  const body = await request.text();
  const headers = forwardHeaders(request);

  let upstreamResponse: Response;
  try {
    upstreamResponse = await fetch(upstreamUrl, {
      method: "POST",
      headers,
      body,
      redirect: "manual",
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to reach GraphQL server" },
      { status: 502 },
    );
  }

  const responseHeaders = new Headers();
  upstreamResponse.headers.forEach((value, key) => {
    const normalizedKey = key.toLowerCase();
    if (normalizedKey === "set-cookie" || normalizedKey === "content-length") {
      return;
    }

    responseHeaders.set(key, value);
  });

  const setCookies = extractSetCookies(upstreamResponse);
  const responseBody = await upstreamResponse.arrayBuffer();
  const nextResponse = new NextResponse(responseBody, {
    status: upstreamResponse.status,
    headers: responseHeaders,
  });

  for (const cookie of setCookies) {
    nextResponse.headers.append("set-cookie", cookie);
  }

  return nextResponse;
}
