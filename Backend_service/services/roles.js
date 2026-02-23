const Roles = {
  ADMIN: "ADMIN",
  DRIVER: "DRIVER",
  BUSINESS: "BUSINESS"
}

// checking if all the roles (arg) is included in the groupes inside AWS cognito according to right pool and client ID's.
function requireAnyRole(...roles) {
  return (req, res, next) => {
    const groups = req.user?.groups || [];
    const ok = roles.some((r) => groups.includes(r));
    if (!ok) {
      return res.status(403).json({
        error: "Forbidden",
        requiredRoles: roles,
      });
    }
    next();
  };
}

module.exports = { 
  requireAnyRole,
  Roles
   };