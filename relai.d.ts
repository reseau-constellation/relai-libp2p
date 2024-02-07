import type { PeerId, Libp2p } from "@libp2p/interface";
export declare const obtIdPairRelai: () => Promise<PeerId | undefined>;
export declare const créerNœud: () => Promise<Libp2p<{
    identify: import("@libp2p/identify").Identify;
    relay: import("@libp2p/circuit-relay-v2").CircuitRelayService;
}>>;
export declare const obtAdressesNœud: (nœud: Libp2p) => string[];
