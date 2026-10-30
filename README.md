# magia_e_reunioes

Repositorio de codigo aberto para consultar flutuação de preço das cartas do MTG.

A página **Cartas do Turtle** lista as cartas do Standard que custam até R$ 2 na faixa verde da LigaMagic, com busca, filtros por preço, cor e tipo, e o histórico de cartas que entraram e saíram da lista.

## Regras da lista

- A carta precisa ser legal no Standard e não estar banida.
- O preço é o "Preço Médio de Venda no Marketplace" (faixa verde) da LigaMagic.
- Vale o menor preço entre todas as edições da carta e entre Normal e Foil.
- Cartas de dupla face aparecem pelo nome da primeira face.

## Rodar localmente

Não há dependências nem etapa de build: é um site estático em `public/`.

```bash
npm run dev
```

```bash
npm test
```

## Publicar na Vercel

Importe o repositório na Vercel pelo GitHub e mantenha as configurações detectadas. O `vercel.json` já define `public/` como pasta publicada.

Evite publicar com `vercel deploy`: as imagens somam 107 MB e o plano Hobby limita o envio pela CLI a 100 MB.

## Estrutura

- `public/cartas.js`: lógica pura (preços em centavos, filtros, ordenação, posição das imagens)
- `public/app.js`: interface
- `public/cards.json`: cartas, no formato `[nome, preço, tipo, grupo, imagem, "edição acabamento"]`
- `public/rotacao.json`: histórico de mudanças na lista
- `public/h/`: folhas com as imagens das cartas (25 por folha, 5 colunas)
- `public/n/`: imagens das cartas que entraram depois das folhas
- `test/`: testes da lógica e da integridade dos dados

## Dados

Os dados são uma cópia do artifact [Cartas do Turtle](https://claude.ai/artifact/S2Kf7aJ4njgPekweFNAs3V), com preços consultados em 29.10.2026. **A atualização não é automática**: os preços ficam parados até `cards.json` e `rotacao.json` serem substituídos. A rotina usada na origem está no próprio artifact, em `rotina/rotina.txt`.

Imagens: Scryfall. Preços: LigaMagic. Magic: The Gathering é marca da Wizards of the Coast; este projeto não é afiliado a ela.
