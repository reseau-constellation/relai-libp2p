import { GossipSub } from "@chainsafe/libp2p-gossipsub";
import { Libp2p, PeerId, SubscriptionChangeData } from "@libp2p/interface";
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

  const requêtes: { [idPair: string]: string[] } = {};
  const queue = new PQueue({ concurrency: 1 });

  const fFinale = () => {
    const sujetsDavant = pubsub.getTopics();
    const sujetsMaintenant = uniques(Object.values(requêtes).flat());

    // On peut se (r)abonner à tout, parce que GossipSub filtre les sujets auxquels on est déjà abonnés
    sujetsMaintenant.forEach((s) => pubsub.subscribe(s));

    const désabonnements = sujetsDavant.filter(
      (s) => !sujetsMaintenant.includes(s) && !toujoursRelayer.includes(s),
    );
    désabonnements.forEach((s) => pubsub.unsubscribe(s));
  };

  const gérerChangementAbonnement = ({
    detail,
  }: {
    detail: SubscriptionChangeData;
  }) => {
    requêtes[detail.peerId.toString()] = detail.subscriptions
      .filter((s) => s.subscribe)
      .map((s) => s.topic);

    queue.add(fFinale);
  };

  const gérerPairDéconnecté = (é: CustomEvent<PeerId>) => {
    delete requêtes[é.detail.toString()];
    queue.add(fFinale);
  };

  pubsub.addEventListener("subscription-change", gérerChangementAbonnement);
  nœud.addEventListener("peer:disconnect", gérerPairDéconnecté);

  const fonctionStopAvant = pubsub.stop.bind(pubsub);
  const fonctionStopAprès = async () => {
    pubsub.removeEventListener(
      "subscription-change",
      gérerChangementAbonnement,
    );
    nœud.removeEventListener("peer:disconnect", gérerPairDéconnecté);
    await queue.onIdle();
    await fonctionStopAvant();
  };
  pubsub.stop = fonctionStopAprès.bind(pubsub.stop);
};
