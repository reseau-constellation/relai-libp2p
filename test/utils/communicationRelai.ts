import axios from "axios";

export class CommunicationRelaiTest {
  portServeur: number;

  constructor({ portServeur }: { portServeur: number }) {
    this.portServeur = portServeur;
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
}
