import { GossipSub } from "@libp2p/gossipsub";
import { RPC } from "@libp2p/gossipsub/message";
import { PeerId } from "@libp2p/interface";

export type GossipSubAvecRPC = GossipSub & {
  handleReceivedRpc: (from: PeerId, rpc: RPC) => Promise<void>;
};
