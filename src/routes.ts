/**
 * Routes that are accessible to the public
 * These routes do not require authentication
 */
export const publicRoutes = [
  "/terms_conditions",
  "/privacy_policy",
  "/",
  "/cart",
  "/cart/afterPlacingOrder",
  "/payOrder",
  "/category",
  "/category/products",
  "/category/products/:id",
  "/payOrder?code=*",
  "/verify-mail?token=*",
  "/admin/register",
  "/payOrder/status",
];

/**
 * An Array of Routes that are not accessible to the public
 * These routes require authentication
 */

export const protectedApiRoutes = ["/api/orders", "/profile", "/orders"];

export const authRoutes = [];

export const apiAuthPrefix = "/api/auth";

export const DEFAULT_LOGIN_REDIRECT = "/";
