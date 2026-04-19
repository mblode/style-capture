import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const linkHeaderValue = [
  '</.well-known/api-catalog>; rel="api-catalog"; type="application/linkset+json"',
  '</.well-known/agent-skills>; rel="service-desc"; type="application/json"',
  '</skills>; rel="service-doc"; type="text/html"',
  '</support>; rel="help"; type="text/html"',
  '<https://github.com/mblode/style-capture>; rel="describedby"; type="text/html"',
].join(", ");

const markdownPaths = new Set<string>([
  "/",
  "/skills",
  "/support",
  "/privacy",
  "/terms",
]);

const wantsMarkdown = (accept: string | null): boolean => {
  if (!accept) {
    return false;
  }
  const entries = accept.split(",").map((part) => part.trim().toLowerCase());
  for (const entry of entries) {
    const [mime] = entry.split(";").map((part) => part.trim());
    if (mime === "text/markdown" || mime === "text/x-markdown") {
      return true;
    }
  }
  return false;
};

export const middleware = (request: NextRequest): NextResponse => {
  const { pathname } = request.nextUrl;

  if (
    markdownPaths.has(pathname) &&
    wantsMarkdown(request.headers.get("accept"))
  ) {
    const rewrittenUrl = request.nextUrl.clone();
    const suffix = pathname === "/" ? "/home" : pathname;
    rewrittenUrl.pathname = `/md${suffix}`;
    const response = NextResponse.rewrite(rewrittenUrl);
    response.headers.set("Link", linkHeaderValue);
    response.headers.append("Vary", "Accept");
    return response;
  }

  const response = NextResponse.next();
  response.headers.append("Link", linkHeaderValue);
  response.headers.append("Vary", "Accept");
  return response;
};

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
