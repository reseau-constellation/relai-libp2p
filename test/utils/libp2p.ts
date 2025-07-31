import {
  gossipsub,
  GossipSubComponents,
  GossipSub,
} from "@chainsafe/libp2p-gossipsub";
import { noise } from "@chainsafe/libp2p-noise";
import { yamux } from "@chainsafe/libp2p-yamux";
import { circuitRelayTransport } from "@libp2p/circuit-relay-v2";
import { Identify, identify } from "@libp2p/identify";
import { webRTC } from "@libp2p/webrtc";
import { webSockets } from "@libp2p/websockets";
import type { Libp2pOptions } from "libp2p";

export const DefaultLibp2pOptions: Libp2pOptions<{
  identify: Identify;
  pubsub: GossipSub;
}> = {
  addresses: {
    listen: ["/ip4/0.0.0.0/tcp/0/ws", "/p2p-circuit"],
  },
  transports: [webSockets(), webRTC(), circuitRelayTransport()],
  connectionEncrypters: [noise()],
  streamMuxers: [yamux()],
  connectionGater: {
    denyDialMultiaddr: () => false,
  },
  services: {
    identify: identify(),
    pubsub: gossipsub({ allowPublishToZeroTopicPeers: true }) as (
      components: GossipSubComponents,
    ) => GossipSub, // Erreur de type dans @chainsafe/pubsub
  },
};
