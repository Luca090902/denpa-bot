const {
  getDeleteGuardData,
  saveDeleteGuardData,
  addUIDDeleteGuardData,
  isUIDInDeleteGuardData,
  removeUIDInDeleteGuardData
} = require('../classes/deleteGuardUtils.js')
const Discord = require('discord.js')

const addDeleteGuard = (user, guildId, message) => {
  let deleteGuardData = getDeleteGuardData(guildId)

  deleteGuardData = addUIDDeleteGuardData(user, deleteGuardData)
  saveDeleteGuardData(guildId, deleteGuardData)

  message.channel.send(`${user} added successfully.`)
}

const removeDeleteGuard = (user, guildId, message) => {
  let deleteGuardData = getDeleteGuardData(guildId)

  if (isUIDInDeleteGuardData(user.id, deleteGuardData)) {
    deleteGuardData = removeUIDInDeleteGuardData(user.id, deleteGuardData)
    saveDeleteGuardData(guildId, deleteGuardData)
    message.channel.send(`${user} removed successfully.`)
  } else {
    message.channel.send(`${user} was not in the list.`)
  }
}

const listDeleteGuard = (user, guildId, message) => {
  const deleteGuardData = getDeleteGuardData(guildId)

  const userIds = Object.keys(deleteGuardData.users).map(
    userId => `${deleteGuardData.users[userId].latestTag} (${userId})`
  )

  const roleItemsPerPage = 20
  const msgs = []
  const numPages = Math.ceil(userIds.length / roleItemsPerPage)

  for (let i = 0; i < numPages; i++) {
    const pageIdx = i * roleItemsPerPage
    msgs.push(userIds.slice(pageIdx, pageIdx + roleItemsPerPage).join(', '))
  }

  if (msgs.length === 0) {
    msgs.push('[Empty]')
  }

  msgs.forEach(msg => {
    const queueEmbed = new Discord.EmbedBuilder()
      .setColor(0x0099ff)
      // .setTitle('Roles')
      .setDescription(' ')
      // will sometimes fail if `msg` is an empty string (why?????)
      .addFields({ name: 'DeleteGuard: UIDs', value: msg.length === 0 ? '[Empty]' : msg })
    message.channel.send({ embeds: [queueEmbed] })
  })
}

module.exports = {
  name: 'deleteguard',
  aliases: [],
  inVoiceChannel: false,
  run: async (client, message, args) => {
    const user = message.mentions.users.size > 0 ? Array.from(message.mentions.users.values())[0] : null
    const guildId = message.guildId

    const hasPermissions =
      message.member.permissions.has(Discord.PermissionsBitField.Flags.Administrator) ||
      message.member.permissions.has(Discord.PermissionsBitField.Flags.ManageRoles)

    if (hasPermissions) {
      if (args.length > 0) {
        if (args[0] === 'add' && user != null) {
          addDeleteGuard(user, guildId, message)
        } else if (args[0] === 'remove' && user != null) {
          removeDeleteGuard(user, guildId, message)
        } else {
          message.channel.send('Please use the following commands: add <user> | remove <user> | <none> (list)')
        }
      } else {
        listDeleteGuard(user, guildId, message)
      }
    } else {
      message.channel.send(':wood: :shark: :sob: :sob: :sob:')
    }
  }
}
