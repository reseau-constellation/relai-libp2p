import { préparerTest, que } from "./utils/index.js";
import { expect } from "aegir/chai";
import { multiaddr } from "@multiformats/multiaddr";
import { RelaiTest } from "./utils/relai.js";
import { peerIdFromString } from "@libp2p/peer-id";

const obtIdRelai = async (relai: RelaiTest): Promise<string> => {
  const adressesRelai = await relai.adresses();
  const idRelai = multiaddr(adressesRelai[0]).getPeerId();
  if (!idRelai) throw new Error();
  return idRelai;
};

describe("Relai", function () {
  const composantes = préparerTest({ nPairs: 2 });
  it("Connexion au relai", async () => {
    const idRelai = await obtIdRelai(composantes.relai);

    const pairs1 = await que(
      () => composantes.pairs[0].getPeers(),
      (pairs) => pairs.length > 0,
    );
    expect(pairs1.map((p) => p.toString())).to.include(idRelai);

    const pairs2 = await que(
      () => composantes.pairs[1].getPeers(),
      (pairs) => pairs.length > 0,
    );
    expect(pairs2.map((p) => p.toString())).to.include(idRelai);
  });

  it("Connexions entre pairs", async () => {
    const idsPairs = composantes.pairs.map((p) => p.peerId.toString());
    const pairs1 = await que(
      () => composantes.pairs[0].getPeers(),
      (pairs) => pairs.length > 1,
    );
    const pairs2 = await que(
      () => composantes.pairs[1].getPeers(),
      (pairs) => pairs.length > 1,
    );

    expect(pairs1.map((p) => p.toString())).to.include(idsPairs[1]);
    expect(pairs2.map((p) => p.toString())).to.include(idsPairs[0]);
  });
  describe("Pubsub", function () {
    it("Relai automatiquement abonné aux sujets", async () => {
      const abonnementsAvant = await composantes.relai.abonnements();
      composantes.pairs[0].services.pubsub.subscribe("canal test");
      const abonnements = await que(
        () => composantes.relai.abonnements(),
        (a) => a.length > abonnementsAvant.length,
      );
      expect(abonnements).to.include("canal test");
    });

    it("Messages pubsub passent même si relai non explicitement abonné", async () => {
      let résultat: string | undefined = undefined;
      composantes.pairs[1].services.pubsub.addEventListener("message", (é) => {
        if (é.detail.topic === "canal test") {
          résultat = new TextDecoder().decode(é.detail.data);
        }
      });
      composantes.pairs[1].services.pubsub.subscribe("canal test");
      composantes.pairs[0].services.pubsub.publish(
        "canal test",
        new TextEncoder().encode("message test"),
      );
      const reçu = await que(
        () => résultat,
        (x) => !!x,
      );
      expect(reçu).to.equal("message test");
    });

    it("Relai automatiquement désabonné s'il n'y a plus de pairs abonnés", async () => {
      composantes.pairs[0].services.pubsub.unsubscribe("canal test");
      composantes.pairs[1].services.pubsub.unsubscribe("canal test");
      const abonnements = await que(
        () => composantes.relai.abonnements(),
        (a) => !a.includes("canal test"),
      );
      expect(abonnements).to.not.include("canal test");
    });

    it("Relai automatiquement désabonné si pairs abonnés sont déconnectés", async () => {
      composantes.pairs[0].services.pubsub.subscribe("canal test");
      const abonnements = await que(
        () => composantes.relai.abonnements(),
        (a) => a.includes("canal test"),
      );
      expect(abonnements).to.include("canal test");

      const idRelai = await obtIdRelai(composantes.relai);
      await composantes.pairs[0].hangUp(peerIdFromString(idRelai));

      const abonnements2 = await que(
        () => composantes.relai.abonnements(),
        (a) => !a.includes("canal test"),
      );
      expect(abonnements2).to.not.include("canal test");
    });
    it("Relai toujours abonné aux sujets par défaut", async () => {
      expect(await composantes.relai.abonnements()).to.include("canal défaut");
    });
  });
});
