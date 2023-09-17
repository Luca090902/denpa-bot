const { getCumStats, getMostCommonUserData } = require('../classes/cumUtils.js')
const { emoji } = require('../config.json')
const Discord = require('discord.js')

const cunnyPointPngUrl =
  'https://media.discordapp.net/attachments/856649672117583875/1150930157750722650/F5w7qXvaIAALzwy.png?width=1410&height=1168'

module.exports = {
  name: 'cumstats',
  aliases: [],
  invoiceChannel: false,
  run: async (client, message, args) => {
    const cumStats = getCumStats(message.guildId)

    // override if another user is specified
    let user = message.author
    if (message.mentions.users.size > 0) {
      user = Array.from(message.mentions.users.values())[0]
    }

    const usersWhoCummedData = cumStats.usersWhoCummed[user.id] || {}
    const cummedOnUsersData = cumStats.cummedOnUsers[user.id] || {}

    const mostCummedOnUserData = getMostCommonUserData(usersWhoCummedData.users || {})
    const mostCommonUserWhoCummed = getMostCommonUserData(cummedOnUsersData.users || {})

    const exampleEmbed = new Discord.EmbedBuilder()
      .setColor(0xffffff)
      .setAuthor({
        name: `${user.tag} | ${emoji.wood} ${emoji.same} tbh`,
        iconURL: user.displayAvatarURL()
      })
      .setDescription("Here are this user's cum stats!")
      .setThumbnail(cunnyPointPngUrl)
      .addFields(
        { name: '# of times cummed', value: `${usersWhoCummedData.numCums || 0}`, inline: true },
        { name: '# of times cummed on', value: `${cummedOnUsersData.numCums || 0}`, inline: true },
        {
          name: 'most cummed on user by you',
          value: `${mostCummedOnUserData.latestTag} (${mostCummedOnUserData.numOccurences})`,
          inline: false
        },
        {
          name: 'user who cummed on you the most',
          value: `${mostCommonUserWhoCummed.latestTag} (${mostCommonUserWhoCummed.numOccurences})`,
          inline: false
        }
      )
      .setTimestamp()
      .setFooter({ text: 'cummies :))', iconURL: cunnyPointPngUrl })

    message.channel.send({ embeds: [exampleEmbed] })
  }
}
