const { DisTube } = require('distube')
const Discord = require('discord.js')
const client = new Discord.Client({
  intents: [
    Discord.GatewayIntentBits.Guilds,
    Discord.GatewayIntentBits.GuildMessages,
    Discord.GatewayIntentBits.GuildVoiceStates,
    Discord.GatewayIntentBits.MessageContent
  ]
})
const fs = require('fs')
const fsPromises = require('fs/promises')
const config = require('./config.json')
const { SpotifyPlugin } = require('@distube/spotify')
const { SoundCloudPlugin } = require('@distube/soundcloud')
const { YtDlpPlugin } = require('@distube/yt-dlp')

client.config = require('./config.json')
const { TOKEN } = process.env
if (TOKEN) {
  client.config.token = TOKEN
}

client.distube = new DisTube(client, {
  leaveOnStop: false,
  nsfw: true,
  plugins: [
    new SpotifyPlugin({
      emitEventsAfterFetching: true
    }),
    new SoundCloudPlugin(),
    new YtDlpPlugin()
  ]
})
client.commands = new Discord.Collection()
client.aliases = new Discord.Collection()
client.emotes = config.emoji

fs.readdir('./commands/', (err, files) => {
  if (err) return console.log('Could not find any commands!')
  const jsFiles = files.filter(f => f.split('.').pop() === 'js')
  if (jsFiles.length <= 0) return console.log('Could not find any commands!')
  jsFiles.forEach(file => {
    const cmd = require(`./commands/${file}`)
    console.log(`Loaded ${file}`)
    client.commands.set(cmd.name, cmd)
    if (cmd.aliases) cmd.aliases.forEach(alias => client.aliases.set(alias, cmd.name))
  })
})

client.on('ready', () => {
  console.log(`${client.user.tag} is ready to play music.`)
  client.user.setActivity('Praise be to ;;toromi')
})

client.on('messageCreate', async message => {
  if (message.author.bot || !message.guild) return
  const prefix = config.prefix
  if (!message.content.startsWith(prefix)) return
  const args = message.content.slice(prefix.length).trim().split(/ +/g)
  const command = args.shift().toLowerCase()
  const cmd = client.commands.get(command) || client.commands.get(client.aliases.get(command))
  if (!cmd) return
  if (cmd.inVoiceChannel && !message.member.voice.channel) {
    return message.channel.send(`${client.emotes.error} | You must be in a voice channel!`)
  }
  try {
    cmd.run(client, message, args)
  } catch (e) {
    console.error(e)
    message.channel.send(`${client.emotes.error} | Error: \`${e}\``)
  }
})

client.distube.setMaxListeners(2)

client.distube
  .on('playSong', (queue, song) => {
    queue.textChannel.send(
      `${client.emotes.play} | Playing \`${song.name}\` - \`${song.formattedDuration}\`\nRequested by: \`${song.user.username}\` \n<${song.url}>`
    )
  })
  .on('addSong', (queue, song) => {
    queue.textChannel.send(
      `${client.emotes.success} | Added ${song.name} - \`${song.formattedDuration}\` to the queue by \`${song.user.username}\``
    )
  })
  .on('addList', (queue, playlist) => {
    queue.textChannel.send(
      `${client.emotes.success} | Added \`${playlist.name}\` playlist (${playlist.songs.length} songs) to queue`
    )
  })
  .on('error', (channel, e) => {
    if (channel) channel.send(`${client.emotes.error} | An error encountered: ${e.toString().slice(0, 1974)}`)
    else console.error(e)
  })
  .on('empty', queue => queue.textChannel.send('Voice channel is empty! Leaving the channel...'))
  .on('searchNoResult', (message, query) =>
    message.channel.send(`${client.emotes.error} | No result found for \`${query}\`!`)
  )
  .on('finish', queue => queue.textChannel.send('Finished!'))

class DenpartyTracker {
  constructor() {
    this.playlists = new Map()
    this.markers = new Map()
    this._backupDelta = 5

    // Restore the state from denparty_GID.json when shit goes tits up
    fs.readdir('./backups/', (err, files) => {
      if (err) return
      for (const fname of files) {
        const denpartyRegex = /denparty_(\d+)\.json/
        const maybeMatch = fname.match(denpartyRegex)
        const guildId = maybeMatch ? maybeMatch[1] : null
        if (guildId) {
          fs.readFile(`./backups/denparty_${guildId}.json`, { encoding: 'utf-8' }, (err, data) => {
            if (err) {
              console.error(err)
              return
            }
            this.playlists.set(guildId, JSON.parse(data))
          })
        }
      }
    })
  }

  getMessageById(guildId, messageId) {
    const target = (this.playlists.get(guildId) ?? []).filter(datum => datum.messageId === messageId)
    return target[0] ?? null
  }

  getOrInsertMarker(guildId) {
    if (!this.markers.get(guildId)) {
      // Determine most recent unplayed song
      const songs = this.getOrGeneratePlaylistId(guildId)
      const recentUnplayed = songs.reduce(
        (anchorSong, newSong) =>
          anchorSong ? (newSong.wasPlayed ? null : anchorSong) : !newSong.wasPlayed ? newSong : null,
        null
      )
      this.markers.set(guildId, recentUnplayed?.timestamp ?? Date.now())
    }
    return this.markers.get(guildId)
  }

  setMarker(guildId, messageId) {
    const target = this.getMessageById(guildId, messageId)
    if (!target) {
      throw new Error('Incorrect message ID or guild ID')
    }
    this.markers.set(guildId, target.timestamp)
    return target.timestamp
  }

  getOrGeneratePlaylistId(guildId) {
    if (!this.playlists.get(guildId)) {
      this.playlists.set(guildId, [])
    }
    return this.playlists.get(guildId)
  }

