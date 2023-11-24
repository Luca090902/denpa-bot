const { DisTube } = require('distube')
const Discord = require('discord.js')
require('dotenv').config()

const client = new Discord.Client({
  intents: [
    Discord.GatewayIntentBits.Guilds,
    Discord.GatewayIntentBits.GuildMessages,
    Discord.GatewayIntentBits.GuildVoiceStates,
    Discord.GatewayIntentBits.MessageContent,
    Discord.IntentsBitField.Flags.GuildPresences,
    Discord.IntentsBitField.Flags.GuildMembers,
    Discord.GatewayIntentBits.GuildMessageReactions
  ]
  // partials: [
  //   Partials.Message,
  //   Partials.Channel,
  //   Partials.Reaction]
})
const fs = require('fs')
const fsPromises = require('fs/promises')
const config = require('./config.json')
const { SpotifyPlugin } = require('@distube/spotify')
const { SoundCloudPlugin } = require('@distube/soundcloud')
const { YtDlpPlugin } = require('@distube/yt-dlp')
const Util = require('./classes/utils.js')
const { setupAutoReact } = require('./classes/autoEmoteUtils')
const { getDeleteGuardData } = require('./classes/deleteGuardUtils')

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

// join a guild
client.on('guildCreate', guild => {
  const EXPECTED_GUILD_ID = config.guild_id ?? process.env.GUILD_ID
  console.log(`Guild: Joined ${guild.name}`)

  if (EXPECTED_GUILD_ID && EXPECTED_GUILD_ID !== guild.id) {
    console.warn(`Guild: Did not expect to join ${guild.name}. Leaving...`)
    guild.leave()
  }
})

// lazy (tea) auto role
client.on('guildMemberAdd', member => {
  member.roles.add(member.guild.roles.cache.find(i => i.name === config.defaultrole))
  console.log(`auto role ${config.defaultrole} added to ${member.user.username}`)
})

// https://stackoverflow.com/questions/3809401/what-is-a-good-regular-expression-to-match-a-url
const urlRegex = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)/g

