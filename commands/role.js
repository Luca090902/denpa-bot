const Discord = require('discord.js')
const fs = require('fs')

module.exports = {
  name: 'role',
  aliases: ['broadcast', 'syntonize', 'roles'],
  run: async (client, message, args) => {
    try {
      const blacklistPath = getBlacklistPath(message.guildId)

      let blacklist = []

      let blacklistStr
      try {
        blacklistStr = fs.readFileSync(blacklistPath, { encoding: 'utf-8' })
      } catch (e) {} // it's cool if this fails

      if (blacklistStr !== undefined) blacklist = JSON.parse(blacklistStr)

      const hasPermissions =
        message.member.permissions.has(Discord.PermissionsBitField.Flags.Administrator) ||
        message.member.permissions.has(Discord.PermissionsBitField.Flags.ManageRoles)

      let msg = ''
      if (args.length === 0) {
        // No args, list

        let roles = message.guild.roles.cache.map(role => role.name)
        roles = !hasPermissions ? roles.filter(name => !blacklist.includes(name)) : roles

        msg = roles.join(', ')
      } else if (args.length > 0) {
        const roleSelected = args.length > 1 ? args.splice(1, args.length).join(' ') : args.join(' ')

        // https://stackoverflow.com/questions/40999025/javascript-scope-variable-to-switch-case (lmao)
        switch (args[0]) {
          case 'remove':
            {
              const found = findRole(message.member.guild.roles, roleSelected)

              // Anti-IDoApologise measure
              if (blacklist.includes(found.name)) {
                msg = `${client.emotes.error} | Not allowed`
                break
              }

              await message.member.roles.remove(found)

              msg = `${client.emotes.denpabot} | ${message.member.user.username} is no longer in tune with ${found.name}`
            }
            break

          case 'blacklist':
          case 'bl':
            {
              if (roleSelected === 'bl' || roleSelected === 'blacklist') {
                msg = blacklist.map(role => `${role}`).join(', ')
                break
              }

              if (!hasPermissions) {
                msg = `${client.emotes.error} | Not allowed`
                break
              }

              const found = findRole(message.member.guild.roles, roleSelected)

              if (found !== undefined) {
                if (blacklist.includes(found.name)) {
                  msg = `${client.emotes.error} | Already blacklisted`
                  break
                }

                blacklist.push(found.name)

                fs.writeFileSync(blacklistPath, JSON.stringify(blacklist))
                msg = `${client.emotes.denpabot} | blacklisted role ${found.name}`
              } else {
                msg = `${client.emotes.error} | Role doesn't exist`
              }
            }
            break

          case 'unblacklist':
          case 'unbl':
            {
              if (!hasPermissions) {
                msg = `${client.emotes.error} | Not allowed`
                break
              }

              const found = findRole(message.member.guild.roles, roleSelected)

              if (found !== undefined) {
                if (blacklist.includes(found.name)) {
                  blacklist = blacklist.filter(e => e !== found.name)

                  fs.writeFileSync(blacklistPath, JSON.stringify(blacklist))
                  msg = `${client.emotes.denpabot} | unblacklisted role ${found.name}`
                } else {
                  msg = `${client.emotes.error} | Not blacklisted`
                }
              } else {
                msg = `${client.emotes.error} | Role doesn't exist`
              }
            }
            break

          case 'add':
          default:
            {
              const found = findRole(message.member.guild.roles, roleSelected)

              // TODO: Add ability for an admin to add a role this way?
              if (!blacklist.includes(found.name)) {
                await message.member.roles.add(found)
                msg = `${client.emotes.denpabot} | ${message.member.user.username} established connection with ${found.name}`
              } else {
                msg = `${client.emotes.error} | Not allowed`
              }
            }
            break
        }
      }

      const queueEmbed = new Discord.EmbedBuilder()
        .setColor(0x0099ff)
        // .setTitle('Roles')
        .setDescription(' ')
        // will sometimes fail if `msg` is an empty string (why?????)
        .addFields({ name: 'Roles', value: msg.length === 0 ? '[Empty]' : msg })

      message.channel.send({ embeds: [queueEmbed] })
    } catch (e) {
      console.error('Role Error!! TODO: Debug and remove\n')
      console.debug(e)
      console.trace()

      message.channel.send(`${client.emotes.error} | Frequency out of range`)
    }
  }
}

/** case-insensitive role search */
const findRole = (roles, needle) => {
  const needleLower = needle.toLowerCase()
  return roles.cache.find(r => r.name.toLowerCase() === needleLower)
}

const getBlacklistPath = guildId => {
  return `./backups/blacklist_${guildId}.json`
}
