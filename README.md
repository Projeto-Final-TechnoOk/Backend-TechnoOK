# Backend

Backend da aplicação, responsável pela API, regras de negócio, autenticação, autorização e acesso aos dados de telemetria.

O projeto foi desenvolvido em **NestJS** e utiliza **TypeORM** para comunicação com o MySQL.

## Responsabilidades

O backend concentra:

- autenticação com JWT;
- autorização por cargo (`ADMIN` e `USUARIO`);
- criação do primeiro administrador;
- criação de usuários por administradores autenticados;
- CRUD de imóveis;
- CRUD de medidores;
- cadastro e listagem de leituras;
- validação de leituras acumulativas;
- cálculos de consumo;
- dados do Dashboard;
- comparação de consumo entre medidores;
- persistência no MySQL;
- execução de migrations;
- documentação da API com Swagger.

Em produção, o backend não é acessado diretamente pelo navegador. As requisições passam pelo Nginx:

```text
Browser
   ↓
Nginx :80
   ↓ /api/*
NestJS :3000
   ↓
TypeORM
   ↓
MySQL :3306
```

## Tecnologias

- Node.js 22
- NestJS
- TypeScript
- TypeORM
- MySQL 8.4
- JWT
- bcrypt
- class-validator
- Swagger
- Docker
- Docker Compose

## Estrutura

Pastas geradas, como `node_modules` e `dist`, não são exibidas.

```text
backend/
├── src/
│   ├── auth/
│   │   ├── decorators/
│   │   ├── dtos/
│   │   ├── guards/
│   │   ├── types/
│   │   ├── auth.controller.ts
│   │   ├── auth.module.ts
│   │   ├── auth.service.ts
│   │   └── security.module.ts
│   ├── consumo/
│   │   ├── consumo.module.ts
│   │   └── consumo.service.ts
│   ├── dashboard/
│   │   ├── dashboard.controller.ts
│   │   ├── dashboard.module.ts
│   │   └── dashboard.service.ts
│   ├── database/
│   │   └── migrations/
│   ├── imoveis/
│   │   ├── dtos/
│   │   ├── enums/
│   │   ├── types/
│   │   ├── imovel.entity.ts
│   │   ├── imoveis.controller.ts
│   │   ├── imoveis.module.ts
│   │   └── imoveis.service.ts
│   ├── leituras/
│   │   ├── dtos/
│   │   ├── mappers/
│   │   ├── types/
│   │   ├── leitura.entity.ts
│   │   ├── leituras.controller.ts
│   │   ├── leituras.module.ts
│   │   └── leituras.service.ts
│   ├── medidores/
│   │   ├── dtos/
│   │   ├── enums/
│   │   ├── mappers/
│   │   ├── types/
│   │   ├── medidor.entity.ts
│   │   ├── medidores.controller.ts
│   │   ├── medidores.module.ts
│   │   └── medidores.service.ts
│   ├── usuarios/
│   │   ├── dtos/
│   │   ├── enums/
│   │   ├── types/
│   │   ├── usuario.entity.ts
│   │   ├── usuarios.controller.ts
│   │   ├── usuarios.module.ts
│   │   └── usuarios.service.ts
│   ├── app.module.ts
│   └── main.ts
├── Dockerfile
├── docker-compose.yml
├── .dockerignore
├── .env
├── .env.example
├── typeorm.config.ts
├── nest-cli.json
├── tsconfig.json
├── tsconfig.build.json
├── package.json
└── package-lock.json
```

## Modelo de domínio

```text
Imóvel
  │
  └── 1:N Medidor
          │
          └── 1:N Leitura
```

As leituras são acumulativas. O consumo é calculado pela diferença entre leituras consecutivas de um mesmo medidor.

## Autenticação e autorização

### Login

```http
POST /auth/login
```

Após validar e-mail e senha, o backend gera um JWT.

Nas rotas protegidas, o frontend envia:

```http
Authorization: Bearer <token>
```

O backend utiliza guards globais para validar autenticação e autorização.

### Primeiro administrador

Em uma instalação nova, o sistema permite criar o primeiro administrador apenas enquanto não existir nenhum usuário cadastrado.

```http
GET  /usuarios/primeiro-admin/disponivel
POST /usuarios/primeiro-admin
```

### Criação de usuários

Depois da inicialização do sistema, novos usuários são criados por um administrador autenticado:

```http
POST /usuarios
```

Essa rota exige JWT válido e cargo `ADMIN`.

## Variáveis de ambiente

Exemplo de `.env`:

```env
DB_HOST=db
DB_PORT=3306
DB_USER=technook_user
DB_PASS=sua_senha
DB_NAME=telemetria_db

JWT_SECRET=seu_segredo
JWT_EXPIRES_IN=86400
```

> O `.env` real não deve ser versionado.

`DB_HOST=db` utiliza o alias do MySQL na rede Docker compartilhada.

## Docker em produção

O Dockerfile possui dois estágios:

```text
build
  ↓
npm ci
  ↓
nest build
  ↓
dist/

runtime
  ↓
npm ci --omit=dev
  ↓
recebe dist/
  ↓
node dist/src/main
```

O Compose possui dois serviços.

### `backend-migrate`

Job temporário responsável por executar:

```bash
npm run migration:run
```

Quando termina com:

```text
Exited (0)
```

as migrations foram executadas corretamente.

### `backend`

Container permanente da API.

Executa:

```bash
node dist/src/main
```

e escuta internamente na porta:

```text
3000
```

O Nginx acessa o serviço por:

```text
backend:3000
```

## Primeira execução

### 1. Prepare a infraestrutura

Na pasta `infra`:

```bash
sudo ./docker-setup/setup.sh
sudo docker compose up -d db
```

Aguarde o banco ficar `healthy`.

### 2. Configure o `.env`

Preencha o `.env` do backend com as credenciais correspondentes às configuradas na infraestrutura.

### 3. Construa e suba o backend

Na pasta `backend`:

```bash
sudo docker compose up -d --build
```

Esse comando:

1. constrói as imagens;
2. executa as migrations;
3. inicia a API.

### 4. Verifique

```bash
sudo docker compose ps
```

Comportamento esperado:

```text
technook-backend-migrate-prod   Exited (0)
technook-backend-prod           Up
```

Logs:

```bash
sudo docker compose logs -f backend
```

## Execuções seguintes

Sem alteração no backend:

```bash
sudo docker compose up -d
```

Após alterar o código:

```bash
sudo docker compose up -d --build
```

## Swagger

Com a infraestrutura completa em execução:

```text
http://localhost/docs
```

## Comandos úteis

### Ver containers

```bash
sudo docker compose ps
```

### Ver logs

```bash
sudo docker compose logs -f backend
```

### Reconstruir e subir

```bash
sudo docker compose up -d --build
```

### Parar o backend

```bash
sudo docker compose down
```

## Observação sobre o banco

A população de dados de teste é responsabilidade do módulo `infra`, por meio do script:

```text
infra/database/seed-nao-usar-em-prod.sql
```

As instruções para executar esse seed estão no README da infraestrutura.
