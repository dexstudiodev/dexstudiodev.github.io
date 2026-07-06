const crypto = require("crypto");

function b64(input) {
  return Buffer.from(input).toString("base64url");
}
function sign(value, secret) {
  return crypto.createHmac("sha256", secret).update(value).digest("base64url");
}
function cookie(payload) {
  const secret = process.env.SESSION_SECRET;
  const encoded = b64(JSON.stringify(payload));
  const sig = sign(encoded, secret);
  return `dex_session=${encoded}.${sig}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=604800`;
}

exports.handler = async function (event) {
  const code = event.queryStringParameters && event.queryStringParameters.code;
  const siteUrl = process.env.URL || process.env.DEPLOY_PRIME_URL;
  const clientId = process.env.DISCORD_CLIENT_ID;
  const clientSecret = process.env.DISCORD_CLIENT_SECRET;
  const guildId = process.env.DISCORD_GUILD_ID;

  if (!code || !siteUrl || !clientId || !clientSecret || !guildId || !process.env.SESSION_SECRET) {
    return { statusCode: 302, headers: { Location: "/?auth=error" } };
  }

  try {
    const redirectUri = `${siteUrl}/.netlify/functions/discord-callback`;

    const tokenRes = await fetch("https://discord.com/api/oauth2/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri
      })
    });

    if (!tokenRes.ok) return { statusCode: 302, headers: { Location: "/?auth=error" } };
    const token = await tokenRes.json();

    const user = await (await fetch("https://discord.com/api/users/@me", {
      headers: { Authorization: `Bearer ${token.access_token}` }
    })).json();

    const guilds = await (await fetch("https://discord.com/api/users/@me/guilds", {
      headers: { Authorization: `Bearer ${token.access_token}` }
    })).json();

    const joined = Array.isArray(guilds) && guilds.some(g => g.id === guildId);
    if (!joined) return { statusCode: 302, headers: { Location: "/?auth=not_joined" } };

    return {
      statusCode: 302,
      headers: {
        Location: "/?auth=success",
        "Set-Cookie": cookie({
          id: user.id,
          username: user.global_name || user.username || "Discord User",
          joined: true,
          iat: Date.now()
        })
      }
    };
  } catch (e) {
    console.log(e);
    return { statusCode: 302, headers: { Location: "/?auth=error" } };
  }
};
