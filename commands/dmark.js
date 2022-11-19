module.exports = {
  name: 'dmark',
  aliases: [],
  inVoiceChannel: false,
  run: async (client, message, args) => {
    if (args.length !== 1) { return message.channel.send('You need to specify the ID of the message which started the denparty') }
    client.distube.emit('denpartySetMarker', message.channel, args[0])
  }
}
