module.exports = {
  name: 'ddump',
  aliases: [],
  inVoiceChannel: false,
  run: async (client, message) => {
    client.distube.emit('denpartyDump', message.channel)
  }
}