  getRecord(song) {
    const target = this.getOrGeneratePlaylistId(song.metadata.guildId)
    const currentDenpartyMarker = this.getOrInsertMarker(song.metadata.guildId)
    const result = target.filter(sng => sng.video_id === song.id && sng.timestamp >= currentDenpartyMarker)
    return result[0] ?? null
  }

  onSongPlayed(song) {
    const target = this.getRecord(song)
    if (!target) {
      throw new Error('A song that had not been recorded was played...')
    }

    target.wasPlayed = true
  }

  getDenpartyLength(guildId) {
    return this.getOrGeneratePlaylistId(guildId).length
  }

  record(song) {
    const target = this.getOrGeneratePlaylistId(song.metadata.guildId)
    if (target.length && this.getRecord(song)) return

    const datum = {
      url: song.url,
      queued: song.name,
      video_id: song.id,
      caused_by: song.user.username,
      messageId: song.metadata.id,
      timestamp: song.metadata.createdTimestamp,
      wasPlayed: false,
      playlist: null
    }
    target.push(datum)
    // Make sure to keep state backups
    if (this.getDenpartyLength(song.metadata.guildId) % this._backupDelta === 0) {
      this.dumpStateFull(song.metadata.guildId)
    }

    return datum
  }

  recordPlaylist(playlist) {
    if (playlist.songs.length < 1) return

    const guildId = playlist.songs[0].metadata.guildId

    playlist.songs.forEach(song =>
      this.getOrGeneratePlaylistId(song.metadata.guildId).push({
        url: song.url,
        queued: song.name,
        video_id: song.id,
        caused_by: song.user.username,
        messageId: song.metadata.id,
        timestamp: song.metadata.createdTimestamp,
        wasPlayed: false,
        playlist: playlist.url
      })
    )

    // Always dump state after playlist addition 'cos why not
    this.dumpStateFull(guildId)
  }

  filterDuplicates(guildId) {
    const target = this.getOrGeneratePlaylistId(guildId)
    const currDenpartyMarker = this.getOrInsertMarker(guildId)
    const denpartySongs = target.filter(datum => datum.timestamp >= currDenpartyMarker)
    const prevDenpartySongs = target.filter(datum => datum.timestamp < currDenpartyMarker)

    const dupelessDenpartySongSet = new Set()
    denpartySongs.forEach(datum => dupelessDenpartySongSet.add(datum.url))
    const dupelessDenpartySong = denpartySongs.filter(datum => dupelessDenpartySongSet.delete(datum.url))

    this.playlists.set(guildId, [...prevDenpartySongs, ...dupelessDenpartySong])
  }

  async dumpStateFull(guildId) {
    const target = this.getOrGeneratePlaylistId(guildId)

    const fhandle = await fsPromises.open(`./backups/denparty_${guildId}.json`, 'w')
    await fhandle.writeFile(JSON.stringify(target), { encoding: 'utf-8' })
    await fhandle.close()
  }

  async dumpStatePartial(guildId) {
    const fullTarget = this.getOrGeneratePlaylistId(guildId)
    const marker = this.getOrInsertMarker(guildId)

    const target = fullTarget.filter(datum => datum.timestamp >= marker)
    const fhandle = await fsPromises.open(`./backups/denparty_${guildId}_request.json`, 'w')
    await fhandle.writeFile(JSON.stringify(target), { encoding: 'utf-8' })
    await fhandle.close()
  }
}
const denpartyTracker = new DenpartyTracker()

client.distube
  .on('playSong', (_, song) => denpartyTracker.onSongPlayed(song))
  .on('addSong', (_, song) => denpartyTracker.record(song))
  .on('addList', (_, playlist) => denpartyTracker.recordPlaylist(playlist))
  .on('denpartyGetMarker', channel => {
    const marker = denpartyTracker.getOrInsertMarker(channel.guildId)
    channel.send(`${client.emotes.denpabot} | Current denparty start time is set to <t:${Math.floor(marker / 1000)}:f>`)
  })
  .on('denpartySetMarker', (channel, targetMessageId) => {
    let marker = 0
    try {
      marker = denpartyTracker.setMarker(channel.guildId, targetMessageId)
    } catch (e) {
      channel.send(`${client.emotes.error} | Error setting the marker, this message could not be found.`)
      console.error(e)
      return
    }
    channel.send(`${client.emotes.denpabot} | Set current denparty start time to <t:${Math.floor(marker / 1000)}:f>`)
  })
  .on('denpartyDump', async channel => {
    const initialCount = denpartyTracker.getDenpartyLength(channel.guildId)
    denpartyTracker.filterDuplicates(channel.guildId)
    const deltaCount = initialCount - denpartyTracker.getDenpartyLength(channel.guildId)
    if (deltaCount > 0) {
      channel.send(`${client.emotes.denpabot} | There were ${deltaCount} duplicates in the playlist removed`)
    }

    try {
      await denpartyTracker.dumpStatePartial(channel.guildId)
    } catch (e) {
      channel.send(`${client.emotes.error} | Could not dump state`)
      console.error(e)
      return
    }
    channel.send(`${client.emotes.denpabot} | State dumped!`)
    channel.send({
      files: [
        {
          attachment: `./backups/denparty_${channel.guildId}_request.json`,
          name: 'denparty.json',
          description: 'Denparty JSON dump'
        }
      ]
    })
  })
  .on('denpartyLength', channel => {
    channel.send(
      `${client.emotes.denpabot} | Current denparty has ${denpartyTracker.getDenpartyLength(
        channel.guildId
      )} unique songs in the playlist.`
    )
  })

client.login(config.token)
