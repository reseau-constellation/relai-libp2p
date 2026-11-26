import express from "express";
import path from "path";
import serveStatic from "serve-static";
import compression from "compression";

import { créerNœud, obtAdressesNœud } from "./relai.js";

const nœud = await créerNœud({
  port: process.env.PORT_LIBP2P ? Number(process.env.PORT_LIBP2P) : undefined,
});

const app = express();

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

const port = Number(process.env.PORT ?? 8000);
app.listen(port);
