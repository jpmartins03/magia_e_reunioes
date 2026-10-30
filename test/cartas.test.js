import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  CARTAS_NOS_SPRITES,
  filtrarCartas,
  formatarPreco,
  formatarVersao,
  lerFiltrosSalvos,
  linkLigaMagic,
  linkScryfall,
  localDaImagem,
  montarCartas,
  nomeDoTipo,
  nomesNovos,
  ordenarCartas,
  paraCentavos,
} from "../public/cartas.js";

const semFiltro = {
  busca: "",
  precoMax: 200,
  grupos: new Set(),
  tipos: new Set(),
};

const cartas = montarCartas([
  ["Fíli the Pathfinder", 1.98, "C", "M", 0, "ltr N"],
  ["Duress", 0.42, "S", "B", 1, "fdn L"],
  ["Rogue's Passage", 2.0, "L", "L", 2, "rtr F"],
  ["Flame Lash", 0.1, "I", "R", 3, "m15 N"],
  ["Shock", 0.42, "I", "R", 4, "fdn N"],
]);
const nomes = (lista) => lista.map((carta) => carta.nome);

describe("paraCentavos", () => {
  it("corrige a imprecisão do float ao converter", () => {
    assert.equal(paraCentavos(0.29), 29); // 0.29 * 100 = 28.999999999999996
    assert.equal(paraCentavos(1.1), 110); // 1.1 * 100 = 110.00000000000001
    assert.equal(paraCentavos(1.15), 115);
    assert.equal(paraCentavos(0.01), 1);
    assert.equal(paraCentavos(2), 200);
  });
});

describe("formatarPreco", () => {
  it("formata em reais com vírgula e dois decimais", () => {
    const semEspacoFixo = (texto) => texto.replace(/\s/g, " ");
    assert.equal(semEspacoFixo(formatarPreco(1)), "R$ 0,01");
    assert.equal(semEspacoFixo(formatarPreco(10)), "R$ 0,10");
    assert.equal(semEspacoFixo(formatarPreco(200)), "R$ 2,00");
  });
});

describe("formatarVersao", () => {
  it("traduz o acabamento da edição", () => {
    assert.equal(formatarVersao("hob N"), "HOB Normal");
    assert.equal(formatarVersao("fdn L"), "FDN Normal");
    assert.equal(formatarVersao("protj F"), "PROTJ Foil");
    assert.equal(formatarVersao("dft 3"), "DFT Foil");
  });

  it("devolve vazio quando não há versão", () => {
    assert.equal(formatarVersao(""), "");
    assert.equal(formatarVersao(undefined), "");
  });
});

describe("nomeDoTipo", () => {
  it("usa Outro para código desconhecido", () => {
    assert.equal(nomeDoTipo("C"), "Criatura");
    assert.equal(nomeDoTipo("O"), "Outro");
  });
});

describe("filtrarCartas", () => {
  it("inclui a carta que custa exatamente o preço máximo", () => {
    const lista = filtrarCartas(cartas, { ...semFiltro, precoMax: 10 });
    assert.deepEqual(nomes(lista), ["Flame Lash"]);
  });

  it("exclui a carta um centavo acima do preço máximo", () => {
    const lista = filtrarCartas(cartas, { ...semFiltro, precoMax: 41 });
    assert.deepEqual(nomes(lista), ["Flame Lash"]);
  });

  it("mantém R$ 2,00 na faixa mais alta", () => {
    const lista = filtrarCartas(cartas, semFiltro);
    assert.ok(nomes(lista).includes("Rogue's Passage"));
  });

  it("combina cor e tipo", () => {
    const lista = filtrarCartas(cartas, {
      ...semFiltro,
      grupos: new Set(["R", "B"]),
      tipos: new Set(["I"]),
    });
    assert.deepEqual(nomes(lista), ["Flame Lash", "Shock"]);
  });

  it("busca sem diferenciar maiúsculas nem acentos", () => {
    for (const busca of ["fili", "FÍLI", "  fili the  "]) {
      const lista = filtrarCartas(cartas, { ...semFiltro, busca });
      assert.deepEqual(nomes(lista), ["Fíli the Pathfinder"]);
    }
  });
});

