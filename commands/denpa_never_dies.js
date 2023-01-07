module.exports = {
  name: 'denpa-never-dies',
  aliases: ['dnd'],
  inVoiceChannel: true,
  run: async (client, message, args) => {
    client.distube.emit('denpaNeverDies', message.channel, message.member, message)
  }
}
