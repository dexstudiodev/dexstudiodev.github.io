const crypto = require("crypto");

function sign(value, secret) {
  return crypto.createHmac("sha256", secret).update(value).digest("base64url");
}
function cookies(header) {
  const out = {};
  if (!header) return out;
  header.split(";").forEach(c => {
    const [k, ...v] = c.trim().split("=");
    out[k] = v.join("=");
  });
  return out;
}

exports.handler = async function (event) {
  const raw = cookies(event.headers.cookie || event.headers.Cookie).dex_session;
  const secret = process.env.SESSION_SECRET;

  if (!raw || !secret || !raw.includes(".")) {
    return { statusCode: 200, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ loggedIn:false, joined:false }) };
  }

  try {
    const [encoded, sig] = raw.split(".");
    if (sig !== sign(encoded, secret)) throw new Error("bad signature");
    const data = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8"));
    return { statusCode: 200, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ loggedIn:true, joined:data.joined === true, username:data.username }) };
  } catch(e) {
    return { statusCode: 200, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ loggedIn:false, joined:false }) };
  }
};
