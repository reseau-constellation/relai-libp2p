# Relai libp2p
Ce code vous permet de lancer votre propre nœud de relai libp2p pour vos applications basées sur SFIP ou OrbitDB.

## Installation
En premier lieu, fourchez ce projet et installez-le localement :

```sh
pnpm install
```

## Déploiement
Pour déployer votre propre serveur relai, suivre les instructions suivantes :

### Choisissez un fournisseur
Vous devrez choisir un fournisseur d'hébergement. [Back4App Containers](https://www.back4app.com/docs-containers) offre des options gratuites qui sont suffisamment puissantes pour ce relai. [Heroku](https://devcenter.heroku.com/articles/github-integration) offre également des options payantes.

Créez votre compte sur le site de votre fournisseur, puis choisissez de créer une nouvelle application avec l'addresse GitHub de la fourche de ce projet que vous avez créée ci-dessus.

### Génération de la clef secrète
1. Exécutez `pnpm lancer`.
2. Ouvrez le fichier `.env` qui vient d'être généré et copiez la valeur **secrète** dans les variables d'environnement ([Back4App](https://www.back4app.com/docs-containers/prepare-your-deployment), [Heroku](https://devcenter.heroku.com/articles/config-vars)) de votre fournisseur d'hébergement.

### Configuration du domaine
1. Choisissez un nom de domaine pour votre serveur relai. Ceci peut être un nom par défaut de votre fournisseur (p. ex., monprojet.b4a.run ou monprojet.herokuapp.com) ou bien votre propre domaine.
2. Copiez ce nom de domaine dans une variable d'environnement nommée `DOMAINE` sur votre fournisseur d'hébergement.


## Crédits
Beaucoup du code provient originalement de https://github.com/libp2p/js-libp2p-example-circuit-relay.