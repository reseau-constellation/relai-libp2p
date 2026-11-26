import { createLibp2p } from "libp2p";
import { CANAUX_DÉCOUVERTE_PAIRS_TEST } from "./consts.ts";
import { CommunicationRelaiTest } from "./communicationRelai.ts";
import type { Libp2pTest } from "./types.ts";
import { bootstrap } from "@libp2p/bootstrap";
import { pubsubPeerDiscovery } from "@libp2p/pubsub-peer-discovery";
import { DefaultBrowserLibp2pOptions, DefaultLibp2pOptions } from "./libp2p.ts";
import { PORT_SERVEUR_DÉFAUT } from "../../src/const.ts";
import { isBrowser } from "wherearewe";

export type ComposantesTestRelai = {
  pairs: Libp2pTest[];
  relai: CommunicationRelaiTest;
  fermer: () => Promise<void>;
};

export const préparerTest = ({
  nPairs,
}: {
  nPairs: number;
}): ComposantesTestRelai => {
  const fermer = async () => {
    const { pairs } = composantes;
    await Promise.all(pairs.map((p) => p.stop()));
  };

  const composantes: ComposantesTestRelai = {
    pairs: [],
    relai: new CommunicationRelaiTest({
      portServeur: PORT_SERVEUR_DÉFAUT,
    }),
    fermer,
  };

  before(async () => {
    for (const _ of Array(nPairs)) {
      const pair = await createLibp2p({
        ...(isBrowser ? DefaultBrowserLibp2pOptions : DefaultLibp2pOptions),
        peerDiscovery: [
          bootstrap({
            list: await composantes.relai.adresses(),
            timeout: 0,
          }),
          pubsubPeerDiscovery({
            interval: 100,
            topics: CANAUX_DÉCOUVERTE_PAIRS_TEST,
            listenOnly: false,
          }),
        ],
      });
      pair.addEventListener("peer:discovery", async (p) => {
        try {
          await pair.dial(p.detail.id);
        } catch (e) {
          console.log("Erreur connexion pairs : ", e, p.detail);
        }
      });
      composantes.pairs.push(pair);
    }
  });

  after(async () => {
    await fermer();
  });

  return composantes;
};

export const que = async <T>(
  f: () => T | Promise<T>,
  condition: (arg: T) => boolean,
  t = 50,
): Promise<T> => {
  let chrono: ReturnType<typeof setTimeout> | undefined = undefined;
  return new Promise<T>((résoudre, rejeter) => {
    const fFinale = async () => {
      try {
        const retour = await f();

        if (condition(retour)) {
          clearTimeout(chrono);
          résoudre(retour);
        } else {
          t *= 1.5;
          chrono = setTimeout(fFinale, t);
        }
      } catch (e) {
        clearTimeout(chrono);
        rejeter(e);
      }
    };
    fFinale();
  });
};