// Wood
client.on(Discord.Events.MessageReactionAdd, async (reaction, user) => {
  try {
    await reaction.fetch()
  } catch (error) {
    console.error('Something went wrong when fetching the message:', error)
    return
  }

  const wood = require('./commands/wood')
  const woodPath = wood.path(reaction.message.guildId)
  const woodConfig = wood.config(woodPath)

  if (reaction.emoji.name === config.emoji.wood) {
    // Send message to wood channel
    const messageReacted = await client.channels.cache
      .get(reaction.message.channelId)
      .messages.fetch(reaction.message.id)

    const woodcount = messageReacted.reactions.cache.get(config.emoji.wood).count

    if (woodConfig.messages.includes(reaction.message.id)) return // no duplicates in woodboard
    if (reaction.message.channelId === woodConfig.channelId) return // messages in woodboard don't count

    if (woodcount >= woodConfig.threshold) {
      client.channels.fetch(woodConfig.channelId).then(channel => {
        const mainEmbed = new Discord.EmbedBuilder()
          .setColor(0xe8b693) // colour of the sapwood (xylem? idk tree terms)
          .setURL('https://example.com') // This is a hack to get more than one image embed
          .setAuthor({
            name: `${reaction.message.author.tag} | 🦈 tbh`,
            iconURL: reaction.message.author.displayAvatarURL()
          })
          .setTimestamp()
          .setFooter({ text: `ID: ${reaction.message.id}` })

        // value can not be "" or null (presumably can't be falsey)
        // so make sure not to call addFields if there is no message
        if (reaction.message.content) mainEmbed.addFields({ name: 'Message', value: reaction.message.content })
        mainEmbed.addFields({ name: 'Link', value: reaction.message.url })

        // TODO: Confirm that URLs are indeed images before sending them off to discord?

        // Discord doesn't support displaying more than one (large) image embed at the same time.
        // HOWEVER, see this: https://www.reddit.com/r/discordapp/comments/raz4kl/finally_a_way_to_display_multiple_images_in_an/
        const hyperlinks = reaction.message.content.match(urlRegex) ?? []
        const attachment = reaction.message.attachments.first()

        if (hyperlinks.length !== 0) {
          mainEmbed.setImage(attachment?.url ?? hyperlinks.shift())
        } else {
          if (attachment) mainEmbed.setImage(attachment.url)
        }

        const embeds = []
        embeds.push(mainEmbed)

        hyperlinks.forEach(hyperlink => {
          embeds.push(new Discord.EmbedBuilder().setURL('https://example.com').setImage(hyperlink))
        })

        channel.send({ embeds })

        // Update list of tracked messages + write to disk
        woodConfig.messages.push(reaction.message.id)
        wood.save(woodPath, woodConfig)
      })
    }
  }
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

// auto reacts
client.on('messageCreate', async message => {
  setupAutoReact(message, 'take', client.emotes.take)
  setupAutoReact(message, 'same', client.emotes.same)
})

// deleteGuard
client.on('messageDelete', async message => {
  const guildId = message.guildId
  const deleteGuardData = getDeleteGuardData(guildId)

  // if in allowlist, repost message
  if (deleteGuardData.users.includes(message.author.id)) {
    const mainEmbed = new Discord.EmbedBuilder()
      .setColor(0xecdca8) // golden color
      .setURL('https://example.com') // This is a hack to get more than one image embed
      .setAuthor({
        name: `${message.author.tag}`,
        iconURL: message.author.displayAvatarURL()
      })
      .setTimestamp()
      .setFooter({ text: `ID: ${message.id}` })

    // value can not be "" or null (presumably can't be falsey)
    // so make sure not to call addFields if there is no message
    mainEmbed.addFields({ name: 'Deleted Message', value: message.content ?? '[Empty]' })

    const hyperlinks = message.content.match(urlRegex) ?? []
    const attachment = message.attachments.first()

    mainEmbed.setImage(attachment?.url ?? hyperlinks.shift() ?? null)

    const embeds = []
    embeds.push(mainEmbed)

    // https://www.reddit.com/r/discordapp/comments/raz4kl/finally_a_way_to_display_multiple_images_in_an/
    hyperlinks.forEach(hyperlink => {
      embeds.push(new Discord.EmbedBuilder().setURL('https://example.com').setImage(hyperlink))
    })

    message.channel.send({ embeds })
  }
})

client.on('messageUpdate', async (oldMessage, newMessage) => {
  const guildId = newMessage.guildId
  const deleteGuardData = getDeleteGuardData(guildId)

  // if in allowlist, repost message
  if (deleteGuardData.users.includes(oldMessage.author.id)) {
    client.channels.fetch(deleteGuardData.channelId).then(channel => {
      const mainEmbed = new Discord.EmbedBuilder()
        .setColor(0xecdca8) // golden color
        .setURL('https://example.com') // This is a hack to get more than one image embed
        .setAuthor({
          name: `${oldMessage.author.tag}`,
          iconURL: oldMessage.author.displayAvatarURL()
        })
        .setTimestamp()
        .setFooter({ text: `ID: ${oldMessage.id}` })

      // value can not be "" or null (presumably can't be falsey)
      // so make sure not to call addFields if there is no message
      mainEmbed.addFields({ name: 'Old Message Content', value: oldMessage.content ?? '[Empty]' })
      mainEmbed.addFields({ name: 'Link', value: oldMessage.url })

      const hyperlinks = oldMessage.content.match(urlRegex) ?? []
      const attachment = oldMessage.attachments.first()

      mainEmbed.setImage(attachment?.url ?? hyperlinks.shift() ?? null)

      const embeds = []
      embeds.push(mainEmbed)

      // https://www.reddit.com/r/discordapp/comments/raz4kl/finally_a_way_to_display_multiple_images_in_an/
      hyperlinks.forEach(hyperlink => {
        embeds.push(new Discord.EmbedBuilder().setURL('https://example.com').setImage(hyperlink))
      })

      channel.send({ embeds })
    })
  }
})

client.distube.setMaxListeners(3)

client.distube
  .on('playSong', (queue, song) => {
    const isQueueRestored = !!song.metadata?.fromRestoredQueue
    const requester = Util.sanitizeDiscordString(isQueueRestored ? song.metadata.actualRequester : song.user.username)
    const np = `${client.emotes.play} | \`${song.name}\` - \`${song.formattedDuration}\`\n
    Requested by: \`${requester}\` ${isQueueRestored ? '**[RESTORED]**' : ''}\n
    <${song.url}>`
    const queueEmbed = new Discord.EmbedBuilder()
      .setColor(0x0099ff)
      .setTitle('Playing')
      .setThumbnail(song.thumbnail)
      .setDescription(np)
    queue.textChannel.send({ embeds: [queueEmbed] })
  })
  .on('addSong', (queue, song) => {
    const np = `${client.emotes.success} | Added ${song.name} - \`${song.formattedDuration}\` \n to the queue by \`${song.user.username}\``
    const queueEmbed = new Discord.EmbedBuilder()
      .setColor(0x0099ff)
      .setTitle('Added')
      .setThumbnail(song.thumbnail)
      .setDescription(np)
    queue.textChannel.send({ embeds: [queueEmbed] })
  })
  .on('addList', (queue, playlist) => {
    const np = `${client.emotes.success} | Added \`${playlist.name}\` playlist (${playlist.songs.length} songs) to queue`
    const queueEmbed = new Discord.EmbedBuilder()
      .setColor(0x0099ff)
      .setTitle('Added')
      .setThumbnail(playlist.thumbnail)
      .setDescription(np)
    queue.textChannel.send({ embeds: [queueEmbed] })
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
  constructor () {
    this.playlists = new Map()
    this.markers = new Map()
    this.disabledAt = new Set()

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
            const { marker, playlist } = JSON.parse(data)
            if (marker) {
              this.markers.set(guildId, marker)
            }
            this.playlists.set(guildId, playlist)
          })
        }
      }
    })
  }

  getMessageById (guildId, messageId) {
    const target = (this.playlists.get(guildId) ?? []).filter(datum => datum.messageId === messageId)
    return target[0] ?? null
  }

  getOrInsertMarker (guildId) {
    if (!this.markers.get(guildId)) {
      // If we at least have _one_ record, then use that timestamp
      const playlist = this.getOrGeneratePlaylistId(guildId)
      if (playlist.length) {
        this.markers.set(guildId, Math.min(...playlist.map(e => e.timestamp)))
      } else {
        this.markers.set(guildId, 0)
      }
    }
    return this.markers.get(guildId)
  }

  setMarker (guildId, messageId) {
    const target = this.getMessageById(guildId, messageId)
    if (!target) {
      throw new Error('Incorrect message ID or guild ID')
    }
    this.markers.set(guildId, target.timestamp)
    return target.timestamp
  }

  getOrGeneratePlaylistId (guildId) {
    if (!this.playlists.get(guildId)) {
      this.playlists.set(guildId, [])
    }
    return this.playlists.get(guildId)
  }

  getRecord (song) {
    const target = this.getOrGeneratePlaylistId(song.metadata.guildId)
    const currentDenpartyMarker = this.getOrInsertMarker(song.metadata.guildId)
    const result = target.filter(sng => sng.video_id === song.id && sng.timestamp >= currentDenpartyMarker)

    return result[0] ?? null
  }

  onSongPlayed (song) {
    if (this.disabledAt.has(song.metadata.guildId)) {
      return
    }

    // Songs (re-)added from queue restore command do not get recorded
    //   getRecord might not return the already played song
    if (song.metadata?.fromRestoredQueue) {
      return
    }

    const target = this.getRecord(song)
    if (!target) {
      throw new Error()
    }

    target.wasPlayed = true
    this.dumpStateFull(song.metadata.guildId)
  }

  getDenpartyLength (guildId) {
    return this.getOrGeneratePlaylistId(guildId).length
  }

  record (song) {
    if (this.disabledAt.has(song.metadata.guildId)) {
      return
    }

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

    this.dumpStateFull(song.metadata.guildId)

    return datum
  }

  recordPlaylist (playlist) {
    if (playlist.songs.length < 1) return

    const guildId = playlist.songs[0].metadata.guildId

    if (this.disabledAt.has(guildId)) {
      return
    }

    playlist.songs.forEach(song =>
      this.getOrGeneratePlaylistId(guildId).push({
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

    this.dumpStateFull(guildId)
  }

  filterDuplicates (guildId) {
    const target = this.getOrGeneratePlaylistId(guildId)
    const currDenpartyMarker = this.getOrInsertMarker(guildId)
    const denpartySongs = target.filter(datum => datum.timestamp >= currDenpartyMarker)
    const prevDenpartySongs = target.filter(datum => datum.timestamp < currDenpartyMarker)

    const dupelessDenpartySongSet = new Set()
    denpartySongs.forEach(datum => dupelessDenpartySongSet.add(datum.url))
    const dupelessDenpartySong = denpartySongs.filter(datum => dupelessDenpartySongSet.delete(datum.url))

    this.playlists.set(guildId, [...prevDenpartySongs, ...dupelessDenpartySong])
  }

  dumpStateFull (guildId) {
    const target = {
      marker: this.getOrInsertMarker(guildId),
      playlist: this.getOrGeneratePlaylistId(guildId)
    }

    // Specifically done at this point to prevent data corruption
    //  in case of an error in JSON.stringify
    // Do NOT inline
    const data = JSON.stringify(target)

    // Make sure to globally lock the main thread because
    //   if a bot crashes while awaiting
    //   it sometimes appears to fail to properly flush the write buffer
    //   causing corruption of the file?
    fs.writeFileSync(`./backups/denparty_${guildId}.json`, data, { encoding: 'utf-8' })
  }

  async dumpStatePartial (guildId) {
    const fullTarget = this.getOrGeneratePlaylistId(guildId)
    const marker = this.getOrInsertMarker(guildId)

    const target = fullTarget.filter(datum => datum.timestamp >= marker)
    // Specifically done at this point to prevent data corruption
    //  in case of an error in JSON.stringify
    // Do NOT inline
    const data = JSON.stringify(target)

    const fhandle = await fsPromises.open(`./backups/denparty_${guildId}_request.json`, 'w')
    await fhandle.writeFile(data, { encoding: 'utf-8' })
    await fhandle.close()
  }

  async whileDisabledContext (guildId, code) {
    this.disabledAt.add(guildId)
    await code()
    this.disabledAt.delete(guildId)
  }
}
const denpartyTracker = new DenpartyTracker()

async function backupQueue (guildId) {
  const queue = client.distube.getQueue(guildId)
  if (!queue) {
    return
  }

  const songData = queue.songs.map(song => {
    return {
      url: song.url,
      requester: song.member.user.username
    }
  })

  const data = JSON.stringify(songData)
  fs.writeFileSync(`./backups/queue_${guildId}.json`, data, { encoding: 'utf-8' })
}

async function loadQueueBackup (guildId) {
  try {
    const fhandle = await fsPromises.open(`./backups/queue_${guildId}.json`, 'r')
    const data = await fhandle.readFile('utf-8')
    await fhandle.close()
    return JSON.parse(data)
  } catch (err) {
    return null
  }
}

client.distube
  .on('playSong', (queue, song) => {
    try {
      denpartyTracker.onSongPlayed(song)
    } catch (err) {
      queue.textChannel.send(
        `${client.emotes.error} | Playing a song not recorded in current denparty, is the marker set right?`
      )
    }
  })
  .on('playSong', (_, song) => backupQueue(song.metadata.guildId))
  .on('addSong', (_, song) => denpartyTracker.record(song))
  .on('addSong', (_, song) => backupQueue(song.metadata.guildId))
  .on('addList', (_, playlist) => denpartyTracker.recordPlaylist(playlist))
  .on('addList', (_, playlist) => backupQueue(playlist.songs[0]?.metadata?.guildId))
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
  .on('denpaNeverDies', async (channel, member, message) => {
    const guildId = channel.guildId
    let queue = client.distube.getQueue(guildId)

    if (queue && queue.songs.length) {
      return channel.send(`${client.emotes.error} | Queue must be empty to try to restore it...`)
    }

    const queueBackup = await loadQueueBackup(guildId)
    if (!queueBackup?.length) {
      return channel.send(`${client.emotes.error} | Nothing to restore :(`)
    }

    const queueUrls = queueBackup.map(entry => entry.url)

    channel.send(`${client.emotes.denpabot} | Trying to restore the queue of ${queueUrls.length} songs...`)

    const queuePlaylist = await client.distube.createCustomPlaylist(queueUrls, { member })

    // Temporarily disable the tracker
    await denpartyTracker.whileDisabledContext(guildId, async () => {
      await client.distube.play(member.voice.channel, queuePlaylist, {
        textChannel: channel,
        metadata: message,
        member,
        message
      })
    })

    channel.send(`${client.emotes.denpabot} | Queue restored with ${queuePlaylist.songs.length} songs!`)

    // Perform black fucking magic to restore requesters
    const songLookup = new Map()
    for (const entry of queueBackup) {
      songLookup.set(entry.url, entry.requester)
    }

    queue = client.distube.getQueue(guildId)
    for (const song of queue.songs) {
      const actualRequester = songLookup.get(song.url)

      song.metadata = {
        ...song.metadata,
        fromRestoredQueue: true,
        actualRequester
      }
    }
  })

client.login(config.token)
