# DisTube Example

DisTube.js.org example music bot with command handler

**Dependencies maybe outdated. You should update them yourself!**

Check out the [official guide](https://distube.js.org/guide) to get your music bot running from scratch.

## How to redeploy the bot

1. Push/merge to master. Upon push, a github action will build and push a docker image up to the link below.

- https://hub.docker.com/r/lyptea/denpabot

2. Login to lyptea.ddns.net:9001 (portainer)
3. Click the primary environment -> Container -> denpabot
4. Click "Recreate", toggle "Re-pull image", then click the red "Recreate" button.
5. Ensure container starts correctly :)

## How to develop locally?

1. We use dotenv to read local env variables to our app.
2. Simply create a `.env` (already included in .gitignore) file in the top level, then add your key like so.

```
TOKEN=<your key here>
```

3. Add your bot to your personal server, then develop as such!

## [OUTDATED] How to update docker image (and thus updating the bot)

**Below is outdated, but keeping for historical purposes/quick reference :)**

Run the following commands

```
docker build -t lyptea/denpabot .
docker push lyptea/denpabot
```

Then on host machine cd into docker folder

```
docker-compose pull
docker-compose up -d
docker exec -it denpabot /bin/bash
```
