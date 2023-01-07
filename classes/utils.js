const SensitiveCharacters = ['\\', '*', '_', '~', '`', '|', '>']

const sanitizeDiscordString = function (text) {
  SensitiveCharacters.forEach(unsafechar => {
    text = text.replace(unsafechar, `\\${unsafechar}`)
  })
  return text
}

module.exports = {
  sanitizeDiscordString
}
