import {
  FAIXAS_DE_PRECO,
  GRUPOS,
  TIPOS,
  filtrarCartas,
  formatarPreco,
  lerFiltrosSalvos,
  linkLigaMagic,
  linkScryfall,
  localDaImagem,
  montarCartas,
  nomeDoGrupo,
  nomeDoTipo,
  nomesNovos,
  ordenarCartas,
  paraCentavos,
} from "./cartas.js";

const CARTAS_POR_VEZ = 120;
const CHAVE_FILTROS = "turtle-filtros";

const $ = (id) => document.getElementById(id);
const numero = (valor) => valor.toLocaleString("pt-BR");
const palavraCartas = (total) => (total === 1 ? "carta" : "cartas");

const estado = { busca: "", ...carregarFiltros() };
let cartas = [];
let lista = [];
let visiveis = CARTAS_POR_VEZ;
let novas = new Set();

function carregarFiltros() {
  try {
    return lerFiltrosSalvos(localStorage.getItem(CHAVE_FILTROS));
  } catch {
    return lerFiltrosSalvos(null);
  }
}

function salvarFiltros() {
  const { precoMax, ordem, grupos, tipos } = estado;
  try {
    localStorage.setItem(
      CHAVE_FILTROS,
      JSON.stringify({
        precoMax,
        ordem,
        grupos: [...grupos],
        tipos: [...tipos],
      }),
    );
  } catch {
    // Sem armazenamento (janela privada, por exemplo) os filtros só não são lembrados.
  }
}

function el(tag, propriedades = {}, ...filhos) {
  const elemento = document.createElement(tag);
  for (const [nome, valor] of Object.entries(propriedades)) {
    if (nome.startsWith("aria-")) elemento.setAttribute(nome, valor);
    else elemento[nome] = valor;
  }
  elemento.append(...filhos);
  return elemento;
}

function aplicarImagem(elemento, imagem) {
  const { arquivo, x, y } = localDaImagem(imagem);
  elemento.style.backgroundImage = `url(${arquivo})`;
  if (x === undefined) {
    elemento.style.backgroundSize = "cover";
    elemento.style.backgroundPosition = "center";
  } else {
    elemento.style.backgroundSize = "";
    elemento.style.backgroundPosition = `${x}% ${y}%`;
  }
}

function alternar(conjunto, codigo) {
  if (conjunto.has(codigo)) conjunto.delete(codigo);
  else conjunto.add(codigo);
  atualizar();
}

function chip(rotulo, ativo, aoClicar, cor) {
  const botao = el("button", {
    className: "chip",
    type: "button",
    "aria-pressed": String(ativo),
    onclick: aoClicar,
  });
  if (cor) {
    const ponto = el("span", { className: "dot" });
    ponto.style.background = `var(${cor})`;
    botao.append(ponto);
  }
  botao.append(rotulo);
  return botao;
}

function desenharChips() {
  $("cores").replaceChildren(
    chip("Todas as cores", estado.grupos.size === 0, () => {
      estado.grupos.clear();
      atualizar();
    }),
    ...GRUPOS.map(({ codigo, nome, cor }) =>
      chip(
        nome,
        estado.grupos.has(codigo),
        () => alternar(estado.grupos, codigo),
        cor,
      ),
    ),
  );
  $("tipos").replaceChildren(
    ...TIPOS.map(({ codigo, nome }) =>
      chip(nome, estado.tipos.has(codigo), () =>
        alternar(estado.tipos, codigo),
      ),
    ),
  );
}

function descricaoDaCarta(carta) {
  const tipo = nomeDoTipo(carta.tipo);
  return carta.versao ? `${tipo} · ${carta.versao}` : tipo;
}

