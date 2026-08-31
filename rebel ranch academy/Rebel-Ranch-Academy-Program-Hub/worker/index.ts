/** Cloudflare Worker entry point for the vinext-starter template. */
import { handleImageOptimization, DEFAULT_DEVICE_SIZES, DEFAULT_IMAGE_SIZES } from "vinext/server/image-optimization";
import handler from "vinext/server/app-router-entry";

interface Env {
  ASSETS: Fetcher;
  DB: D1Database;
  IMAGES: {
    input(stream: ReadableStream): {
      transform(options: Record<string, unknown>): {
        output(options: { format: string; quality: number }): Promise<{ response(): Response }>;
      };
    };
  };
  // Set via `wrangler secret put WEALTH_MANAGEMENT_PREVIEW_PASSWORD` (or the
  // Cloudflare dashboard's Worker secrets UI) — never hardcode this value in
  // source. Requests to /wealth-management* are refused entirely until this
  // is set and the visitor supplies it.
  WEALTH_MANAGEMENT_PREVIEW_PASSWORD?: string;
}

const WEALTH_MANAGEMENT_PATH = "/wealth-management";
const PREVIEW_REALM = 'Basic realm="Rebel Ranch Academy — Wealth Management preview", charset="UTF-8"';

function unauthorized(): Response {
  return new Response("Authentication required.", {
    status: 401,
    headers: { "WWW-Authenticate": PREVIEW_REALM },
  });
}

// HTTP Basic Auth check, enforced at the Worker — before Next.js routing,
// before any React rendering, before a single byte of the page's HTML is
// produced. Fails closed: if the secret was never configured, nobody gets
// in, including the owner, until it's set.
function hasValidPreviewPassword(request: Request, expectedPassword: string | undefined): boolean {
  if (!expectedPassword) return false;
  const header = request.headers.get("Authorization");
  if (!header || !header.startsWith("Basic ")) return false;
  let decoded: string;
  try {
    decoded = atob(header.slice("Basic ".length));
  } catch {
    return false;
  }
  const separatorIndex = decoded.indexOf(":");
  if (separatorIndex === -1) return false;
  const suppliedPassword = decoded.slice(separatorIndex + 1);
  return suppliedPassword === expectedPassword;
}

interface ExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException(): void;
}

// Image security config. SVG sources with .svg extension auto-skip the
// optimization endpoint on the client side (served directly, no proxy).
// To route SVGs through the optimizer (with security headers), set
// dangerouslyAllowSVG: true in next.config.js and uncomment below:
// const imageConfig: ImageConfig = { dangerouslyAllowSVG: true };

const worker = {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === WEALTH_MANAGEMENT_PATH || url.pathname.startsWith(WEALTH_MANAGEMENT_PATH + "/")) {
      if (!hasValidPreviewPassword(request, env.WEALTH_MANAGEMENT_PREVIEW_PASSWORD)) {
        return unauthorized();
      }
    }

    if (url.pathname === "/_vinext/image") {
      const allowedWidths = [...DEFAULT_DEVICE_SIZES, ...DEFAULT_IMAGE_SIZES];
      return handleImageOptimization(request, {
        fetchAsset: (path) => env.ASSETS.fetch(new Request(new URL(path, request.url))),
        transformImage: async (body, { width, format, quality }) => {
          const result = await env.IMAGES.input(body).transform(width > 0 ? { width } : {}).output({ format, quality });
          return result.response();
        },
      }, allowedWidths);
    }

    return handler.fetch(request, env, ctx);
  },
};

export default worker;
