const { getCumStats, saveCumStats } = require('../classes/cumUtils.js')
const { getUserPingString } = require('../classes/utils.js')
const { emoji } = require('../config.json')

module.exports = {
  name: 'cum',
  aliases: [],
  inVoiceChannel: false,
  run: async (client, message, args) => {
    const userSender = message.author
    if (message.mentions.users.size === 0) {
      message.channel.send(`${getUserPingString(userSender.id)} Please specify who you want to cum on! :cat1:`)
      return
    }

    const userRecipient = Array.from(message.mentions.users.values())[0]
    const cumStats = getCumStats(message.guildId)

    message.channel.send(
      `Oh no! ${getUserPingString(userSender.id)} has cummed on ${getUserPingString(userRecipient.id)} ${emoji.cat1} ${
        emoji.UwU
      } :drool: ${emoji.cunny}`
    )

    if (userSender.id === userRecipient.id) {
      cumStats.totalSelfCums += 1
    }

    cumStats.totalCums += 1
    if (userSender.id === userRecipient.id) {
      cumStats.totalSelfCums += 1
    }

    // usersWhoCummed
    if (cumStats.usersWhoCummed[userSender.id] == null) {
      cumStats.usersWhoCummed[userSender.id] = {
        numCums: 0,
        users: {}
      }
    }
    const usersWhoCummedData = cumStats.usersWhoCummed[userSender.id]
    usersWhoCummedData.numCums += 1
    if (usersWhoCummedData.users[userRecipient.id] == null) {
      usersWhoCummedData.users[userRecipient.id] = {
        numOccurences: 0,
        latestTag: ''
      }
    }
    usersWhoCummedData.users[userRecipient.id].numOccurences += 1
    usersWhoCummedData.users[userRecipient.id].latestTag = userRecipient.tag

    // cummedOnUsers
    if (cumStats.cummedOnUsers[userRecipient.id] == null) {
      cumStats.cummedOnUsers[userRecipient.id] = {
        numCums: 0,
        users: {}
      }
    }
    const cummedOnUserData = cumStats.cummedOnUsers[userRecipient.id]
    cummedOnUserData.numCums += 1
    if (cummedOnUserData.users[userSender.id] == null) {
      cummedOnUserData.users[userSender.id] = {
        numOccurences: 0,
        latestTag: ''
      }
    }
    cummedOnUserData.users[userSender.id].numOccurences += 1
    cummedOnUserData.users[userSender.id].latestTag = userSender.tag

    // save data
    saveCumStats(message.guildId, cumStats)
  }
}
