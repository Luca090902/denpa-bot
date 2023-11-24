const {
  getDeleteGuardData,
  saveDeleteGuardData,
  addUIDDeleteGuardData,
  isUIDInDeleteGuardData,
  removeUIDInDeleteGuardData
} = require('../classes/deleteGuardUtils.js')
const Discord = require('discord.js')

const addDeleteGuard = (user, guildId, message) => {
  const deleteGuardData = getDeleteGuardData(guildId)
  addUIDDeleteGuardData(user.id, deleteGuardData)
  saveDeleteGuardData(guildId, deleteGuardData)

  message.channel.send(`${user} added successfully.`)
}

const removeDeleteGuard = (user, guildId, message) => {
  const deleteGuardData = getDeleteGuardData(guildId)

  if (isUIDInDeleteGuardData(user.id, deleteGuardData)) {
    removeUIDInDeleteGuardData(user.id, deleteGuardData)
    saveDeleteGuardData(guildId, deleteGuardData)
    message.channel.send(`${user} removed successfully.`)
  } else {
    message.channel.send(`${user} was not in the list.`)
  }
}

const setChannelIdDeleteGuard = (channelId, guildId, message) => {
  const deleteGuardData = getDeleteGuardData(guildId)
  deleteGuardData.channelId = channelId
  saveDeleteGuardData(guildId, deleteGuardData)
}

const listDeleteGuard = (user, guildId, client, message) => {
  const deleteGuardData = getDeleteGuardData(guildId)

  const userIds = deleteGuardData.users.map(userId => {
    const user = client.users.cache.get(userId)
    return `${user.username} (${userId})`
  })
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

  msgs.forEach((msg, idx) => {
    const queueEmbed = new Discord.EmbedBuilder()
      .setColor(0x0099ff)
      .setTitle('DeleteGuard Configs')
      // .setTitle('Roles')
      .setDescription(' ')

    if (idx === 0) {
      if (/^\d{18}$/.test(deleteGuardData.channelId)) {
        const channel = client.channels.cache.get(deleteGuardData.channelId)
        queueEmbed.addFields({ name: 'Channel', value: `#${channel.name} (${channel.id})` })
      } else {
        queueEmbed.addFields({ name: 'Channel', value: '[Empty]' })
      }
    }

    // will sometimes fail if `msg` is an empty string (why?????)
    queueEmbed.addFields({ name: 'UIDs', value: msg.length === 0 ? '[Empty]' : msg })

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
        } else if (args[0] === 'set') {
          const channelId = args[1].match(/\d{18}/).shift()
          if (channelId) {
            setChannelIdDeleteGuard(channelId, guildId, message)
          } else {
            message.channel.send('Expected a channelId')
          }
        } else {
          message.channel.send(
            'Please use the following commands: add <user> | remove <user> | set <channelId> | <none> (list)'
          )
        }
      } else {
        listDeleteGuard(user, guildId, client, message)
      }
    } else {
      message.channel.send(':wood: :shark: :sob: :sob: :sob:')
    }
  }
}
