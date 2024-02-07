import { noise } from "@chainsafe/libp2p-noise";
import { yamux } from "@chainsafe/libp2p-yamux";
import { circuitRelayServer } from "@libp2p/circuit-relay-v2";
import { identify } from "@libp2p/identify";
import { webSockets } from "@libp2p/websockets";
import { webRTC, webRTCDirect } from "@libp2p/webrtc";
import { webTransport } from "@libp2p/webtransport";
import { tcp } from "@libp2p/tcp";
import { unmarshalPrivateKey } from "@libp2p/crypto/keys";
import { createFromPrivKey } from "@libp2p/peer-id-factory";
import { createLibp2p } from "libp2p";
import { fromString as uint8ArrayFromString, toString as uint8ArrayToString, } from "uint8arrays";
import fs from "fs";
export const obtIdPairRelai = async () => {
    // Clef privée obtenue avec: console.log(server.peerId.privateKey.toString('hex'))
    // exemple : "08011240821cb6bc3d4547fcccb513e82e4d718089f8a166b23ffcd4a436754b6b0774cf07447d1693cd10ce11ef950d7517bad6e9472b41a927cd17fc3fb23f8c70cd99"
    const relayPrivKey = process.env.CLEF_PRIVEE_RELAI;
    if (relayPrivKey) {
        // L'identité de pair qui correspond à la clef privée ci-dessus
        // exemple : '12D3KooWAJjbRkp8FPF5MKgMU53aUTxWkqvDrs4zc1VMbwRwfsbE'
        const encoded = uint8ArrayFromString(relayPrivKey, "hex");
        const privateKey = await unmarshalPrivateKey(encoded);
        const peerId = await createFromPrivKey(privateKey);
        return peerId;
    }
    return undefined;
};
export const créerNœud = async () => {
    const peerId = await obtIdPairRelai();
    const domaine = process.env.DOMAINE;
    const nœud = await createLibp2p({
        peerId,
        addresses: {
            listen: ["/ip4/0.0.0.0/tcp/0/ws"],
            announce: domaine
                ? [
                    `/dns4/${domaine}/tcp/443/wss/p2p/${peerId?.toString()}`,
                    `/dns4/${domaine}/tcp/80/ws/p2p/${peerId?.toString()}`,
                ]
                : undefined,
        },
        transports: [webSockets(), webRTC(), webRTCDirect(), webTransport(), tcp()],
        connectionEncryption: [noise()],
        streamMuxers: [yamux()],
        services: {
            identify: identify(),
            relay: circuitRelayServer(),
        },
    });
    if (!peerId) {
        const clefPrivéeRelai = uint8ArrayToString(nœud.peerId.privateKey, "hex");
        fs.writeFileSync(".env", `CLEF_PRIVEE_RELAI=${clefPrivéeRelai}`);
    }
    nœud.addEventListener("peer:discovery", () => {
        console.log("Pairs: ", nœud.getPeers());
    });
    return nœud;
};
export const obtAdressesNœud = (nœud) => {
    console.log(`Nœud lancé avec id : ${nœud.peerId.toString()}`);
    console.log("Le nœud écoute sur : ", nœud.getMultiaddrs().map((ma) => ma.toString()));
    setInterval(() => {
        console.log("Le nœud écoute sur : ", nœud.getMultiaddrs().map((ma) => ma.toString()));
    }, 10000);
    return nœud.getMultiaddrs().map((ma) => ma.toString());
    // generates a deterministic address: /ip4/127.0.0.1/tcp/33519/ws/p2p/12D3KooWAJjbRkp8FPF5MKgMU53aUTxWkqvDrs4zc1VMbwRwfsbE
};
//# sourceMappingURL=relai.js.map