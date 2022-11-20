module.exports = {
  name: 'skip',
  aliases: ['s'],
  inVoiceChannel: true,
  run: async (client, message, args) => {
    const queue = client.distube.getQueue(message)
    if (!queue) return message.channel.send(`${client.emotes.error} | There is nothing in the queue right now!`)
    try {
      if (isNaN(args[0])) {
        const song = await queue.skip()
        message.channel.send(`${client.emotes.success} | Skipped! Now playing:\n${song.name}`)
      } else {
        var skippedsong = queue.songs.splice(args[0], 1);
        message.channel.send(`${client.emotes.success} | Skipped song ${skippedsong[0].name}`)
      }
    } catch (e) {
      message.channel.send(`${client.emotes.error} | ${e}`)
    }
  }
}
