exports.handler = async function () {
  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
      "Set-Cookie": "dex_session=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0"
    },
    body: JSON.stringify({ ok:true })
  };
};
