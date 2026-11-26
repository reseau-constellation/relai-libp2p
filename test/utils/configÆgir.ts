import { RelaiTest } from "./relai.ts";
import type { PartialOptions } from "aegir";
import type { BuildOptions } from "esbuild";
import { CANAUX_DÉCOUVERTE_PAIRS_TEST } from "./consts.ts";
import { PORT_SERVEUR_DÉFAUT } from "../../src/const.ts";

export const obtConfigEsbuild = async (): Promise<BuildOptions> => {
  const { createRequire } = (await import("module")).default;
  const path = await import("path");
  const { fileURLToPath } = await import("url");

  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const require = createRequire(import.meta.url);
  const configEsbuild: BuildOptions = {
    // ceci injecte les exportations nomées de 'node-globals.js' en tant que variables globales
    // inject: [path.join(__dirname, "../scripts/node-globals.js")],
    plugins: [
      {
        name: "node built ins",
        setup(build) {
          // build.onResolve({ filter: /^crypto$/ }, () => {
          //   return { path: require.resolve("crypto-browserify") };
          // });
          // build.onResolve({ filter: /^fs/ }, () => {
          //   return { path: require.resolve("browserify-fs") };
          // });
          // build.onResolve({ filter: /^stream$/ }, () => {
          //   return { path: require.resolve("stream-browserify") };
          // });
          // build.onResolve({ filter: /^os$/ }, () => {
          //   return { path: require.resolve("os-browserify") };
          // });
          build.onResolve({ filter: /^node:process$/ }, () => {
            return { path: require.resolve("process/browser") };
          });
          build.onResolve({ filter: /^node:url$/ }, () => {
            return { path: require.resolve("url-polyfill") };
          });
        },
      },
    ],
    external: [
      "fs",
      "path",
      "os",
      "chokidar",
      "url",
      "execa",
      "zlib",
      "rimraf",
      "stream",
      "module",
      "electron",
      "env-paths",
      "@libp2p/tcp",
      "@libp2p/mdns",
      "datastore-fs",
      "blockstore-fs",
    ],
  };
  return configEsbuild;
};

type RetourAvant = {
  relai?: RelaiTest;
};

export const générerConfigÆgir = async (): Promise<PartialOptions> => {
  const esbuild = await obtConfigEsbuild();
  return {
    test: {
      // @ts-expect-error Erreur types Ægir
      before: async (): Promise<RetourAvant> => {
        const relai = new RelaiTest({
          portServeur: PORT_SERVEUR_DÉFAUT,
          portLibp2p: 54323,
          canauxDéfaut: ["canal défaut"],
          canauxDécouvertePairs: CANAUX_DÉCOUVERTE_PAIRS_TEST,
        });
        await relai.lancer();
        return { relai };
      },
      // @ts-expect-error Erreur types Ægir
      after: async (_opts, avant: RetourAvant) => {
        await avant.relai?.fermer();
      },
      browser: {
        config: {
          buildConfig: esbuild,
        },
      },
    },
    build: {
      config: esbuild,
    },
  };
};
