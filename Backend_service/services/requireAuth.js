const { CognitoJwtVerifier } = require("aws-jwt-verify");

const verifier = CognitoJwtVerifier.create({
  userPoolId: process.env.COGNITO_USER_POOL_ID,
  tokenUse: "access",
  clientId: process.env.COGNITO_CLIENT_ID,
});

// validation bearer token from user
async function requireAuth(req, res, next) {
  try {
    const auth = req.headers.authorization || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
    if (!token) {
      return res.status(401).json({ error: "Missing Bearer token" });
    }
    const payload = await verifier.verify(token);
    req.user = {
      email: payload.email,
      sub: payload.sub,
      username: payload.username,
      groups: payload["cognito:groups"] || [],
      scope: payload.scope,
    };

    console.log(req.user);   // for me - need to be deleted.
    return next();
      } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

module.exports = {requireAuth};


