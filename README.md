# 🚀 Chat Vox AI - Toolchain & DevEx

Bem-vindo ao ecossistema de desenvolvimento do **Chat Vox AI**. Este projeto utiliza as tecnologias mais modernas de desenvolvimento web e inteligência artificial.

## 🛠️ Toolchain Tecnológica
- **Frontend**: React 18 + Vite 5 + TypeScript
- **Backend/DB**: Supabase (PostgreSQL + Edge Functions + RLS)
- **Estilização**: Tailwind CSS + Shadcn UI
- **IA**: OpenRouter (Gemini/Claude/GPT-4 via Agentic Flow)

---

## 💻 Setup de Desenvolvimento (Local)

Para manter a consistência e evitar problemas de ambiente, siga este guia:

### 1. Requisitos
- Node.js 20+
- Docker (Para o Supabase Local)
- [Supabase CLI](https://supabase.com/docs/guides/cli)

### 2. Instalação
```sh
# Clone o repositório
git clone <URL_DO_REPO>
cd sistema-chat-vox

# Instale as dependências
npm install

# Inicie o Supabase Local (Opcional, mas recomendado)
npx supabase start
```

### 3. Execução
```sh
npm run dev
```

---

## 🛰️ Ciclo de Vida & CI/CD (GitHub Actions)

O projeto possui uma esteira de **Integração Contínua (CI)** que roda automaticamente em todo Pull Request para a `main`.

### O que o CI verifica?
1. **Linting**: Garante que o código segue os padrões do ESLint.
2. **Build**: Verifica se a aplicação compila sem erros.
3. **Tests**: Executa os testes unitários via Vitest.

> [!IMPORTANT]
> Nunca faça merge de código que falhou no CI. Isso garante a estabilidade de produção.

---

## 🔒 Segurança e Melhores Práticas
- **RLS (Row Level Security)**: Sempre valide as políticas de segurança ao criar novas tabelas no Supabase.
- **Edge Functions**: Teste suas funções localmente usando `npx supabase functions serve`.
- **Variáveis de Ambiente**: Nunca commite arquivos `.env`. Use o `.env.example` como base.

---

## 📈 Métricas DORA (Foco da Equipe)
Nosso objetivo é manter o **Lead Time for Changes** baixo e o **Deployment Frequency** alto, sem comprometer a qualidade (baixo **Change Failure Rate**).

---
© 2026 Chat Vox AI - Desenvolvido com foco em alta conversão e automação.
