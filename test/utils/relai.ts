import axios from "axios";
import { execaNode } from "execa";
import type { ResultPromise } from "execa";
import { CODE_PRÊT } from "./consts.ts";

export class RelaiTest {
  portServeur: number;
  portLibp2p: number;

  canauxDéfaut: string[];
  canauxDécouvertePairs: string[];

  processus?: ResultPromise;
  constructor({
    portServeur,
    portLibp2p,
    canauxDéfaut = [],
    canauxDécouvertePairs = [],
  }: {
    portServeur: number;
    portLibp2p: number;
    canauxDéfaut?: string[];
    canauxDécouvertePairs?: string[];
  }) {
    this.portServeur = portServeur;
    this.portLibp2p = portLibp2p;

    this.canauxDéfaut = [
      ...new Set([...canauxDéfaut, ...canauxDécouvertePairs]),
    ];
    this.canauxDécouvertePairs = canauxDécouvertePairs;
  }

  async lancer() {
    this.processus = execaNode({
      env: {
        PORT: this.portServeur.toString(),
        PORT_LIBP2P: this.portLibp2p.toString(),
        CANAUX_DÉFAUT: JSON.stringify(this.canauxDéfaut),
        CANAUX_DÉCOUVERTE_PAIRS: JSON.stringify(this.canauxDécouvertePairs),
      },
    })`./dist/test/utils/binRelai.js`;

    this.processus.catch((e) => {
      if (!e.toString().includes("SIGTERM")) throw e;
    });

    const promessePrêt = new Promise<void>((résoudre) => {
      this.processus!.stdout?.on("data", (d) => {
        if (d.toString().includes(CODE_PRÊT)) résoudre();
      });
    });
    this.processus.stderr?.on("data", (d) => {
      console.warn(d.toString());
    });
    this.processus.stdout?.on("data", (d) => {
      if (!d.toString().includes(CODE_PRÊT)) console.log(d.toString());
    });
    await promessePrêt;
  }
  async abonnements(): Promise<string[]> {
    const réponse = await axios.get(
      `http://localhost:${this.portServeur}/sujets`,
    );
    return réponse.data;
  }
  async adresses(): Promise<string[]> {
    const réponse = await axios.get(
      `http://localhost:${this.portServeur}/adresses`,
    );
    return réponse.data;
  }
  async pairs({ sujet }: { sujet?: string } = {}): Promise<string[]> {
    const réponse = await axios.get(
      `http://localhost:${this.portServeur}/pairs${sujet ? "?sujet=" + sujet : ""}`,
    );
    return réponse.data;
  }
  async connexions(): Promise<string[]> {
    const réponse = await axios.get(
      `http://localhost:${this.portServeur}/connexions`,
    );
    return réponse.data;
  }
  async fermer() {
    this.processus?.kill();
  }
}
