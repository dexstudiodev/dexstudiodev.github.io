const crypto = require("crypto");

function sign(value, secret) {
  return crypto.createHmac("sha256", secret).update(value).digest("base64url");
}

function parseCookies(header) {
  const cookies = {};
  if (!header) return cookies;
  header.split(";").forEach(cookie => {
    const [name, ...rest] = cookie.trim().split("=");
    cookies[name] = rest.join("=");
  });
  return cookies;
}

exports.handler = async function (event) {
  const secret = process.env.SESSION_SECRET;
  const cookies = parseCookies(event.headers.cookie || event.headers.Cookie);
  const raw = cookies.dex_session;

  if (!secret || !raw || !raw.includes(".")) {
    return { statusCode: 200, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ loggedIn:false, joined:false }) };
  }

  try {
    const [encoded, signature] = raw.split(".");
    if (signature !== sign(encoded, secret)) throw new Error("Bad signature");

    const payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8"));

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ loggedIn:true, joined:payload.joined === true, username:payload.username || "Discord User" })
    };
  } catch (e) {
    return { statusCode: 200, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ loggedIn:false, joined:false }) };
  }
};
