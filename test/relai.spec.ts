import { préparerTest, que } from "./utils/index.ts";
import { expect } from "aegir/chai";
import type { CommunicationRelaiTest } from "./utils/communicationRelai.ts";
import { CANAUX_DÉCOUVERTE_PAIRS_TEST } from "./utils/consts.ts";

const CANAL_DÉFAUT = "canal défaut";

const obtIdRelai = async (relai: CommunicationRelaiTest): Promise<string> => {
  const adressesRelai = await relai.adresses();
  const idRelai = adressesRelai[0].split("/").slice(-1)[0];
  if (!idRelai) throw new Error();
  return idRelai;
};

describe("Relai", function () {
  const composantes = préparerTest({ nPairs: 2 });
  it("Connexion au relai", async () => {
    const idRelai = await obtIdRelai(composantes.relai);

    const connexionsPairs = await Promise.all(
      composantes.pairs.map(async (p) =>
        que(
          () => p.getPeers(),
          (pairs) => pairs.length > 0,
        ),
      ),
    );
    expect(connexionsPairs[0].map((p) => p.toString())).to.include(idRelai);
    expect(connexionsPairs[1].map((p) => p.toString())).to.include(idRelai);
  });

  it("connexions entre pairs", async () => {
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
    it("relai automatiquement abonné aux sujets", async () => {
      const abonnementsAvant = await composantes.relai.abonnements();
      composantes.pairs[0].services.pubsub.subscribe("canal test");
      const abonnements = await que(
        () => composantes.relai.abonnements(),
        (a) => a.length > abonnementsAvant.length,
      );
      expect(abonnements).to.include("canal test");
    });

    it("messages pubsub passent même si relai non explicitement abonné", async () => {
      let résultat: string | undefined = undefined;
      composantes.pairs[1].services.pubsub.addEventListener("message", (é) => {
        if (é.detail.topic === "canal test") {
          résultat = new TextDecoder().decode(é.detail.data);
        }
      });
      composantes.pairs[1].services.pubsub.subscribe("canal test");
      await que(
        () => composantes.relai.pairs({ sujet: "canal test" }),
        (p) => p.length > 1,
      );
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

    it("relai automatiquement désabonné s'il n'y a plus de pairs abonnés", async () => {
      composantes.pairs[0].services.pubsub.unsubscribe("canal test");
      composantes.pairs[1].services.pubsub.unsubscribe("canal test");
      const abonnements = await que(
        () => composantes.relai.abonnements(),
        (a) => !a.includes("canal test"),
      );
      expect(abonnements).to.not.include("canal test");
    });

    it("relai automatiquement désabonné si pairs abonnés sont déconnectés", async () => {
      const CANAL_TEST = "canal test";

      composantes.pairs[0].services.pubsub.subscribe(CANAL_TEST);
      const abonnements = await que(
        () => composantes.relai.abonnements(),
        (a) => a.includes(CANAL_TEST),
      );
      expect(abonnements).to.include(CANAL_TEST);

      await composantes.pairs[0].stop();

      const abonnementsAprèsDéconnexion = await que(
        () => composantes.relai.abonnements(),
        (a) => !a.includes(CANAL_TEST),
      );
      expect(abonnementsAprèsDéconnexion).to.not.include(CANAL_TEST);
      await composantes.pairs[0].start();
    });

    it("relai désabonné si pair désabonné", async () => {
      composantes.pairs[0].services.pubsub.subscribe("canal test");
      await que(
        () => composantes.relai.abonnements(),
        (a) => a.includes("canal test"),
      );
      composantes.pairs[0].services.pubsub.unsubscribe("canal test");
      const abonnements = await que(
        () => composantes.relai.abonnements(),
        (a) => !a.includes("canal test"),
      );
      expect(abonnements).to.deep.equal([
        ...CANAUX_DÉCOUVERTE_PAIRS_TEST,
        CANAL_DÉFAUT,
      ]);
    });

    it("multiples sujets par pair", async () => {
      composantes.pairs[0].services.pubsub.subscribe("canal test");
      await que(
        () => composantes.relai.abonnements(),
        (a) => a.includes("canal test"),
      );
      composantes.pairs[0].services.pubsub.subscribe("canal test 2");
      const abonnements = await que(
        () => composantes.relai.abonnements(),
        (a) => a.includes("canal test 2"),
      );

      expect(abonnements).to.deep.equal([
        ...CANAUX_DÉCOUVERTE_PAIRS_TEST,
        CANAL_DÉFAUT,
        "canal test",
        "canal test 2",
      ]);

      composantes.pairs[0].services.pubsub.unsubscribe("canal test");
      const abonnementsAprès = await que(
        () => composantes.relai.abonnements(),
        (a) => a.includes("canal test 2"),
      );

      expect(abonnementsAprès).to.deep.equal([
        ...CANAUX_DÉCOUVERTE_PAIRS_TEST,
        CANAL_DÉFAUT,
        "canal test 2",
      ]);
    });
    it("relai toujours abonné aux sujets par défaut", async () => {
      expect(await composantes.relai.abonnements()).to.include(CANAL_DÉFAUT);
    });
  });
});
