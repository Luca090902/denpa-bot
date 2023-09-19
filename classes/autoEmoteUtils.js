const createGeneralizedRegex = text => new RegExp(`${text.split('').join('\\W*')}`, 'i')

const setupAutoReact = (message, text, emote) => {
  if (createGeneralizedRegex(text).test(message.content)) {
    message
      .react(`${emote}`)
      .then(() => {
        console.info(`reacted with ${emote} to: a message by ${message.author.tag}`)
      })
      .catch(e => console.error(`${emote} failed: ${e}`))
  }
}

module.exports = {
  setupAutoReact
}
