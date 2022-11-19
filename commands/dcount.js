module.exports = {
  name: 'dcount',
  aliases: [],
  inVoiceChannel: false,
  run: async (client, message) => {
    client.distube.emit('denpartyLength', message.channel)
  }
}
