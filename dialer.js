import { createLibp2p } from "libp2p";
import { webSockets } from "@libp2p/websockets";
import { noise } from "@chainsafe/libp2p-noise";
import { mplex } from "@libp2p/mplex";
import { yamux } from "@chainsafe/libp2p-yamux";
const autoRelayNodeAddr = process.argv[2];
if (!autoRelayNodeAddr) {
    throw new Error("the auto relay node address needs to be specified");
}
const node = await createLibp2p({
    transports: [webSockets()],
    connectionEncryption: [noise()],
    streamMuxers: [yamux(), mplex()],
});
console.log(`Node started with id ${node.peerId.toString()}`);
// @ts-expect-error à faire
const conn = await node.dial(autoRelayNodeAddr);
console.log(`Connected to the auto relay node via ${conn.remoteAddr.toString()}`);
/*
You should now run the following to start the relay node using the listen address from step 2:

node dialer.js /ip4/192.168.1.120/tcp/61592/ws/p2p/QmWDn2LY8nannvSWJzruUYoLZ4vV83vfCBwd8DipvdgQc3

Once you start your test node, it should print out something similar to the following:

Node started: Qme7iEzDxFoFhhkrsrkHkMnM11aPYjysaehP4NZeUfVMKG
Connected to the auto relay node via /ip4/192.168.1.120/tcp/61592/ws/p2p/QmWDn2LY8nannvSWJzruUYoLZ4vV83vfCBwd8DipvdgQc3/p2p-circuit/p2p/QmerrWofKF358JE6gv3z74cEAyL7z1KqhuUoVfGEynqjRm
*/
//# sourceMappingURL=dialer.js.map