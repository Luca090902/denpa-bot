const ytfps = require('ytfps')

module.exports = {
  name: 'toromi',
  aliases: ['t'],
  inVoiceChannel: true,
  run: async (client, message) => {
    const config = client.config

    let string = ''
    ytfps(config.tplaylist).then(playlist => {
      const songurl = playlist.videos[randomIntFromInterval(0, playlist.videos.length - 1)].url
      string = songurl
      client.distube.play(message.member.voice.channel, string, {
        member: message.member,
        textChannel: message.channel,
        metadata: message,
        message
      })
    })
  }
}
function randomIntFromInterval (min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min)
}
