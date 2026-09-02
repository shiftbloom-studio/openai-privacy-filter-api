import { checkBotId } from "botid/server";

import { normalizeApiBaseUrl, validateFilterRequest } from "@shiftbloom-studio/privacy-filter";

export const runtime = "nodejs";

export async function POST(request: Request): Promise<Response> {
  const verification = await checkBotId();
  if (verification.isBot) {
    return Response.json({ error: "Access denied." }, { status: 403 });
  }

  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const validationError = validateFilterRequest(payload);
  if (validationError) {
    return Response.json({ error: validationError }, { status: 400 });
  }

  const apiBaseUrl = normalizeApiBaseUrl(
    process.env.PRIVACY_FILTER_API_URL || "http://localhost:8000"
  );
  const internalToken = process.env.PRIVACY_FILTER_INTERNAL_TOKEN;

  try {
    const upstream = await fetch(`${apiBaseUrl}/v1/filter`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(internalToken
          ? { "x-privacy-filter-internal-token": internalToken }
          : {})
      },
      body: JSON.stringify(payload),
      cache: "no-store"
    });

    const body = await upstream.text();

    return new Response(body, {
      status: upstream.status,
      headers: {
        "content-type": upstream.headers.get("content-type") || "application/json"
      }
    });
  } catch {
    return Response.json(
      {
        error: "Privacy filter API is unreachable."
      },
      { status: 502 }
    );
  }
}
