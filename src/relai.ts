import { noise } from "@chainsafe/libp2p-noise";
import { yamux } from "@chainsafe/libp2p-yamux";
import { circuitRelayServer } from "@libp2p/circuit-relay-v2";
import { identify } from "@libp2p/identify";
import { webSockets } from "@libp2p/websockets";
import { unmarshalPrivateKey } from "@libp2p/crypto/keys";
import { createFromPrivKey } from "@libp2p/peer-id-factory";
import { createLibp2p } from "libp2p";
import { PeerId, Libp2p } from "@libp2p/interface";
import {
  fromString as uint8ArrayFromString,
  toString as uint8ArrayToString,
} from "uint8arrays";
import fs from "fs";

export const obtClefPrivéeRelai = async (): Promise<PeerId | undefined> => {
  // output of: console.log(server.peerId.privateKey.toString('hex'))
  // "08011240821cb6bc3d4547fcccb513e82e4d718089f8a166b23ffcd4a436754b6b0774cf07447d1693cd10ce11ef950d7517bad6e9472b41a927cd17fc3fb23f8c70cd99"
  const relayPrivKey = process.env.CLEF_PRIVEE_RELAI;
  if (relayPrivKey) {
    // the peer id of the above key
    // const relayId = '12D3KooWAJjbRkp8FPF5MKgMU53aUTxWkqvDrs4zc1VMbwRwfsbE'
    const encoded = uint8ArrayFromString(relayPrivKey, "hex");
    const privateKey = await unmarshalPrivateKey(encoded);
    const peerId = await createFromPrivKey(privateKey);
    return peerId;
  }
  return undefined;
};

export const créerNœud = async () => {
  const peerId = await obtClefPrivéeRelai();
  const nœud = await createLibp2p({
    peerId,
    addresses: {
      listen: ["/ip4/0.0.0.0/tcp/0/ws"],
      // TODO check "What is next?" section
      // announce: ['/dns4/auto-relay.libp2p.io/tcp/443/wss/p2p/QmWDn2LY8nannvSWJzruUYoLZ4vV83vfCBwd8DipvdgQc3']
    },
    transports: [webSockets()],
    connectionEncryption: [noise()],
    streamMuxers: [yamux()],
    services: {
      identify: identify(),
      relay: circuitRelayServer(),
    },
  });
  if (!peerId) {
    const clefPrivéeRelai = uint8ArrayToString(nœud.peerId!.privateKey!, "hex");
    console.log(uint8ArrayToString(nœud.peerId!.privateKey!, "hex"));
    fs.writeFileSync(".env", `CLEF_PRIVEE_RELAI=${clefPrivéeRelai}`);
  }
  return nœud;
};

export const obtAdressesNœud = (nœud: Libp2p): string[] => {
  console.log(`Node started with id ${nœud.peerId.toString()}`);
  console.log(
    "Listening on: ",
    nœud.getMultiaddrs().map((ma) => ma.toString()),
  );
  return nœud.getMultiaddrs().map((ma) => ma.toString());
  // generates a deterministic address: /ip4/127.0.0.1/tcp/33519/ws/p2p/12D3KooWAJjbRkp8FPF5MKgMU53aUTxWkqvDrs4zc1VMbwRwfsbE
};
