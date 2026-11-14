import jwt from "jsonwebtoken";

export function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      error: { code: "AUTHENTICATION_REQUIRED", message: "No token provided" },
    });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET!, { algorithms: ["HS256"] }) as { userId: number; role: string };
    if (!Number.isSafeInteger(decoded.userId) || decoded.userId < 1) throw new Error("Invalid user");
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      error: { code: "AUTHENTICATION_REQUIRED", message: "Invalid or expired token" },
    });
  }
}
