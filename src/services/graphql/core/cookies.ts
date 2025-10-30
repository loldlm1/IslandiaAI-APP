export function splitSetCookieHeader(header: string): string[] {
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

export function extractSetCookies(response: Response): string[] {
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
