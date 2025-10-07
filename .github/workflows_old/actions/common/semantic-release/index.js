import path from "node:path";
import fs from "node:fs";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const templateRoot = path.resolve(__dirname);
const templateConfig = path.join(templateRoot, "release.config.js");
const consumerConfig = path.resolve(process.cwd(), "release.config.js");

const hasConsumerConfig = fs.existsSync(consumerConfig);
const configToUse = hasConsumerConfig ? consumerConfig : templateConfig;

console.log(`🧠 Usando configuração do semantic-release: ${configToUse}`);

try {
  console.log("📦 Instalando dependências do semantic-release...");
  execSync(
    "npm install --no-save semantic-release  @semantic-release/changelog @semantic-release/commit-analyzer @semantic-release/git @semantic-release/github @semantic-release/npm @semantic-release/release-notes-generator conventional-changelog-conventionalcommits",
    { stdio: "inherit" }
  );
} catch (err) {
  console.error("❌ Falha ao instalar dependências:", err);
  process.exit(1);
}

try {
  console.log("🚀 Executando semantic-release...");
  execSync(`npx semantic-release --extends ${configToUse}`, { stdio: "inherit" });
  console.log("✅ Release finalizado com sucesso!");
} catch (err) {
  console.error("❌ Erro ao executar semantic-release:", err.message);
  process.exit(1);
}
