const jwt = require("jsonwebtoken");
const JWT_SECRET = "securedWith$AnviHub$";
const fetchUser = (req, res, next) => {
  // Extracting user_id from jwt token and give it to request body
  const auth_token = req.header("auth_token");
  if (!auth_token) {
    return res
      .status(401)
      .send({ error: "Please request with authentication." });
  }
  try {
    req.user = jwt.verify(auth_token, JWT_SECRET);
    next();
  } catch (error) {
    return res
      .status(401)
      .send({ error: "Please request with authentication." });
  }
};

module.exports = fetchUser;