const { getCumStats, saveCumStats } = require('../classes/cumUtils.js')
const { getUserPingString } = require('../classes/utils.js')

module.exports = {
  name: 'cum',
  aliases: [],
  inVoiceChannel: false,
  run: async (client, message, args) => {
    const userSender = message.author
    const userRecipient = message.mentions.users.size > 0 ? Array.from(message.mentions.users.values())[0] : userSender
    const cumStats = getCumStats(message.guildId)

    if (userSender === userRecipient) {
      cumStats.totalSelfCums += 1
      message.channel.send(
        `Oh no! ${getUserPingString(userSender.id)} has cummed on themselves! ${client.emotes.cat1} ${
          client.emotes.UwU
        } :drool: ${client.emotes.cunny}`
      )
    } else {
      message.channel.send(
        `Oh no! ${getUserPingString(userSender.id)} has cummed on ${getUserPingString(userRecipient.id)}! ${
          client.emotes.cat1
        } ${client.emotes.UwU} :drool: ${client.emotes.cunny}`
      )
    }
    cumStats.totalCums += 1

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