function desenharCarta(carta) {
  const imagem = el("button", {
    className: "pic",
    type: "button",
    "aria-label": `Ampliar ${carta.nome}`,
    onclick: () => abrirDetalhe(carta),
  });
  aplicarImagem(imagem, carta.imagem);

  const link = el(
    "a",
    { href: linkLigaMagic(carta.nome), target: "_blank", rel: "noopener" },
    carta.nome,
  );
  if (novas.has(carta.nome)) {
    link.append(el("span", { className: "tag" }, "nova"));
  }

  return el(
    "figure",
    { className: "card" },
    imagem,
    el(
      "figcaption",
      { className: "cap" },
      link,
      el(
        "div",
        { className: "meta" },
        el("span", {}, descricaoDaCarta(carta)),
        el(
          "span",
          { className: "price" },
          formatarPreco(carta.centavos),
        ),
      ),
    ),
  );
}

function desenharSecaoDeGrupo(codigo, total) {
  const { nome, cor } = GRUPOS.find((grupo) => grupo.codigo === codigo);
  const amostra = el("span", { className: "sw" });
  amostra.style.background = `var(${cor})`;
  const grade = el("div", { className: "grid" });
  const secao = el(
    "section",
    { className: "grp" },
    el(
      "h2",
      {},
      amostra,
      `${nome} `,
      el("small", {}, `${numero(total)} ${palavraCartas(total)}`),
    ),
    grade,
  );
  return { secao, grade };
}

function desenharLista() {
  const saida = $("saida");
  const vista = lista.slice(0, visiveis);

  const total = cartas.length;
  $("contagem").replaceChildren(
    "Mostrando ",
    el("b", {}, numero(vista.length)),
    " de ",
    el("b", {}, numero(lista.length)),
    ` ${palavraCartas(lista.length)}`,
    lista.length < total ? ` (de ${numero(total)} no total)` : "",
  );

  if (lista.length === 0) {
    saida.replaceChildren(
      el(
        "p",
        { className: "empty" },
        "Nenhuma carta com esses filtros. Tente outro nome ou limpe as cores e tipos.",
      ),
    );
    $("mais").hidden = true;
    return;
  }

  if (estado.ordem === "cor") {
    const totais = new Map();
    for (const { grupo } of lista) {
      totais.set(grupo, (totais.get(grupo) ?? 0) + 1);
    }

    const secoes = [];
    let grupoAtual = null;
    let grade = null;
    for (const carta of vista) {
      if (carta.grupo !== grupoAtual) {
        grupoAtual = carta.grupo;
        const novaSecao = desenharSecaoDeGrupo(
          grupoAtual,
          totais.get(grupoAtual),
        );
        secoes.push(novaSecao.secao);
        grade = novaSecao.grade;
      }
      grade.append(desenharCarta(carta));
    }
    saida.replaceChildren(...secoes);
  } else {
    saida.replaceChildren(
      el("div", { className: "grid" }, ...vista.map(desenharCarta)),
    );
  }

  $("mais").hidden = visiveis >= lista.length;
}

function filtrarEDesenhar() {
  lista = ordenarCartas(filtrarCartas(cartas, estado), estado.ordem);
  desenharLista();
}

function atualizar() {
  visiveis = CARTAS_POR_VEZ;
  salvarFiltros();
  desenharChips();
  filtrarEDesenhar();
}

function mostrarMais() {
  visiveis += CARTAS_POR_VEZ;
  desenharLista();
}

function abrirDetalhe(carta) {
  aplicarImagem($("detalhe-imagem"), carta.imagem);
  $("detalhe-nome").textContent = carta.nome;
  $("detalhe-tipo").textContent =
    `${nomeDoGrupo(carta.grupo)} · ${descricaoDaCarta(carta)}`;
  $("detalhe-preco").textContent = formatarPreco(carta.centavos);
  $("detalhe-liga").href = linkLigaMagic(carta.nome);
  $("detalhe-scryfall").href = linkScryfall(carta.nome);
  $("detalhe").showModal();
}

function linkDeCarta(nome) {
  return el(
    "a",
    { href: linkLigaMagic(nome), target: "_blank", rel: "noopener" },
    nome,
  );
}

