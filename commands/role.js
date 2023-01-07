const Discord = require('discord.js')

module.exports = {
  name: 'role',
  aliases: ['broadcast', 'syntonize', 'roles'],
  run: async (client, message, args) => {
    try {
      let msg = ''
      if (args.length === 0) {
        // No args, list
        message.guild.roles.cache.forEach(role => console.log(role.name, role.id))
        msg = message.guild.roles.cache.map((role, i) => `${role.name}`).join(', ')
      } else if (args.length > 0) {
        const role = args.join(' ')
        await message.member.roles.add(message.member.guild.roles.cache.find(i => i.name === role))
        console.log(`self role ${role} added to ${message.member.user.username}`)
        msg = `${client.emotes.denpabot} | ${message.member.user.username} established connection with ${role}`
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
