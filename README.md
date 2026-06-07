# ⚙️ ProtomApp — API

> Backend do ProtomApp — plataforma de saúde e alta performance.  
> API RESTful construída com **NestJS 11 + TypeORM + PostgreSQL**.

---

## ✨ Visão Geral

A ProtomApp API é o núcleo de dados do ecossistema. Gerencia autenticação, perfil do paciente, protocolo médico, treino, nutrição, exames, prescrições e parceiros — com arquitetura modular, validação robusta e documentação automática via Swagger.

---

## 🛠️ Stack Técnica

| Camada | Tecnologia |
|--------|-----------|
| Framework | [NestJS 11](https://nestjs.com) |
| Linguagem | TypeScript (strict) |
| ORM | TypeORM |
| Banco de Dados | PostgreSQL 15+ |
| Autenticação | JWT (`@nestjs/jwt` + `passport-jwt`) |
| Hash de senha | bcrypt |
| Validação | `class-validator` + `ValidationPipe` global |
| Documentação | Swagger (`@nestjs/swagger`) |
| Config | `@nestjs/config` + `.env` |

---

## 📦 Módulos

| Módulo | Rota Base | Descrição |
|--------|-----------|-----------|
| **auth** | `/api/auth` | Registro, login e emissão de JWT |
| **users** | `/api/users` | Perfil do paciente e dados biométricos |
| **protocol** | `/api/protocol` | Protocolo ativo, tarefas e aderência |
| **exams** | `/api/exams` | Upload e análise de exames laboratoriais |
| **workout** | `/api/workout` | Plano de treino e modo imersivo 3D |
| **nutrition** | `/api/nutrition` | Análise de refeições e macronutrientes |
| **prescriptions** | `/api/prescriptions` | Receitas e pedidos médicos assinados |
| **partners** | `/api/partners` | Parceiros com descontos (suplementos/farmácias/labs) |

---

## 🗄️ Banco de Dados

```
PostgreSQL
├── users          — dados do paciente + biometria
├── (demais tabelas sincronizadas via TypeORM synchronize:true em dev)
```

### Configuração (`.env`)

```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASS=postgres
DB_NAME=protomapp
JWT_SECRET=sua_chave_secreta_aqui
PORT=3001
```

---

## 🚀 Como Rodar

### Pré-requisitos

- Node.js 18+
- PostgreSQL 15+ rodando localmente
- Banco `protomapp` criado

```sql
CREATE DATABASE protomapp;
```

### Instalação

```bash
cd protomapp-api
npm install
```

### Desenvolvimento

```bash
npm run start:dev
```

A API sobe em `http://localhost:3001/api`

### Produção

```bash
npm run build
npm run start:prod
```

---

## 📖 Documentação (Swagger)

Com o servidor rodando, acesse:

```
http://localhost:3001/api/docs
```

Todos os endpoints estão documentados com exemplos de request/response.

---

## 🔐 Autenticação

O fluxo usa **JWT com access token de 15 minutos**:

```
POST /api/auth/register   → Cria usuário, retorna { access_token }
POST /api/auth/login      → Autentica, retorna { access_token }
```

Endpoints protegidos exigem o header:
```
Authorization: Bearer <access_token>
```

---

## 📁 Estrutura do Projeto

```
protomapp-api/
├── src/
│   ├── common/
│   │   └── entities/       # BaseEntity (id uuid, createdAt, updatedAt)
│   ├── modules/
│   │   ├── auth/           # JWT + bcrypt
│   │   ├── users/          # UserEntity + biometria
│   │   ├── protocol/       # Protocolo e tarefas
│   │   ├── exams/          # Exames laboratoriais
│   │   ├── workout/        # Treinos
│   │   ├── nutrition/      # Nutrição
│   │   ├── prescriptions/  # Receitas médicas
│   │   └── partners/       # Parceiros e descontos
│   ├── app.module.ts       # Módulo raiz
│   └── main.ts             # Bootstrap: porta, CORS, Swagger, ValidationPipe
├── .env                    # Variáveis de ambiente (não commitar)
└── tsconfig.json
```

---

## 🧪 Verificar TypeScript

```bash
npx tsc --noEmit
```

---

## 📌 Status do Projeto

- [x] Scaffold NestJS 11
- [x] Autenticação JWT + bcrypt
- [x] Módulo de usuários com biometria
- [x] 6 módulos de domínio (protocol, exams, workout, nutrition, prescriptions, partners)
- [x] Mock controllers para fase de validação
- [x] Swagger documentado
- [x] CORS configurado para mobile
- [x] ValidationPipe global
- [ ] Controllers reais com lógica de negócio
- [ ] Integração com storage (exames/receitas)
- [ ] Refresh token
- [ ] Testes unitários e e2e

---

## 🔗 Repositório Mobile

O aplicativo mobile que consome esta API está em [ProtomApp (Mobile)](https://github.com/IASR19/ProtomApp).

---

> **Aviso:** API em fase de validação. Dados mockados retornados diretamente nos controllers de domínio.
