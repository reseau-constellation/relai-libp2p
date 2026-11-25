import type { GossipSub } from "@libp2p/gossipsub";
import type { Identify } from "@libp2p/identify";
import type { Libp2p } from "libp2p";

export type Libp2pTest = Libp2p<{
  identify: Identify;
  pubsub: GossipSub;
}>;
