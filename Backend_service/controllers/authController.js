async function callback(req, res) {
  try {
    const code = req.query.code;
    if (!code) return res.status(400).json({ error: "Missing code" });

    const tokenUrl = `${process.env.COGNITO_DOMAIN}/oauth2/token`;

    const body = new URLSearchParams({
      grant_type: "authorization_code",
      client_id: process.env.COGNITO_CLIENT_ID,
      code,
      redirect_uri: process.env.COGNITO_REDIRECT_URI,
    });

    const basic = Buffer.from(
      `${process.env.COGNITO_CLIENT_ID}:${process.env.COGNITO_CLIENT_SECRET}`
    ).toString("base64");

    const response = await fetch(tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${basic}`,
      },
      body: body.toString(),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(400).json({
        error: "Token exchange failed",
        details: data,
      });
    }

    return res.json(data);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "server error" });
  }
}

module.exports = { callback };
