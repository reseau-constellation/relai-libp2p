import { GossipSub } from "@chainsafe/libp2p-gossipsub";
import PQueue from "p-queue";

const uniques = <T>(x: T[]): T[] => [...new Set(x)];

const mettreAbonnementsÀJour = ({
  pubsub,
  requêtes,
  nouveauxSujetsPair,
  idPair,
  toujoursRelayer,
}: {
  pubsub: GossipSub;
  requêtes: { [idPair: string]: string[] };
  nouveauxSujetsPair: string[];
  idPair: string;
  toujoursRelayer: string[];
}) => {
  // const sujetsDavant = uniques(Object.values(requêtes).flat());
  requêtes[idPair] = nouveauxSujetsPair;
  const sujetsMaintenant = uniques(Object.values(requêtes).flat());
  // On peut se (r)abonner à tout, parce que GossipSub filtre les sujets auxquels on est déjà abonnés
  sujetsMaintenant.forEach((s) => pubsub.subscribe(s));
  /*const désabonnements = sujetsDavant.filter(
    (s) => !sujetsMaintenant.includes(s) && !toujoursRelayer.includes(s),
  );
  désabonnements.forEach((s) => pubsub.unsubscribe(s));*/

  // console.log({ sujetsMaintenant, désabonnements });
};

export const relayerPubsub = async ({
  pubsub,
  toujoursRelayer = [],
}: {
  pubsub: GossipSub;
  toujoursRelayer?: string[];
}) => {
  const requêtesPairs: { [idPair: string]: string[] } = {};
  const queue = new PQueue({ concurrency: 1 });

  // À faire : garder compte des requêtes par pair et désabonner lorsque plus nécessaire
  const fonctionAvant = pubsub.handleReceivedRpc.bind(pubsub);

  const fonctionAprès = (
    ...args: Parameters<GossipSub["handleReceivedRpc"]>
  ) => {
    const sujets = args[1].subscriptions
      .filter((s) => s.subscribe && s.topic)
      .map((s) => s.topic!);

    queue.add(() =>
      mettreAbonnementsÀJour({
        pubsub,
        requêtes: requêtesPairs,
        nouveauxSujetsPair: sujets,
        idPair: args[0].toCID().toString(),
        toujoursRelayer,
      }),
    );

    args[1].subscriptions.forEach((s) => {
      if (s.subscribe && s.topic) {
        pubsub.subscribe(s.topic);
      }
    });

    return fonctionAvant(...args);
  };

  pubsub.handleReceivedRpc = fonctionAprès.bind(pubsub.handleReceivedRpc);

  const fonctionStopAvant = pubsub.stop.bind(pubsub);
  const fonctionStopAprès = async () => {
    await queue.onIdle();
    await fonctionStopAvant();
  };
  pubsub.stop = fonctionStopAprès.bind(pubsub.stop);
};
