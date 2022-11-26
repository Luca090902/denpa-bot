module.exports = {
  name: 'skip',
  aliases: ['s'],
  inVoiceChannel: true,
  run: async (client, message, args) => {
    const queue = client.distube.getQueue(message)
    if (!queue) return message.channel.send(`${client.emotes.error} | There is nothing in the queue right now!`)
    var arg = args.join();
    try {
      if (isNaN(arg)) {
        if (arg.includes('-')) {
          var argsRange = arg.split('-')
          var rBegin = argsRange[0]
          var rEnd = argsRange[1]
          await queue._taskQueue.queuing();
          try {
            rEnd = rEnd >= queue.songs.length ? queue.songs.length - 1 : rEnd;
            var skippedsongs = queue.songs.splice(rBegin, rEnd - rBegin + 1);
            message.channel.send(`${client.emotes.success} | Skipped songs ${rBegin} to ${rEnd}`)
          } finally {
            queue._taskQueue.resolve();
          }
        } else {
          const song = await queue.skip()
          message.channel.send(`${client.emotes.success} | Skipped! Now playing:\n${song.name}`)
        }
      }
      else {
        await queue._taskQueue.queuing();
        try {
          if (arg < 0) {
            var skippedsongs = queue.songs.splice(arg);
            message.channel.send(`${client.emotes.success} | Skipped song ${Math.abs(arg)} from the end of the playlist`)
          } else {
            if (arg >= queue.songs.length) {
              message.channel.send(`${client.emotes.error} | Not found. No song has been skipped.`)
            } else {
              var skippedsong = queue.songs.splice(arg, 1);
              message.channel.send(`${client.emotes.success} | Skipped song ${skippedsong[0].name}`)
            }
          }

        } finally {
          queue._taskQueue.resolve();
        }
      }
    } catch (e) {
      message.channel.send(`${client.emotes.error} | ${e}`)
    }
  }
}
