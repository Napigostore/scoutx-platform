const fs = require("fs");
let content = fs.readFileSync("apps/web/src/app/missions/[missionId]/page.tsx", "utf8");
content = content.replace(
  `{mission.submission.mediaUrls.map((url, idx) => (
                        <img
                          key={idx}
                          src={url}
                          alt="Evidence"
                          className="max-h-48 rounded-lg border border-green-100 object-cover"
                        />
                      ))}`,
  `{mission.submission.mediaUrls.map((url, idx) => (
                        <div key={idx}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={url}
                            alt="Evidence"
                            className="max-h-48 rounded-lg border border-green-100 object-cover"
                          />
                        </div>
                      ))}`,
);
fs.writeFileSync("apps/web/src/app/missions/[missionId]/page.tsx", content, "utf8");
console.log("Successfully fixed JSX comment with div wrapper");
