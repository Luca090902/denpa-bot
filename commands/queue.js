const Discord = require('discord.js')
module.exports = {
  name: 'queue',
  aliases: ['q'],
  run: async (client, message, args) => {
    try {
      const queue = client.distube.getQueue(message)
      if (!queue) return message.channel.send(`${client.emotes.error} | There is nothing playing!`)
      if (queue.songs.length > 0) {
        var np = `${queue.songs[0].name} - \`${queue.songs[0].formattedDuration}\``
      }
      var page = 0
      var pages = 0
      if (isNaN(args[0])) {
        page = 0
      } else {
        page = args[0] - 1;
      }
      //11 and -2 because must account for NP song 
      pages = queue.songs.length <= 11 ? 1 : 1 + Math.trunc((queue.songs.length - 2) / 10);
      if (page >= pages) page = pages - 1;
      var q = queue.songs
        .slice(1 + (page * 10), 1 + ((page + 1) * 10))
        .map((song, i) => `${(page * 10) + i + 1}. ${song.name} - \`${song.formattedDuration}\``)
        .join('\n');

      if (q == '') q = 'Queue is empty'
      const str = `${client.emotes.queue} | **Server Queue**\n${q}`
      const queueEmbed = new Discord.EmbedBuilder()
        .setColor(0x0099FF)
        .setTitle('Now playing')
        .setDescription(np)
        .addFields(
          { name: 'Queue', value: q },
        )
        // .setTimestamp()
        .setFooter({ text: `Page: ${page + 1} of ${pages}` });

      message.channel.send({ embeds: [queueEmbed] });
    } catch (e) {
      message.channel.send(`${client.emotes.error} | ${e}`)
    }

  }
}
