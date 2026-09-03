const fs = require('fs');
const path = require('path');

async function testPull() {
  const content = fs.readFileSync('.env.production.local', 'utf8');
  const match = content.match(/VERCEL_OIDC_TOKEN="(.*)"/);
  if (!match) {
    console.log("No token found");
    return;
  }
  const token = match[1];

  const res = await fetch("https://api.vercel.com/v9/projects/prj_PptOiy4hWXuPoPyRkhigwCNIDp9c/env", {
    headers: { Authorization: `Bearer ${token}` }
  });

  console.log("HTTP status:", res.status);
  const data = await res.json();
  if (data.envs) {
    const dbEnv = data.envs.find(e => e.key === 'DATABASE_URL');
    if (dbEnv) {
      console.log("DATABASE_URL value length:", dbEnv.value?.length);
      console.log("DATABASE_URL value sample:", dbEnv.value?.substring(0, 25));
    }
  } else {
    console.log("Data keys:", Object.keys(data));
  }
}

testPull();
