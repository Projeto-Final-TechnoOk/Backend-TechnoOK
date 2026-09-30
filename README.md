# TechnoOK — Backend

Backend da aplicação **TechnoOK / Fink**, responsável pela API, regras de negócio, autenticação, autorização, persistência e processamento dos dados de telemetria.

## O que este projeto faz

O backend foi desenvolvido em **NestJS** e centraliza as regras do sistema. Entre suas principais responsabilidades estão:

- autenticação de usuários com JWT;
- autorização baseada em cargo (`ADMIN` e `USUARIO`);
- criação do primeiro administrador no primeiro acesso;
- criação de usuários por administradores autenticados;
- CRUD de imóveis;
- CRUD de medidores;
- cadastro e listagem de leituras;
- validação de leituras acumulativas;
- cálculos de consumo;
- dados consolidados para o Dashboard;
- comparação de consumo entre medidores;
- persistência no MySQL por meio do TypeORM;
- execução automática de migrations antes da subida da API;
- documentação da API com Swagger.

Em produção, o backend **não é exposto diretamente ao navegador**. As requisições chegam primeiro ao Nginx e são encaminhadas para o container da API.

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

## Tecnologias principais

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

## Estrutura principal de pastas

Pastas geradas automaticamente, como `node_modules` e `dist`, não são exibidas.

```text
backend/
├── src/
│   ├── auth/
│   │   ├── decorators/
│   │   ├── guards/
│   │   ├── dtos/
│   │   ├── types/
│   │   ├── auth.controller.ts
│   │   ├── auth.module.ts
│   │   ├── auth.service.ts
│   │   └── security.module.ts
│   ├── usuarios/
│   │   ├── dtos/
│   │   ├── enums/
│   │   ├── types/
│   │   ├── usuario.entity.ts
│   │   ├── usuarios.controller.ts
│   │   ├── usuarios.module.ts
│   │   └── usuarios.service.ts
│   ├── imoveis/
│   │   ├── dtos/
│   │   ├── types/
│   │   ├── imovel.entity.ts
│   │   ├── imoveis.controller.ts
│   │   ├── imoveis.module.ts
│   │   └── imoveis.service.ts
│   ├── medidores/
│   │   ├── dtos/
│   │   ├── enums/
│   │   ├── types/
│   │   ├── medidor.entity.ts
│   │   ├── medidores.controller.ts
│   │   ├── medidores.module.ts
│   │   └── medidores.service.ts
│   ├── leituras/
│   │   ├── dtos/
│   │   ├── mappers/
│   │   ├── types/
│   │   ├── leitura.entity.ts
│   │   ├── leituras.controller.ts
│   │   ├── leituras.module.ts
│   │   └── leituras.service.ts
│   ├── consumo/
│   │   ├── consumo.module.ts
│   │   └── consumo.service.ts
│   ├── dashboard/
│   │   ├── dashboard.controller.ts
│   │   ├── dashboard.module.ts
│   │   └── dashboard.service.ts
│   ├── database/
│   │   └── migrations/
│   ├── app.module.ts
│   └── main.ts
├── database/
│   └── seed-dev-suave.sql
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

## Modelo principal de domínio

```text
Imóvel
  │
  └── 1:N Medidor
          │
          └── 1:N Leitura
```

As leituras são acumulativas. O consumo é obtido pela diferença entre leituras consecutivas de um mesmo medidor.

## Autenticação e autorização

O login ocorre em:

```http
POST /auth/login
```

Após validar e-mail e senha, o backend gera um JWT. Nas requisições protegidas, o frontend envia:

```http
Authorization: Bearer <token>
```

O backend utiliza guards globais para validar autenticação e autorização.

### Primeiro administrador

Em uma instalação nova, quando ainda não existe nenhum usuário, o sistema permite criar o primeiro administrador.

```http
GET  /usuarios/primeiro-admin/disponivel
POST /usuarios/primeiro-admin
```

Mesmo que alguém tente chamar a rota manualmente, o backend bloqueia a criação quando já existe usuário cadastrado.

### Criação normal de usuários

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

`DB_HOST=db` funciona porque `db` é o alias do MySQL na rede Docker compartilhada.

## Docker em produção

O Dockerfile utiliza dois estágios:

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

O Compose possui dois serviços principais.

### `backend-migrate`

Job temporário que executa:

```bash
npm run migration:run
```

`Exited (0)` significa que o job terminou corretamente.

### `backend`

Container permanente da API. Executa:

```bash
node dist/src/main
```

e escuta internamente na porta `3000`.

O Nginx acessa a API por:

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

Aguarde o MySQL ficar `healthy`.

### 2. Configure o `.env`

Preencha o `.env` do backend com credenciais compatíveis com o banco definido na infraestrutura.

### 3. Construa e suba o backend

Na pasta `backend`:

```bash
sudo docker compose up -d --build
```

Esse comando constrói as imagens, executa as migrations e inicia a API.

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

Sem alteração de código:

```bash
sudo docker compose up -d
```

Após alterar o backend:

```bash
sudo docker compose up -d --build
```

Ver logs:

```bash
sudo docker compose logs -f backend
```

Parar:

```bash
sudo docker compose down
```

## Seed de dados

A partir da pasta `backend`:

```bash
sudo docker exec -i technook-db-prod \
  sh -c 'mysql --default-character-set=utf8mb4 -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" "$MYSQL_DATABASE"' \
  < database/seed-dev-suave.sql
```

A partir da raiz geral do projeto:

```bash
sudo docker exec -i technook-db-prod \
  sh -c 'mysql --default-character-set=utf8mb4 -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" "$MYSQL_DATABASE"' \
  < backend/database/seed-dev-suave.sql
```

> O seed limpa e repopula as tabelas de telemetria.

## Acessar o terminal MySQL

```bash
sudo docker exec -it technook-db-prod mysql -u technook_user -p telemetria_db
```

## Swagger

Com a infraestrutura completa em execução:

```text
http://localhost/docs
```

## Comandos úteis

```bash
sudo docker compose up -d
sudo docker compose up -d --build
sudo docker compose ps
sudo docker compose logs -f backend
sudo docker compose down
```
