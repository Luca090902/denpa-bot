const Discord = require('discord.js')
const Util = require('../classes/utils.js')

module.exports = {
  name: 'nowplaying',
  aliases: ['np'],
  inVoiceChannel: true,
  run: async (client, message, args) => {
    const queue = client.distube.getQueue(message)
    if (!queue) return message.channel.send(`${client.emotes.error} | There is nothing in the queue right now!`)
    const song = queue.songs[0]

    const firstSong = queue.songs[0]
    const isQueueRestored = !!firstSong.metadata?.fromRestoredQueue
    const requester = Util.sanitizeDiscordString(
      isQueueRestored ? firstSong.metadata.actualRequester : firstSong.user.username
    )

    const np = `${client.emotes.play} | I'm playing **\`${Util.sanitizeDiscordString(song.name)}\`**, \n
    Requested by \`${requester}\` ${isQueueRestored ? '**[RESTORED]**' : ''}\n
    <${song.url}>`

    const queueEmbed = new Discord.EmbedBuilder()
      .setColor(0x0099ff)
      .setTitle('Now playing')
      .setThumbnail(song.thumbnail)
      .setDescription(np)

    message.channel.send({ embeds: [queueEmbed] })
  }
}
