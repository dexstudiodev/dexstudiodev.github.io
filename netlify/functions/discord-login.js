exports.handler = async function () {
  const clientId = process.env.DISCORD_CLIENT_ID;
  const siteUrl = process.env.URL || process.env.DEPLOY_PRIME_URL;

  if (!clientId || !siteUrl) {
    return {
      statusCode: 500,
      body: "Missing DISCORD_CLIENT_ID or Netlify URL"
    };
  }

  const redirectUri = `${siteUrl}/.netlify/functions/discord-callback`;

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "identify guilds",
    prompt: "consent"
  });

  return {
    statusCode: 302,
    headers: {
      Location: `https://discord.com/oauth2/authorize?${params.toString()}`
    }
  };
};