describe("ordenarCartas", () => {
  it("mantém a ordem do arquivo em por cor", () => {
    assert.deepEqual(nomes(ordenarCartas(cartas, "cor")), nomes(cartas));
  });

  it("desempata pelo arquivo nas mais baratas", () => {
    assert.deepEqual(nomes(ordenarCartas(cartas, "barato")), [
      "Flame Lash",
      "Duress",
      "Shock",
      "Fíli the Pathfinder",
      "Rogue's Passage",
    ]);
  });

  it("desempata pelo arquivo nas mais caras", () => {
    assert.deepEqual(nomes(ordenarCartas(cartas, "caro")), [
      "Rogue's Passage",
      "Fíli the Pathfinder",
      "Duress",
      "Shock",
      "Flame Lash",
    ]);
  });

  it("não altera a lista recebida", () => {
    const antes = nomes(cartas);
    ordenarCartas(cartas, "caro");
    assert.deepEqual(nomes(cartas), antes);
  });
});

describe("localDaImagem", () => {
  it("usa o arquivo próprio das cartas novas", () => {
    assert.deepEqual(localDaImagem("n/duress.jpg"), { arquivo: "n/duress.jpg" });
  });

  it("acha os cantos de uma folha cheia", () => {
    assert.deepEqual(localDaImagem(0), {
      arquivo: "h/000.webp",
      x: 0,
      y: 0,
    });
    assert.deepEqual(localDaImagem(24), {
      arquivo: "h/000.webp",
      x: 100,
      y: 100,
    });
  });

  it("passa para a folha seguinte na carta 25", () => {
    assert.deepEqual(localDaImagem(25), {
      arquivo: "h/001.webp",
      x: 0,
      y: 0,
    });
  });

  it("calcula a última folha, que tem menos linhas", () => {
    assert.deepEqual(localDaImagem(CARTAS_NOS_SPRITES - 1), {
      arquivo: "h/166.webp",
      x: 100,
      y: 100,
    });
  });
});

describe("links", () => {
  it("codificam nomes com apóstrofo, vírgula e espaço", () => {
    assert.equal(
      linkLigaMagic("Aang, the Last Airbender"),
      "https://www.ligamagic.com.br/?view=cards/card&card=Aang%2C%20the%20Last%20Airbender",
    );
    assert.equal(
      linkScryfall("Rogue's Passage"),
      "https://scryfall.com/search?q=!%22Rogue's%20Passage%22",
    );
  });
});

describe("nomesNovos", () => {
  it("considera só a entrada mais recente", () => {
    const log = [
      { entraram: [["Nova", 1]] },
      { entraram: [["Antiga", 1]] },
    ];
    assert.deepEqual(nomesNovos(log), new Set(["Nova"]));
  });

  it("aceita log vazio ou sem entradas", () => {
    assert.deepEqual(nomesNovos([]), new Set());
    assert.deepEqual(nomesNovos([{ sairam: [] }]), new Set());
  });
});

describe("lerFiltrosSalvos", () => {
  const padrao = {
    precoMax: 200,
    ordem: "cor",
    grupos: new Set(),
    tipos: new Set(),
  };

  it("usa o padrão sem nada salvo ou com JSON quebrado", () => {
    assert.deepEqual(lerFiltrosSalvos(null), padrao);
    assert.deepEqual(lerFiltrosSalvos("{quebrado"), padrao);
    assert.deepEqual(lerFiltrosSalvos("3"), padrao);
  });

  it("recupera os filtros válidos", () => {
    const salvo = JSON.stringify({
      precoMax: 50,
      ordem: "caro",
      grupos: ["W"],
      tipos: ["C"],
    });
    assert.deepEqual(lerFiltrosSalvos(salvo), {
      precoMax: 50,
      ordem: "caro",
      grupos: new Set(["W"]),
      tipos: new Set(["C"]),
    });
  });

  it("descarta valores inválidos", () => {
    const salvo = JSON.stringify({
      precoMax: 33,
      ordem: "x",
      grupos: ["Z", "W"],
      tipos: "C",
    });
    assert.deepEqual(lerFiltrosSalvos(salvo), {
      ...padrao,
      grupos: new Set(["W"]),
    });
  });
});
