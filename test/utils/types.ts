import { GossipSub } from "@chainsafe/libp2p-gossipsub";
import { Identify } from "@libp2p/identify";
import { Libp2p } from "libp2p";

export type Libp2pTest = Libp2p<{
  identify: Identify;
  pubsub: GossipSub;
}>;
