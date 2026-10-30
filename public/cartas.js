// Lógica pura da lista de cartas: sem DOM, para rodar no navegador e nos testes.
// Preços circulam sempre em centavos (inteiros) e só viram texto em formatarPreco.

export const GRUPOS = [
  { codigo: "W", nome: "Branco", cor: "--w" },
  { codigo: "U", nome: "Azul", cor: "--u" },
  { codigo: "B", nome: "Preto", cor: "--b" },
  { codigo: "R", nome: "Vermelho", cor: "--r" },
  { codigo: "G", nome: "Verde", cor: "--g" },
  { codigo: "M", nome: "Multicolorida", cor: "--m" },
  { codigo: "A", nome: "Incolor", cor: "--a" },
  { codigo: "L", nome: "Terrenos", cor: "--l" },
];

export const TIPOS = [
  { codigo: "C", nome: "Criatura" },
  { codigo: "I", nome: "Instantânea" },
  { codigo: "S", nome: "Feitiço" },
  { codigo: "E", nome: "Encantamento" },
  { codigo: "A", nome: "Artefato" },
  { codigo: "P", nome: "Planeswalker" },
  { codigo: "L", nome: "Terreno" },
];

export const FAIXAS_DE_PRECO = [200, 100, 50, 25, 10];

export const ORDENS = ["cor", "barato", "caro"];

export const CARTAS_NOS_SPRITES = 4170;
const CARTAS_POR_FOLHA = 25;
const COLUNAS_POR_FOLHA = 5;

const formatoBRL = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export function paraCentavos(reais) {
  return Math.round(reais * 100);
}

export function formatarPreco(centavos) {
  return formatoBRL.format(centavos / 100);
}

export function nomeDoGrupo(codigo) {
  return GRUPOS.find((grupo) => grupo.codigo === codigo)?.nome ?? "";
}

export function nomeDoTipo(codigo) {
  return TIPOS.find((tipo) => tipo.codigo === codigo)?.nome ?? "Outro";
}

// "hob N" vira "HOB Normal". N e L são preço de carta normal; o resto é algum foil.
export function formatarVersao(versao) {
  if (!versao) return "";
  const [edicao, acabamento] = versao.split(" ");
  const nome = acabamento === "N" || acabamento === "L" ? "Normal" : "Foil";
  return `${edicao.toUpperCase()} ${nome}`;
}

function normalizar(texto) {
  return texto
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

export function montarCartas(linhas) {
  return linhas.map(([nome, preco, tipo, grupo, imagem, versao], indice) => ({
    indice,
    nome,
    nomeNormalizado: normalizar(nome),
    centavos: paraCentavos(preco),
    tipo,
    grupo,
    imagem,
    versao: formatarVersao(versao),
  }));
}

export function filtrarCartas(cartas, { busca, precoMax, grupos, tipos }) {
  const termo = normalizar(busca.trim());
  return cartas.filter(
    (carta) =>
      carta.centavos <= precoMax &&
      (grupos.size === 0 || grupos.has(carta.grupo)) &&
      (tipos.size === 0 || tipos.has(carta.tipo)) &&
      (termo === "" || carta.nomeNormalizado.includes(termo)),
  );
}

// "cor" mantém a ordem do arquivo, que já vem por grupo e nome.
export function ordenarCartas(cartas, ordem) {
  const copia = [...cartas];
  if (ordem === "barato") {
    copia.sort((a, b) => a.centavos - b.centavos || a.indice - b.indice);
  } else if (ordem === "caro") {
    copia.sort((a, b) => b.centavos - a.centavos || a.indice - b.indice);
  }
  return copia;
}

// Onde a imagem de uma carta está: arquivo próprio (n/*.jpg) ou célula de uma folha de sprites.
export function localDaImagem(imagem) {
  if (typeof imagem === "string") return { arquivo: imagem };

  const folha = Math.floor(imagem / CARTAS_POR_FOLHA);
  const celula = imagem % CARTAS_POR_FOLHA;
  const cartasNaFolha = Math.min(
    CARTAS_POR_FOLHA,
    CARTAS_NOS_SPRITES - folha * CARTAS_POR_FOLHA,
  );
  const linhas = Math.ceil(cartasNaFolha / COLUNAS_POR_FOLHA);
  const coluna = celula % COLUNAS_POR_FOLHA;
  const linha = Math.floor(celula / COLUNAS_POR_FOLHA);

  return {
    arquivo: `h/${String(folha).padStart(3, "0")}.webp`,
    x: (coluna / (COLUNAS_POR_FOLHA - 1)) * 100,
    y: linhas > 1 ? (linha / (linhas - 1)) * 100 : 0,
  };
}

export function linkLigaMagic(nome) {
  return `https://www.ligamagic.com.br/?view=cards/card&card=${encodeURIComponent(nome)}`;
}

export function linkScryfall(nome) {
  return `https://scryfall.com/search?q=${encodeURIComponent(`!"${nome}"`)}`;
}

// Só a entrada mais recente do log marca cartas como "nova".
export function nomesNovos(log) {
  return new Set((log[0]?.entraram ?? []).map(([nome]) => nome));
}

// Devolve só valores válidos: o que está salvo no navegador pode ser antigo ou ter sido editado.
export function lerFiltrosSalvos(texto) {
  const padrao = {
    precoMax: FAIXAS_DE_PRECO[0],
    ordem: ORDENS[0],
    grupos: new Set(),
    tipos: new Set(),
  };

  let salvo;
  try {
    salvo = JSON.parse(texto);
  } catch {
    return padrao;
  }
  if (salvo === null || typeof salvo !== "object") return padrao;

  const lista = (valor) => (Array.isArray(valor) ? valor : []);
  return {
    precoMax: FAIXAS_DE_PRECO.includes(salvo.precoMax)
      ? salvo.precoMax
      : padrao.precoMax,
    ordem: ORDENS.includes(salvo.ordem) ? salvo.ordem : padrao.ordem,
    grupos: new Set(
      lista(salvo.grupos).filter((c) => GRUPOS.some((g) => g.codigo === c)),
    ),
    tipos: new Set(
      lista(salvo.tipos).filter((c) => TIPOS.some((t) => t.codigo === c)),
    ),
  };
}
