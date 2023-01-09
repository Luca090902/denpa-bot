const Discord = require('discord.js')
const Dmpcfg = require('./../dmpconfig.json')
const fs = require('fs')
const PATH = './dmpconfig.json'
module.exports = {
  name: 'role',
  aliases: ['broadcast', 'syntonize', 'roles'],
  run: async (client, message, args) => {
    try {
      let msg = ''
      if (args.length === 0) {
        // No args, list
        // message.guild.roles.cache.forEach(role => console.log(role.name, role.id))
        msg = message.guild.roles.cache.map((role, i) => `${role.name}`).join(', ')
      } else if (args.length > 0) {
        const roleSelected = args.length > 1 ? args.splice(1, args.length).join(' ') : args.join(' ')
        switch (args[0]) {
          case 'remove':
            await message.member.roles.remove(message.member.guild.roles.cache.find(i => i.name === roleSelected))
            msg = `${client.emotes.denpabot} | ${message.member.user.username} is no longer in tune with ${roleSelected}`
            break
          case 'blacklist':
          case 'bl':
            if (roleSelected === 'bl' || roleSelected === 'blacklist') {
              msg = Dmpcfg.roleblacklist.map((role, i) => `${role}`).join(', ')
            } else if (
              message.member.permissions.has(Discord.PermissionsBitField.Flags.Administrator) ||
              message.member.permissions.has(Discord.PermissionsBitField.Flags.ManageRoles)
            ) {
              if (message.member.guild.roles.cache.find(i => i.name === roleSelected) > 0) {
                if (!Dmpcfg.roleblacklist.includes(roleSelected)) {
                  Dmpcfg.roleblacklist.push(roleSelected)
                  fs.writeFileSync(PATH, JSON.stringify(Dmpcfg, null, '\t'))
                  msg = `${client.emotes.denpabot} | blacklisted role ${roleSelected}`
                } else {
                  msg = `${client.emotes.error} | Already blacklisted`
                }
              } else {
                msg = `${client.emotes.error} | Role doesn't exists`
              }
            } else {
              msg = `${client.emotes.error} | Not allowed`
            }
            break
          case 'unblacklist':
          case 'unbl':
            if (
              message.member.permissions.has(Discord.PermissionsBitField.Flags.Administrator) ||
              message.member.permissions.has(Discord.PermissionsBitField.Flags.ManageRoles)
            ) {
              if (message.member.guild.roles.cache.find(i => i.name === roleSelected) > 0) {
                if (Dmpcfg.roleblacklist.includes(roleSelected)) {
                  Dmpcfg.roleblacklist = Dmpcfg.roleblacklist.filter(e => e !== roleSelected)
                  fs.writeFileSync(PATH, JSON.stringify(Dmpcfg, null, '\t'))
                  msg = `${client.emotes.denpabot} | unblacklisted role ${roleSelected}`
                } else {
                  msg = `${client.emotes.error} | Not blacklisted`
                }
              } else {
                msg = `${client.emotes.error} | Role doesn't exists`
              }
            } else {
              msg = `${client.emotes.error} | Not allowed`
            }

            break
          case 'add':
          default:
            if (!Dmpcfg.roleblacklist.includes(roleSelected)) {
              await message.member.roles.add(message.member.guild.roles.cache.find(i => i.name === roleSelected))
              msg = `${client.emotes.denpabot} | ${message.member.user.username} established connection with ${roleSelected}`
            } else {
              msg = `${client.emotes.error} | Not allowed`
            }
            break
        }
      }
      const queueEmbed = new Discord.EmbedBuilder()
        .setColor(0x0099ff)
        // .setTitle('Roles')
        .setDescription(' ')
        .addFields({ name: 'Roles', value: msg })

      message.channel.send({ embeds: [queueEmbed] })
    } catch (e) {
      message.channel.send(`${client.emotes.error} | Frequency out of range`)
    }
  }
}
