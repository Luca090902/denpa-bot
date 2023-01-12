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
        msg = message.guild.roles.cache.map(role => `${role.name}`).join(', ')
      } else if (args.length > 0) {
        const roleSelected = args.length > 1 ? args.splice(1, args.length).join(' ') : args.join(' ')

        // https://stackoverflow.com/questions/40999025/javascript-scope-variable-to-switch-case (lmao)
        switch (args[0]) {
          case 'remove': {
            const found = findRole(message.member.guild.roles, roleSelected)

            // Anti-IDoApologise measure
            if (Dmpcfg.roleblacklist.includes(found.name)) {
              msg`${client.emotes.error} | Not allowed`
              break
            }

            await message.member.roles.remove(found)

            msg = `${client.emotes.denpabot} | ${message.member.user.username} is no longer in tune with ${found.name}`
          } break;

          case 'blacklist':
          case 'bl': {
            const hasPermissions = message.member.permissions.has(Discord.PermissionsBitField.Flags.Administrator)
              || message.member.permissions.has(Discord.PermissionsBitField.Flags.ManageRoles)

            if (roleSelected === "bl" || roleSelected === "blacklist") {
              msg = Dmpcfg.roleblacklist.map(role => `${role}`).join(', ')
              break
            }

            if (!hasPermissions) {
              msg = `${client.emotes.error} | Not allowed`
              break
            }

            const found = findRole(message.member.guild.roles, roleSelected)

            if (found !== undefined) {
              if (Dmpcfg.roleblacklist.includes(found.name)) {
                msg = `${client.emotes.error} | Already blacklisted`
                break;
              }

              Dmpcfg.roleblacklist.push(found.name)

              fs.writeFileSync(PATH, JSON.stringify(Dmpcfg, null, '\t'))
              msg = `${client.emotes.denpabot} | blacklisted role ${found.name}`
            } else {
              msg = `${client.emotes.error} | Role doesn't exist`
            }
          } break;

          case 'unblacklist':
          case 'unbl': {
            const hasPermissions = message.member.permissions.has(Discord.PermissionsBitField.Flags.Administrator)
              || message.member.permissions.has(Discord.PermissionsBitField.Flags.ManageRoles)

            if (!hasPermissions) {
              msg = `${client.emotes.error} | Not allowed`
              break;
            }

            const found = findRole(message.member.guild.roles, roleSelected)

            if (found !== undefined) {
              if (Dmpcfg.roleblacklist.includes(found.name)) {
                Dmpcfg.roleblacklist = Dmpcfg.roleblacklist.filter(e => e !== found.name)

                fs.writeFileSync(PATH, JSON.stringify(Dmpcfg, null, '\t'))
                msg = `${client.emotes.denpabot} | unblacklisted role ${found.name}`
              } else {
                msg = `${client.emotes.error} | Not blacklisted`
              }
            } else {
              msg = `${client.emotes.error} | Role doesn't exist`
            }

          } break;

          case 'add':
          default: {
            const found = findRole(message.member.guild.roles, roleSelected)
            await message.member.roles.add(found)

            // TODO: Add ability for an admin to add a role this way? 
            if (!Dmpcfg.roleblacklist.includes(found.name)) {
              msg = `${client.emotes.denpabot} | ${message.member.user.username} established connection with ${found.name}`
            } else {
              msg = `${client.emotes.error} | Not allowed`
            }
          } break;
        }
      }
      const queueEmbed = new Discord.EmbedBuilder()
        .setColor(0x0099ff)
        // .setTitle('Roles')
        .setDescription(' ')
        .addFields({ name: 'Roles', value: msg })

      message.channel.send({ embeds: [queueEmbed] })
    } catch (e) {
      message.channel.send(`${client.emotes.error} | Frequency out of range: ${e}`)
    }
  }
}

/** case-insensitive role search */
const findRole = (roles, needle) => {
  const needleLower = needle.toLowerCase()
  return roles.cache.find(r => r.name.toLowerCase() === needleLower)
}
