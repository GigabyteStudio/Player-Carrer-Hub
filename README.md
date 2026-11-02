# Player Career Hub

Sistema web desenvolvido para registrar, organizar e acompanhar a carreira de um jogador de futebol no modo Carreira de Jogador do EA Sports FC.

O projeto permite acompanhar a evolução do atleta, suas estatísticas, transferências, conquistas e demais acontecimentos ao longo das temporadas.

## Recursos

- Perfil completo do jogador, com fotografia e informações pessoais
- Suporte a jogadores de linha e goleiros
- Evolução de overall e atributos
- Histórico de valor de mercado
- Estatísticas por competição, temporada e clube
- Histórico de transferências e contratos
- Registro de títulos e premiações individuais
- Histórico de lesões
- Gerenciamento de países, clubes, competições e temporadas
- Upload e reutilização automática de bandeiras, escudos e logos
- Gráficos interativos de evolução
- Anotações de partidas com salvamento local
- Sistema de backup e reset de dados

## Tecnologias

- Node.js
- Express.js
- EJS
- SQLite
- HTML
- CSS
- JavaScript

## Requisitos

- Node.js e npm
- Visual Studio Code (opcional)

## Instalação

Clone o repositório:

```bash
git clone https://github.com/GigabyteStudio/Player-Carrer-Hub
```

Acesse a pasta do projeto e instale as dependências:

```bash
npm install
```

Inicie o servidor:

```bash
npm start
```

Acesse o endereço local exibido no terminal.

Na primeira utilização, o sistema solicitará o cadastro inicial do jogador.

## Comandos

| Comando | Descrição |
|---|---|
| `npm start` | Inicia o servidor |
| `npm run dev` | Inicia o servidor em modo de desenvolvimento (com nodemon) |
| `npm run backup` | Cria uma cópia de segurança do banco de dados e das imagens |
| `npm run reset` | Exclui os dados da carreira e as imagens de jogadores e troféus, preservando as imagens reutilizáveis |
| `npm run reset:all` | Exclui todos os dados e imagens, mediante duas confirmações |

**Atenção:** os comandos de reset são destrutivos. Recomenda-se realizar um backup antes de utilizá-los.

## Sobre o projeto

O Player Career Hub é um projeto independente, desenvolvido pela GigabyteStudio para uso pessoal e acompanhamento de carreiras virtuais no EA Sports FC.

A GigabyteStudio e este projeto não possuem vínculo oficial com a Electronic Arts ou a EA Sports.