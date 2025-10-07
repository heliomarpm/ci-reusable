/**
 * Semantic Release Configuration
 * -------------------------------
 * Compatível com o preset @sanity/semantic-release-preset
 * Gera releases automáticas no GitHub e npm (se aplicável)
 */

export default {
  branches: [
    "main",
    { name: "release", prerelease: true },
    { name: "develop", prerelease: false }
  ],
  plugins: [
    [
      // Analisador de commits seguindo o padrão de versionamento semântico
      "@semantic-release/commit-analyzer",
      {
        releaseRules: [
          { breaking: true, release: "major" },
          { type: "feat", release: "minor" },
          { type: "fix", release: "patch" },
          { type: "revert", release: "patch" },
          { scope: "no-release", release: false }
        ],
        parserOpts: {
          mergePattern: "^Merge pull request #(\\d+) from .+\\n(.+)",
          mergeCorrespondence: ["id", "message"],
          noteKeywords: [
            "BREAKING CHANGE",
            "BREAKING CHANGES",
            "BREAKING-CHANGE",
            "BREAKING-CHANGES"
          ]
        }
      }
    ],
    // Gera changelog automaticamente com base nos commits
    "@semantic-release/release-notes-generator",    
    ["@semantic-release/changelog", {
      changelogFile: "CHANGELOG.md",
      changelogTitle: "# 📦 Changelog\n\nAll notable changes to this project will be documented in this file."
    }],
    ["@semantic-release/npm", { npmPublish: false }],

    // Cria uma release no GitHub com changelog e artefatos
    ["@semantic-release/github", {
      successComment: true, 
      failComment: true,
      assets: [
        { path: "dist/**", label: "Build" },
        { path: "coverage/**", label: "Coverage Report" },
      ],
    }],

    // Commita arquivos alterados (CHANGELOG.md, package.json, etc)
    [
      "@semantic-release/git",
      {
        assets: ["CHANGELOG.md", "package.json", "package-lock.json"],
        message: "chore(release): set `package.json` to ${nextRelease.version} [skip ci]\n\n${nextRelease.notes}",
        tag: "${version}"
      }
    ]
  ]
};