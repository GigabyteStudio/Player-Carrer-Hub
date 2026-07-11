# Player Career Hub

Sistema desenvolvido para gerenciamento de carreiras de jogadores de futebol no EA FC, inspirado no Transfermarkt e adaptado para registrar toda a evolução de um jogador ao longo de sua carreira.

## Recursos

- Perfil completo do jogador
- Evolução de Overall e atributos
- Valor de mercado e histórico
- Estatísticas por competição
- Histórico de lesões
- Troféus e conquistas
- Transferências
- Temporadas e competições
- Área administrativa
- Anotações temporárias (LocalStorage)
- Sistema de backup integrado

## Tecnologias

- Node.js
- Express.js
- EJS
- SQLite
- HTML
- CSS
- JavaScript

## Requisitos

- Node.js 18 ou superior
- Visual Studio Code (opcional)

## Instalação

Clone o repositório:

```bash
git clone <url-do-repositorio>
```

Instale as dependências:

```bash
npm install
```

Inicie o projeto:

```bash
npm run dev
```

O sistema estará disponível em:

```
http://localhost:3000
```

## Scripts

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Inicia o servidor em modo de desenvolvimento |
| `npm run backup` | Cria um backup da database e da pasta de uploads |
| `npm run reset` | Remove a database e todos os uploads |