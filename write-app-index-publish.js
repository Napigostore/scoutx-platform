const fs = require("fs");
const content = `export * from "./use-cases/SignInUseCase";
export * from "./use-cases/RefreshSessionUseCase";
export * from "./use-cases/SignOutUseCase";
export * from "./use-cases/GetCurrentUserUseCase";
export * from "./use-cases/AuthorizeActionUseCase";

export * from "./use-cases/CreateMissionUseCase";
export * from "./use-cases/ListRequesterMissionsUseCase";
export * from "./use-cases/GetMissionDetailsUseCase";
export * from "./use-cases/UpdateMissionUseCase";
export * from "./use-cases/CancelMissionUseCase";
export * from "./use-cases/PublishMissionUseCase";
`;
fs.writeFileSync("packages/application/src/index.ts", content, "utf8");
console.log("Successfully wrote packages/application/src/index.ts");
