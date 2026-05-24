import jwt from "jsonwebtoken";
export const authenticateToken = (req, res, next) => {
    try {
        let token = undefined;
        if (req.cookies && req.cookies.auth_token) {
            token = req.cookies.auth_token;
        }
        else if (req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
            token = req.headers.authorization.split(" ")[1];
        }
        if (!token) {
            return res.status(401).json({
                status: "error",
                message: "Access denied. Authentication token missing. Please log in.",
            });
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET || "smash_arena_fallback_secret_key");
        req.user = {
            userId: decoded.userId,
            email: decoded.email,
        };
        return next();
    }
    catch (error) {
        console.error("JWT Verification Middleware Error:", error);
        // Catch explicit JWT expiration signatures to give frontends a distinct hint
        if (error instanceof jwt.TokenExpiredError) {
            return res.status(401).json({
                status: "error",
                message: "Your session has expired. Please log in again.",
            });
        }
        return res.status(401).json({
            status: "error",
            message: "Invalid session token. Access revoked.",
        });
    }
};
