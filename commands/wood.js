const Discord = require('discord.js')
const fs = require('fs')
const config = require('../config.json')

const getWoodConfig = path => {
  let woodConfig = config.defaultWoodConfig

  try {
    const file = fs.readFileSync(path, { encoding: 'utf-8' })
    woodConfig = JSON.parse(file)
  } catch (e) {} // ignore error

  // An older ver. of wood.json didn't have a message property, so ensure that it exists
  if (woodConfig.messages === undefined) woodConfig.messages = []

  return woodConfig
}

const saveWoodConfig = (path, woodConfig) => {
  fs.writeFileSync(path, JSON.stringify(woodConfig))
}

const getWoodPath = guildId => {
  return `./backups/wood_${guildId}.json`
}

module.exports = {
  name: 'wood',
  aliases: [config.emoji.wood],
  run: async (client, message, args) => {
    const woodPath = getWoodPath(message.guildId)
    const woodConfig = getWoodConfig(woodPath)

    const hasPermissions =
      message.member.permissions.has(Discord.PermissionsBitField.Flags.Administrator) ||
      message.member.permissions.has(Discord.PermissionsBitField.Flags.ManageRoles)

    if (hasPermissions && args.length > 1) {
      if (args[0] === 'set' && !isNaN(args[1]) && args[1] > 0) {
        woodConfig.threshold = args[1]
        saveWoodConfig(woodPath, woodConfig)

        return message.channel.send(`${client.emotes.success} | wood minimum set to ${args[1]}`)
      } else if (args[0] === 'channel') {
        if (!/\d+/.test(args[1])) {
          return message.channel.send(
            `${client.emotes.error} | Expected a Channel ID (digits only). Received "${args[1]}"`
          )
        }

        woodConfig.channelId = args[1]
        saveWoodConfig(woodPath, woodConfig)

        return message.channel.send(`${client.emotes.success} | wood channel changed`)
      } else {
        return message.channel.send(`wood minimum ${woodConfig.threshold} | wood channel ${woodConfig.channelId}.`)
      }
    } else {
      return message.channel.send(':wood: :shark: :sob: :sob: :sob:')
    }
  },

  config: getWoodConfig,
  path: getWoodPath,
  save: saveWoodConfig
}
