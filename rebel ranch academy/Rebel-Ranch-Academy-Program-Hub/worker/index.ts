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

// The Academy moved onto the main site (owner decision 2026-09-28: one website, one login).
// Every Academy address here forwards permanently to its matching main-site page. The
// Wealth Management preview (/wealth-management*) and built assets keep being served here.
// AI-Agent: Claude (claude-opus-5-5) · Session: Academy back office restructure 2026-09-27
const MAIN_SITE = "https://rebelranchministries.org";
function academyForward(url: URL): Response | null {
  const path = url.pathname;
  if (path === WEALTH_MANAGEMENT_PATH || path.startsWith(WEALTH_MANAGEMENT_PATH + "/")) return null;
  if (path.startsWith("/_vinext/") || path.startsWith("/assets/") || /\.[a-z0-9]{2,5}$/i.test(path)) return null;
  const target = path === "/learn" || path.startsWith("/learn/") ? "/academy-library.html" : "/rebel-ranch-academy.html";
  return Response.redirect(MAIN_SITE + target, 301);
}

const worker = {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    const forward = academyForward(url);
    if (forward) return forward;

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
