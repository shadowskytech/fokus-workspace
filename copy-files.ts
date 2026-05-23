import { cpSync, readdirSync, rmdirSync, rmSync } from "fs";

readdirSync("temp").forEach((file) => {
  if (file === "node_modules" || file === ".git") return;
  cpSync(`temp/${file}`, `./${file}`, { recursive: true });
});

rmSync("temp", { recursive: true, force: true });
