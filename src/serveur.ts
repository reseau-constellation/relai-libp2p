import express from "express";
import path from "path";
import serveStatic from "serve-static";
import compression from "compression";

import { créerNœud, obtAdressesNœud } from "./relai.js";

const __dirname = import.meta.dirname;

const app = express();

app.use(compression());

app.use(serveStatic(path.join("/dist")));

if (process.env.NODE_ENV === "production") {
  app.use(express.static("client/build"));
}
const nœud = await créerNœud();
obtAdressesNœud(nœud);
app.get("*", (request, response) => {
  response.sendFile(path.join("src", "index.html"), { root: "." });
});
app.get("/adresses", async (request, response) => {
  const adresses = obtAdressesNœud(nœud);
  response.send(adresses);
});

const port = process.env.PORT || 8080;
app.listen(port);
