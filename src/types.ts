import type { GossipSub } from "@libp2p/gossipsub";
import type { RPC } from "@libp2p/gossipsub/message";
import type { PeerId } from "@libp2p/interface";

export type GossipSubAvecRPC = GossipSub & {
  handleReceivedRpc: (from: PeerId, rpc: RPC) => Promise<void>;
};
