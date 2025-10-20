const core = require('@actions/core');
const exec = require('@actions/exec');
const fs = require('fs');
const path = require('path');

async function run() {
  try {
    const GITHUB_TOKEN = core.getInput('github_token', { required: true });
    const NPM_TOKEN = core.getInput('npm_token');
    const debug = core.getInput('debug') ? '--debug' : '';
    const simulateRelease = core.getInput('simulate_release');
    const configPath = core.getInput('config_path');
    const actionDir = path.join(__dirname, '..', '..', '..', '..', '..', '.github', 'workflows', 'actions', 'common', 'semantic-release');
    const consumerRepoDir = process.cwd();

    // 1. Configurar Tokens
    core.exportVariable('GITHUB_TOKEN', GITHUB_TOKEN);
    // if (NPM_TOKEN) {
      core.exportVariable('NPM_TOKEN', NPM_TOKEN);
    // }

    // 2. Lógica Híbrida de Configuração
    let releaseConfigPath = '';
    const consumerConfigPath = path.join(consumerRepoDir, configPath);

    if (fs.existsSync(consumerConfigPath)) {
      core.info('✅ release.config.js encontrado no repositório consumidor. Usando configuração local.');
      releaseConfigPath = consumerConfigPath;
    } else {
      core.info('⚠️ release.config.js não encontrado no repositório consumidor. Usando configuração padrão do template.');
      // O configPath aponta para o release.config.js padrão (ou alternativo) dentro da action
      releaseConfigPath = path.join(actionDir, 'release.config.js');
      if (!fs.existsSync(releaseConfigPath)) {
        releaseConfigPath = "./templates-repo/.github/workflows/actions/common/semantic-release/release.config.js";
      }
    }

    if (!fs.existsSync(releaseConfigPath)) {
      throw new Error(`release.config.js not found at path: ${releaseConfigPath}`);
    }

    // 3. Instalar Dependências (Action e Plugins)
    core.info('📥 Instalando dependências e plugins do semantic-release...');
    // Instala as dependências listadas no package.json (devDependencies) da action
    await exec.exec(`npm install --prefix ${actionDir}`);

    // 4. Executar semantic-release
    core.info('🚀 Executando semantic-release...');

    // Caminho para o binário do semantic-release instalado na action
    const semanticReleaseBin = path.join(actionDir, 'node_modules', '.bin', 'semantic-release');

    // Comando final de execução
    let command = [
      semanticReleaseBin,
      '-p',
      releaseConfigPath,
      debug
    ].join(' ').trim();

    if (simulateRelease) {
      core.info('⚠️ Simulando release para fins de testes.');
      command += ' --dry-run';
    }

    // Executar o semantic-release
    await exec.exec(command, [], {
      env: { ...process.env, GITHUB_TOKEN, NPM_TOKEN }
    });

    core.info('🎉 Semantic release concluído.');

  } catch (error) {
    core.setFailed(error.message);
  }
}

run();