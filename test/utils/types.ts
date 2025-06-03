import { GossipSub } from "@chainsafe/libp2p-gossipsub";
import { Libp2p } from "libp2p";

export type Libp2pTest = Libp2p<{
  pubsub: GossipSub;
}>;
