import { redirect } from "next/navigation";
import DOMPurify from "isomorphic-dompurify";

// Allowed redirect paths to prevent open redirect vulnerabilities
const ALLOWED_REDIRECT_PATHS = [
  "/",
  "/dashboard",
  "/sign-in",
  "/sign-up",
  "/forgot-password",
  "/library",
  "/pricing",
  "/profile",
];

/**
 * Sanitizes HTML content to prevent XSS attacks
 */
export function sanitizeHtml(content: string): string {
  if (typeof window !== "undefined") {
    return DOMPurify.sanitize(content);
  }
  // Server-side fallback - basic HTML entity encoding
  return content
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

/**
 * Validates and sanitizes redirect paths to prevent open redirect attacks
 */
function validateRedirectPath(path: string): string {
  // Remove any protocol or domain to prevent external redirects
  const cleanPath = path.replace(/^https?:\/\/[^/]+/, "");

  // Check if the path is in our allowed list or starts with allowed paths
  const isAllowed = ALLOWED_REDIRECT_PATHS.some(
    (allowedPath) =>
      cleanPath === allowedPath || cleanPath.startsWith(allowedPath + "/"),
  );

  if (!isAllowed) {
    console.warn(`Attempted redirect to unauthorized path: ${path}`);
    return "/dashboard"; // Default safe redirect
  }

  return cleanPath;
}

/**
 * Redirects to a specified path with an encoded message as a query parameter.
 * @param {('error' | 'success')} type - The type of message, either 'error' or 'success'.
 * @param {string} path - The path to redirect to.
 * @param {string} message - The message to be encoded and added as a query parameter.
 * @returns {never} This function doesn't return as it triggers a redirect.
 */
export function encodedRedirect(
  type: "error" | "success",
  path: string,
  message: string,
) {
  const safePath = validateRedirectPath(path);
  const sanitizedMessage = sanitizeHtml(message);
  return redirect(
    `${safePath}?${type}=${encodeURIComponent(sanitizedMessage)}`,
  );
}
