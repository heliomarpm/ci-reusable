const core = require("@actions/core");
const github = require("@actions/github");
const fs = require("fs-extra");

async function run() {
  try {
    const prTemplateFile = core.getInput("pr-template-file");
    const coverageFile = core.getInput("coverage-file");
    const baseBranch = core.getInput("base-branch");
    const headBranch = core.getInput("head-branch");
    const title = core.getInput("title");
    const labels = core.getInput("labels");

    const token = process.env.GITHUB_TOKEN;
    if (!token) throw new Error("GITHUB_TOKEN is required");

    const octokit = github.getOctokit(token);
    const context = github.context.repo;

    // Montar corpo da PR
    let body = "";
    if (prTemplateFile && fs.existsSync(prTemplateFile)) {
      body += fs.readFileSync(prTemplateFile, "utf8") + "\n\n";
    }
    if (coverageFile && fs.existsSync(coverageFile)) {
      body += "### 📊 Test Coverage Summary\n```\n";
      body += fs.readFileSync(coverageFile, "utf8") + "\n```\n";
    }

    // Verificar PR existente
    const prs = await octokit.rest.pulls.list({
      owner: context.owner,
      repo: context.repo,
      base: baseBranch,
      head: `${context.owner}:${headBranch}`,
      state: "open"
    });

    if (prs.data.length === 0) {
      // Criar PR
      await octokit.rest.pulls.create({
        owner: context.owner,
        repo: context.repo,
        title,
        head: headBranch,
        base: baseBranch,
        body,
        draft: false
      });

      // Adicionar labels
      if (labels) {
        const createdPr = await octokit.rest.pulls.list({
          owner: context.owner,
          repo: context.repo,
          base: baseBranch,
          head: `${context.owner}:${headBranch}`,
          state: "open"
        });
        const prNumber = createdPr.data[0].number;
        await octokit.rest.issues.addLabels({
          owner: context.owner,
          repo: context.repo,
          issue_number: prNumber,
          labels: labels.split(",").map(l => l.trim())
        });
      }
      core.info("PR created!");
    } else {
      // Atualizar PR existente
      const prNumber = prs.data[0].number;
      await octokit.rest.pulls.update({
        owner: context.owner,
        repo: context.repo,
        pull_number: prNumber,
        body
      });
      core.info(`PR #${prNumber} updated!`);
    }
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