// Lista "Carta (R$ 1,00), Outra (R$ 2,00)". Preço nulo significa que a carta saiu do Standard.
function listaDeMudancas(classe, rotulo, itens) {
  const linha = el(
    "div",
    {},
    el("span", { className: classe }, `${rotulo} (${itens.length}):`),
    " ",
  );
  itens.forEach(([nome, preco], posicao) => {
    if (posicao > 0) linha.append(", ");
    const valor =
      preco === null
        ? "saiu do Standard"
        : formatarPreco(paraCentavos(preco));
    linha.append(linkDeCarta(nome), ` (${valor})`);
  });
  return linha;
}

function desenharMudancas({ atualizado, log = [] }) {
  if (atualizado) $("consulta").textContent = atualizado;
  novas = nomesNovos(log);
  if (log.length === 0) return;

  $("mudancas-titulo").textContent =
    `Mudanças na lista (última em ${log[0].data})`;
  $("mudancas-corpo").replaceChildren(
    ...log.map(({ data, entraram = [], sairam = [], nota }) => {
      const entrada = el("div", { className: "ent" }, el("h4", {}, data));
      if (entraram.length > 0) {
        entrada.append(listaDeMudancas("in", "Entraram", entraram));
      }
      if (sairam.length > 0) {
        entrada.append(listaDeMudancas("outl", "Saíram", sairam));
      }
      if (nota) entrada.append(el("div", {}, nota));
      return entrada;
    }),
  );
  $("mudancas").hidden = false;
}

function ligarControles() {
  const selecaoPreco = $("preco");
  selecaoPreco.replaceChildren(
    ...FAIXAS_DE_PRECO.map((centavos) =>
      el(
        "option",
        { value: String(centavos) },
        `Até ${formatarPreco(centavos)}`,
      ),
    ),
  );
  selecaoPreco.value = String(estado.precoMax);
  selecaoPreco.addEventListener("change", (evento) => {
    estado.precoMax = Number(evento.target.value);
    atualizar();
  });

  $("ordem").value = estado.ordem;
  $("ordem").addEventListener("change", (evento) => {
    estado.ordem = evento.target.value;
    atualizar();
  });

  $("busca").addEventListener("input", (evento) => {
    estado.busca = evento.target.value;
    visiveis = CARTAS_POR_VEZ;
    filtrarEDesenhar();
  });

  $("mais").addEventListener("click", mostrarMais);
  new IntersectionObserver(
    ([entrada]) => {
      if (entrada.isIntersecting && !$("mais").hidden) mostrarMais();
    },
    { rootMargin: "600px" },
  ).observe($("mais"));

  const detalhe = $("detalhe");
  $("detalhe-fechar").addEventListener("click", () => detalhe.close());
  detalhe.addEventListener("click", (evento) => {
    if (evento.target === detalhe) detalhe.close();
  });
}

async function iniciar() {
  ligarControles();
  desenharChips();

  const [respostaCartas, respostaMudancas] = await Promise.allSettled([
    fetch("cards.json").then((resposta) => {
      if (!resposta.ok) throw new Error(`cards.json: ${resposta.status}`);
      return resposta.json();
    }),
    fetch("rotacao.json").then((resposta) => {
      if (!resposta.ok) throw new Error(`rotacao.json: ${resposta.status}`);
      return resposta.json();
    }),
  ]);

  // O histórico é opcional: sem ele a lista continua funcionando.
  if (respostaMudancas.status === "fulfilled") {
    desenharMudancas(respostaMudancas.value);
  }

  if (respostaCartas.status === "rejected") {
    $("saida").replaceChildren(
      el(
        "p",
        { className: "empty" },
        "Não foi possível carregar a lista. Recarregue a página.",
      ),
    );
    return;
  }

  cartas = montarCartas(respostaCartas.value);
  atualizar();
}

iniciar();
