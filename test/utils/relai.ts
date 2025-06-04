import axios from "axios";
import { execaNode } from "execa";
import type { ResultPromise } from "execa";

export class RelaiTest {
  port: number;
  canauxDéfaut?: string[];

  processus?: ResultPromise;
  constructor({
    port,
    canauxDéfaut,
  }: {
    port: number;
    canauxDéfaut?: string[];
  }) {
    this.port = port;
    this.canauxDéfaut = canauxDéfaut;
  }

  async lancer() {
    this.processus = execaNode({
      env: {
        PORT: this.port.toString(),
        CANAUX_DÉFAUT: this.canauxDéfaut
          ? JSON.stringify(this.canauxDéfaut)
          : undefined,
      },
    })`./dist/test/utils/binRelai.js`;

    this.processus.stderr?.on("data", (d) => {
      console.warn(d.toString());
    });
    this.processus.stdout?.on("data", (d) => {
      console.log(d.toString());
    });
    await new Promise((résoudre) => setTimeout(résoudre, 3000));
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
