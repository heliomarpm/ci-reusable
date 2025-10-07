# 🧩 CI Templates

Template padronizado para pipelines CI/CD híbridos em **Node.js** e **.NET**, com suporte a **semantic-release automático** e **Pull Request com cobertura**.

---

## 🚀 Recursos

- ✅ Workflows prontos para Node e .NET  
- ⚙️ Semantic-release híbrido (usa config local ou padrão)  
- 🧠 Geração automática de PR template com cobertura  
- 🧩 Publicação automatizada no npm ou NuGet  
- 🧰 Clean Architecture + padronização  

---

## 🧰 Como usar

1. Copie a pasta `.github` deste repositório para o seu projeto.  
2. Configure seus **tokens** no repositório consumidor:
   - `GITHUB_TOKEN`
   - `NPM_TOKEN` (Node)
   - `NUGET_TOKEN` (.NET)

3. (Opcional) Adicione seu próprio `release.config.js` — caso contrário, o template usa o padrão.

---

## 🧪 Cobertura no PR

Se o repositório possuir `coverage/coverage-summary.json`, o relatório será incluído automaticamente no corpo do PR.

---

## 📄 Licença

MIT © Heliomar P. M.
