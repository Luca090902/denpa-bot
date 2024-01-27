const Discord = require('discord.js')
const fs = require('fs')
const config = require('../config.json')

const getCringeConfig = path => {
  let cringeConfig = config.defaultCringeConfig

  try {
    const file = fs.readFileSync(path, { encoding: 'utf-8' })
    cringeConfig = JSON.parse(file)
  } catch (e) {} // ignore error

  // An older ver. of wood.json didn't have a message property, so ensure that it exists
  if (cringeConfig.messages === undefined) cringeConfig.messages = []

  return cringeConfig
}

const saveCringeConfig = (path, cringeConfig) => {
  fs.writeFileSync(path, JSON.stringify(cringeConfig))
}

const getCringePath = guildId => {
  return `./backups/cringe_${guildId}.json`
}

module.exports = {
  name: 'cringe',
  aliases: [config.emoji.cringe],
  run: async (client, message, args) => {
    const cringePath = getCringePath(message.guildId)
    const cringeConfig = getCringeConfig(cringePath)

    const hasPermissions =
      message.member.permissions.has(Discord.PermissionsBitField.Flags.Administrator) ||
      message.member.permissions.has(Discord.PermissionsBitField.Flags.ManageRoles)

    if (hasPermissions && args.length > 1) {
      if (args[0] === 'set' && !isNaN(args[1]) && args[1] > 0) {
        cringeConfig.threshold = args[1]
        saveCringeConfig(cringePath, cringeConfig)

        return message.channel.send(`${client.emotes.success} | cringe minimum set to ${args[1]}`)
      } else if (args[0] === 'timeout' && !isNaN(args[1]) && args[1] > 0) {
        cringeConfig.timeoutTime = args[1]
        saveCringeConfig(cringePath, cringeConfig)

        return message.channel.send(`${client.emotes.success} | cringe timeout set to ${args[1]} seconds :alarm_clock:`)
      } else if (args[0] === 'channel') {
        if (!/\d+/.test(args[1])) {
          return message.channel.send(
            `${client.emotes.error} | Expected a Channel ID (digits only). Received "${args[1]}"`
          )
        }

        cringeConfig.channelId = args[1]
        saveCringeConfig(cringePath, cringeConfig)

        return message.channel.send(`${client.emotes.success} | cringe channel changed`)
      } else {
        return message.channel.send(
          `cringe minimum ${cringeConfig.threshold} | cringe channel ${cringeConfig.channelId}.`
        )
      }
    } else {
      return message.channel.send(':red_circle: :red_circle: :red_circle: :red_circle: :red_circle:')
    }
  },

  config: getCringeConfig,
  path: getCringePath,
  save: saveCringeConfig
}
