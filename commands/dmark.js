module.exports = {
  name: 'dmark',
  aliases: [],
  inVoiceChannel: false,
  run: async (client, message, args) => {
    if (isNaN(args[0])) {
      return client.distube.emit('denpartyGetMarker', message.channel)
    }
    return client.distube.emit('denpartySetMarker', message.channel, args[0])
  }
}
