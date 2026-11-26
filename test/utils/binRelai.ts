import express from "express";
import type { Request } from "express";
import path from "path";
import cors from "cors";
import serveStatic from "serve-static";
import compression from "compression";
import { logger } from "@libp2p/logger";
import { créerNœud, obtAdressesNœud } from "../../src/relai.ts";
import { CODE_PRÊT } from "./consts.ts";

const log = logger("relai-libp2p");
const nœud = await créerNœud({
  canauxDéfaut: process.env.CANAUX_DÉFAUT
    ? JSON.parse(process.env.CANAUX_DÉFAUT)
    : undefined,
  canauxDécouvertePairs: process.env.CANAUX_DÉCOUVERTE_PAIRS
    ? JSON.parse(process.env.CANAUX_DÉCOUVERTE_PAIRS)
    : undefined,
  journal: log,
  port: process.env.PORT_LIBP2P ? Number(process.env.PORT_LIBP2P) : undefined,
});

const app = express();
// Permettre l'accès à partir de l'hôte locale
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) {
        callback(null, true);
        return;
      }
      if (new URL(origin).hostname === "127.0.0.1") {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
  }),
);

app.use(compression());

app.use(serveStatic(path.join("/dist")));

if (process.env.NODE_ENV === "production") {
  app.use(express.static("client/build"));
}

app.get("/", (_request, response) => {
  response.sendFile(path.join("src", "index.html"), { root: "." });
});
app.get("/adresses", async (_request, response) => {
  const adresses = obtAdressesNœud(nœud);
  response.send(adresses);
});
app.get("/sujets", async (_request, response) => {
  const sujets = nœud.services.pubsub.getTopics();
  response.send(sujets);
});
app.get("/connexions", async (_request, response) => {
  const connexions = nœud.getConnections();
  response.send(connexions);
});
app.get("/pairs", async (request: Request<{ sujet: string }>, response) => {
  const sujet = request.params["sujet"];
  const pairs = sujet
    ? nœud.services.pubsub.getSubscribers(sujet)
    : nœud.getPeers();
  response.send(pairs);
});

app.listen(Number(process.env.PORT ?? 8000));

console.log(CODE_PRÊT);
