const core = require('@actions/core');
const github = require('@actions/github');
const fs = require('fs');
const path = require('path');

function formatCoverage(summary) {
    // Função simples para formatar o JSON de cobertura em um corpo Markdown
    const totalLines = summary.total.lines;
    const percentage = totalLines.pct.toFixed(2);
    const color = percentage >= 80 ? 'green' : percentage >= 50 ? 'yellow' : 'red';
    
    return `
| Métrica | Cobertura | Total | Status |
| :--- | :--- | :--- | :--- |
| **Linhas** | ${totalLines.covered}/${totalLines.total} | **${percentage}%** | :${color}_circle: |
| **Funções** | ${summary.total.functions.pct.toFixed(2)}% | | |
| **Branches** | ${summary.total.branches.pct.toFixed(2)}% | | |
| **Statements** | ${summary.total.statements.pct.toFixed(2)}% | | |
`;
}

async function run() {
    try {
        const token = core.getInput('github_token', { required: true });
        const head = core.getInput('head_branch', { required: true });
        const base = core.getInput('base_branch', { required: true });
        const title = core.getInput('pr_title') || `🔀 ${head} → ${base}: ${new Date().toISOString().substring(0, 10)}`;
        const coveragePath = core.getInput('coverage_summary_path');
        
        const octokit = github.getOctokit(token);
        const { owner, repo } = github.context.repo;
        const templatePath = path.join(__dirname, 'pr_template.md');
        let bodyTemplate = fs.readFileSync(templatePath, 'utf8');

        // Substituir variáveis de branch no template
        bodyTemplate = bodyTemplate.replace(/\$\{\{ head_branch \}\}/g, head).replace(/\$\{\{ base_branch \}\}/g, base);

        // 1. Processar Cobertura
        let coverageSummary = 'Não foi possível carregar o resumo de cobertura.';
        try {
            if (coveragePath && fs.existsSync(coveragePath)) {
                core.info(`📊 Processando resumo de cobertura em: ${coveragePath}`);
                const summaryJson = JSON.parse(fs.readFileSync(coveragePath, 'utf8'));
                
                // ⭐️ CORREÇÃO: Verificação da estrutura do JSON para evitar "Cannot read properties of undefined" ⭐️
                if (summaryJson && summaryJson.total && summaryJson.total.lines) {
                    coverageSummary = formatCoverage(summaryJson);
                } else {
                    core.warning('O arquivo JSON de cobertura está malformado ou incompleto (faltando a chave "total.lines").');
                    coverageSummary = '*O resumo de cobertura está malformado ou incompleto.*';
                }
            } else if (coveragePath) {
                core.warning(`Arquivo de resumo de cobertura não encontrado em: ${coveragePath}`);
                coverageSummary = '*Nenhum resumo de cobertura encontrado (arquivo não existe).*';
            } else {
                coverageSummary = '*Caminho para o resumo de cobertura não foi especificado.*';
            }
        } catch (error) {
            // core.setFailed(`Erro ao processar o JSON de cobertura: ${error.message}`);
            core.warning(`Erro ao ler ou parsear o JSON de cobertura: ${error.message}`);
            coverageSummary = `*Erro ao processar o arquivo de cobertura: ${error.message}.*`;
        }

        // Injetar o resumo de cobertura no corpo
        // const body = bodyTemplate.replace(/[^]*?/s, coverageSummary);
        const body = bodyTemplate.replace(/<!-- COBERTURA_SUMMARY_PLACEHOLDER -->[^]*?<!-- COBERTURA_SUMMARY_PLACEHOLDER -->/s, coverageSummary);

        // 2. Tentar encontrar um PR existente
        const { data: pullRequests } = await octokit.rest.pulls.list({
            owner,
            repo,
            head: `${owner}:${head}`,
            base: base,
            state: 'open',
        });

        const existingPr = pullRequests[0];

        if (existingPr) {
            // 3. Atualizar PR existente
            core.info(`🔄 Pull Request existente encontrado (#${existingPr.number}). Atualizando corpo.`);
            await octokit.rest.pulls.update({
                owner,
                repo,
                pull_number: existingPr.number,
                body: body,
            });
            core.setOutput('pull_request_number', existingPr.number);
            core.setOutput('action_performed', 'updated');

        } else {
            // 4. Criar novo PR
            core.info(`✨ Nenhum PR encontrado. Criando novo Pull Request de ${head} para ${base}.`);
            const { data: newPr } = await octokit.rest.pulls.create({
                owner,
                repo,
                title: title,
                head: head,
                base: base,
                body: body,
                draft: false, // Pode ser alterado para true se preferir PRs de rascunho
            });
            core.setOutput('pull_request_number', newPr.number);
            core.setOutput('action_performed', 'created');
            core.info(`✅ Pull Request criado: #${newPr.number}`);
        }

    } catch (error) {
        // Ignora o erro se as branches forem idênticas (base == head) ou não houver commits
        // Garantindo que a Action falhe apenas por erros críticos (e.g., token, API)
        if (error.message.includes('No commits between') || error.message.includes('A pull request already exists')) {
            core.info(`⚠️ Ação de PR ignorada: ${error.message}`);
        } else {
            core.setFailed(`Falha na criação/atualização do Pull Request: ${error.message}`);
        }
    }
}

run();