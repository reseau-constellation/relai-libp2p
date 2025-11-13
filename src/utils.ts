import { GossipSub } from "@chainsafe/libp2p-gossipsub";
import { Libp2p, PeerId } from "@libp2p/interface";
import PQueue from "p-queue";

const uniques = <T>(x: T[]): T[] => [...new Set(x)];

export const relayerPubsub = async ({
  nœud,
  toujoursRelayer = [],
}: {
  nœud: Libp2p<{ pubsub: GossipSub }>;
  toujoursRelayer?: string[];
}) => {
  const pubsub = nœud.services.pubsub;

  const requêtes: { [idPair: string]: Set<string> } = {};
  const queue = new PQueue({ concurrency: 1 });

  const fFinale = () => {
    const sujetsDavant = pubsub.getTopics();
    const sujetsMaintenant = uniques(
      Object.values(requêtes)
        .map((r) => [...r])
        .flat(),
    );

    // On peut se (r)abonner à tout, parce que GossipSub filtre les sujets auxquels on est déjà abonnés
    sujetsMaintenant.forEach((s) => pubsub.subscribe(s));

    const désabonnements = sujetsDavant.filter(
      (s) => !sujetsMaintenant.includes(s) && !toujoursRelayer.includes(s),
    );
    désabonnements.forEach((s) => pubsub.unsubscribe(s));
  };

  const gérerPairDéconnecté = (é: CustomEvent<PeerId>) => {
    delete requêtes[é.detail.toString()];
    queue.add(fFinale);
  };
  const handleReceivedRpcAvant = pubsub.handleReceivedRpc.bind(pubsub);
  const handleReceivedRpcAprès = async (
    ...args: Parameters<GossipSub["handleReceivedRpc"]>
  ) => {
    const [idPair, rpc] = args;
    if (rpc.subscriptions.length) {
      // Ignorer les messages qui ne changent pas les abonnements
      const idPairChaîne = idPair.toString();

      if (!requêtes[idPairChaîne]) requêtes[idPairChaîne] = new Set();

      const messagesAvecSujet = rpc.subscriptions.filter((s) => s.topic);
      const abonnements = messagesAvecSujet
        .filter((s) => s.subscribe)
        .map((s) => s.topic!);
      abonnements.forEach((a) => requêtes[idPairChaîne].add(a));

      const désabonnements = messagesAvecSujet
        .filter((s) => s.subscribe === false)
        .map((s) => s.topic!);

      désabonnements.forEach((d) => requêtes[idPair.toString()].delete(d));
      queue.add(fFinale);
    }
    await queue.onIdle();
    return await handleReceivedRpcAvant(...args);
  };
  pubsub.handleReceivedRpc = handleReceivedRpcAprès.bind(pubsub);

  nœud.addEventListener("peer:disconnect", gérerPairDéconnecté);

  const fonctionStopAvant = pubsub.stop.bind(pubsub);
  const fonctionStopAprès = async () => {
    nœud.removeEventListener("peer:disconnect", gérerPairDéconnecté);
    await queue.onIdle();
    await fonctionStopAvant();
  };
  pubsub.stop = fonctionStopAprès.bind(pubsub.stop);
};
