import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { describe, it } from "node:test";

import {
  CARTAS_NOS_SPRITES,
  GRUPOS,
  TIPOS,
  localDaImagem,
  paraCentavos,
} from "../public/cartas.js";

const publico = new URL("../public/", import.meta.url);
const lerJson = (arquivo) =>
  JSON.parse(readFileSync(new URL(arquivo, publico), "utf8"));

const linhas = lerJson("cards.json");

describe("cards.json", () => {
  it("tem todas as cartas com preço de até R$ 2,00", () => {
    for (const [nome, preco] of linhas) {
      const centavos = paraCentavos(preco);
      assert.ok(centavos > 0 && centavos <= 200, `${nome}: ${preco}`);
      assert.ok(Math.abs(preco * 100 - centavos) < 1e-6, `${nome}: ${preco}`);
    }
  });

  it("usa apenas tipos e grupos conhecidos", () => {
    const grupos = new Set(GRUPOS.map(({ codigo }) => codigo));
    const tipos = new Set([...TIPOS.map(({ codigo }) => codigo), "O"]);
    for (const [nome, , tipo, grupo] of linhas) {
      assert.ok(tipos.has(tipo), `${nome}: tipo ${tipo}`);
      assert.ok(grupos.has(grupo), `${nome}: grupo ${grupo}`);
    }
  });

  it("não repete nomes", () => {
    const vistos = new Set(linhas.map(([nome]) => nome.toLowerCase()));
    assert.equal(vistos.size, linhas.length);
  });

  it("aponta para imagens que existem no projeto", () => {
    for (const [nome, , , , imagem] of linhas) {
      if (typeof imagem === "number") {
        assert.ok(imagem >= 0 && imagem < CARTAS_NOS_SPRITES, nome);
      }
      const { arquivo } = localDaImagem(imagem);
      assert.ok(existsSync(new URL(arquivo, publico)), `${nome}: ${arquivo}`);
    }
  });
});

describe("rotacao.json", () => {
  it("só marca como nova carta que está na lista", () => {
    const { log } = lerJson("rotacao.json");
    const nomes = new Set(linhas.map(([nome]) => nome.toLowerCase()));
    for (const [nome] of log[0].entraram) {
      assert.ok(nomes.has(nome.toLowerCase()), nome);
    }
  });
});
