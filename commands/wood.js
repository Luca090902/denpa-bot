const Discord = require('discord.js')
const Dmpcfg = require('../backups/dmpconfig.json')
const fs = require('fs')
const PATH = './backups/dmpconfig.json'
module.exports = {
  name: 'wood',
  aliases: [Dmpcfg.woodemoji],
  run: async (client, message, args) => {
    const hasPermissions =
      message.member.permissions.has(Discord.PermissionsBitField.Flags.Administrator) ||
      message.member.permissions.has(Discord.PermissionsBitField.Flags.ManageRoles)

    if (hasPermissions && args.length > 1) {
      if (args[0] === 'set' && !isNaN(args[1]) && args[1] > 0) {
        Dmpcfg.woodthreshold = args[1]
        fs.writeFileSync(PATH, JSON.stringify(Dmpcfg, null, '\t'))
        return message.channel.send(`${client.emotes.success} | wood minimum set to ${args[1]}`)
      } else if (args[0] === 'channel') {
        Dmpcfg.woodchannelid = args[1]
        fs.writeFileSync(PATH, JSON.stringify(Dmpcfg, null, '\t'))
        return message.channel.send(`${client.emotes.success} | wood channel changed`)
      } else {
        return message.channel.send(`wood minimum ${Dmpcfg.woodthreshold} | wood channel ${Dmpcfg.woodchannelid}.`)
      }
    } else {
      return message.channel.send(':wood: :shark: :sob: :sob: :sob:')
    }
  }
}
