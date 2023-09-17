const SensitiveCharacters = ['\\', '*', '_', '~', '`', '|', '>']

const sanitizeDiscordString = function (text) {
  SensitiveCharacters.forEach(unsafechar => {
    text = text.replace(unsafechar, `\\${unsafechar}`)
  })
  return text
}

const getUserPingString = userId => `<@${userId}>`

module.exports = {
  sanitizeDiscordString,
  getUserPingString
}
