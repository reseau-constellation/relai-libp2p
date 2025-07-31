import { createLibp2p } from "libp2p";
import { CANAUX_DÉCOUVERTE_PAIRS_TEST, PORT_SERVEUR_TEST } from "./consts.js";
import { RelaiTest } from "./relai.js";
import type { Libp2pTest } from "./types";
import { bootstrap } from "@libp2p/bootstrap";
import { pubsubPeerDiscovery } from "@libp2p/pubsub-peer-discovery";
import { DefaultLibp2pOptions } from "./libp2p.js";

export const préparerTest = ({
  nPairs,
}: {
  nPairs: number;
}): { pairs: Libp2pTest[]; relai: RelaiTest; fermer: () => Promise<void> } => {
  const fermer = async () => {
    const { pairs, relai } = composantes;
    await Promise.all(pairs.map((p) => p.stop()));
    await relai.fermer();
  };

  const composantes: {
    pairs: Libp2pTest[];
    relai: RelaiTest;
    fermer: () => Promise<void>;
  } = {
    pairs: [],
    relai: new RelaiTest({
      port: Number(PORT_SERVEUR_TEST),
      canauxDéfaut: ["canal défaut"],
      canauxDécouvertePairs: CANAUX_DÉCOUVERTE_PAIRS_TEST,
    }),
    fermer,
  };

  before(async () => {
    await composantes.relai.lancer();
    for (const _ of Array(nPairs)) {
      const pair = await createLibp2p({
        ...DefaultLibp2pOptions,
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
      pair.addEventListener("peer:discovery", (p) => {
        try {
          pair.dial(p.detail.multiaddrs);
        } catch {
          // rien à faire
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

export const que = <T>(
  f: () => T | Promise<T>,
  condition: (arg: T) => boolean,
): Promise<T> => {
  return new Promise((résoudre) => {
    const vérifier = async () => {
      const x = await f();
      if (condition(x)) {
        clearTimeout(crono);
        résoudre(x);
      }
    };
    const crono = setInterval(vérifier, 100);
    vérifier();
  });
};
