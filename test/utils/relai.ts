import axios from "axios";
import { execaNode } from "execa";
import type { ResultPromise } from "execa";

export class RelaiTest {
  port: number;
  canauxDéfaut: string[];
  canauxDécouvertePairs: string[];

  processus?: ResultPromise;
  constructor({
    port,
    canauxDéfaut = [],
    canauxDécouvertePairs = [],
  }: {
    port: number;
    canauxDéfaut?: string[];
    canauxDécouvertePairs?: string[];
  }) {
    this.port = port;
    this.canauxDéfaut = [
      ...new Set([...canauxDéfaut, ...canauxDécouvertePairs]),
    ];
    this.canauxDécouvertePairs = canauxDécouvertePairs;
  }

  async lancer() {
    this.processus = execaNode({
      env: {
        PORT: this.port.toString(),
        CANAUX_DÉFAUT: JSON.stringify(this.canauxDéfaut),
        CANAUX_DÉCOUVERTE_PAIRS: JSON.stringify(this.canauxDécouvertePairs),
      },
    })`./dist/test/utils/binRelai.js`;
    const promessePrêt = new Promise<void>((résoudre) => {
      this.processus!.stdout?.on("data", (d) => {
        if (d.toString() === "prêt") résoudre();
      });
    });
    this.processus.stderr?.on("data", (d) => {
      console.warn(d.toString());
    });
    this.processus.stdout?.on("data", (d) => {
      if (d.toString() !== "prêt") console.log(d.toString());
    });
    await promessePrêt;
  }

  async abonnements(): Promise<string[]> {
    const réponse = await axios.get(`http://localhost:${this.port}/sujets`);
    return réponse.data;
  }
  async adresses(): Promise<string[]> {
    const réponse = await axios.get(`http://localhost:${this.port}/adresses`);
    return réponse.data;
  }
  async pairs({ sujet }: { sujet?: string } = {}): Promise<string[]> {
    const réponse = await axios.get(
      `http://localhost:${this.port}/pairs${sujet ? "?sujet=" + sujet : ""}`,
    );
    return réponse.data;
  }
  async connexions(): Promise<string[]> {
    const réponse = await axios.get(`http://localhost:${this.port}/connexions`);
    return réponse.data;
  }
  async fermer() {
    this.processus?.kill();
  }
}
