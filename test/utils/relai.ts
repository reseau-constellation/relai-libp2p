import axios from "axios";
import { execaNode } from "execa";
import type { ResultPromise } from "execa";

export class RelaiTest {
  port: number;
  processus?: ResultPromise;
  constructor({ port }: { port: number }) {
    this.port = port;
  }

  async lancer() {
    this.processus = execaNode({
      env: { PORT: this.port.toString() },
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
  async pairs(): Promise<string[]> {
    const réponse = await axios.get(`http://localhost:${this.port}/pairs`);
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
