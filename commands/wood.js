const Discord = require('discord.js')
const fs = require('fs')
const config = require('../config.json')

module.exports = {
  name: 'wood',
  aliases: [config.emoji.wood],
  run: async (client, message, args) => {
    const woodConfigPath = getWoodPath(message.guildId)
    let woodConfig = config.defaultWoodConfig

    try {
      const configFile = fs.readFileSync(woodConfigPath, { encoding: 'utf-8' })
      woodConfig = JSON.parse(configFile)
    } catch (e) {} // ignore error

    const hasPermissions =
      message.member.permissions.has(Discord.PermissionsBitField.Flags.Administrator) ||
      message.member.permissions.has(Discord.PermissionsBitField.Flags.ManageRoles)

    if (hasPermissions && args.length > 1) {
      if (args[0] === 'set' && !isNaN(args[1]) && args[1] > 0) {
        woodConfig.threshold = args[1]
        fs.writeFileSync(woodConfigPath, JSON.stringify(woodConfig))

        return message.channel.send(`${client.emotes.success} | wood minimum set to ${args[1]}`)
      } else if (args[0] === 'channel') {
        if (!/\d+/.test(args[1])) {
          return message.channel.send(
            `${client.emotes.error} | Expected a Channel ID (digits only). Received "${args[1]}"`
          )
        }

        woodConfig.channelId = args[1]
        fs.writeFileSync(woodConfigPath, JSON.stringify(woodConfig))

        return message.channel.send(`${client.emotes.success} | wood channel changed`)
      } else {
        return message.channel.send(`wood minimum ${woodConfig.threshold} | wood channel ${woodConfig.channelId}.`)
      }
    } else {
      return message.channel.send(':wood: :shark: :sob: :sob: :sob:')
    }
  }
}

const getWoodPath = guildId => {
  return `./backups/wood_${guildId}.json`
}
