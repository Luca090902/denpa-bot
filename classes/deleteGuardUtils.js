const fs = require('fs')

const getDeleteGuardPath = guildId => {
  return `./backups/deleteguard_${guildId}.json`
}

const getDeleteGuardData = guildId => {
  let deleteGuardData
  try {
    const file = fs.readFileSync(getDeleteGuardPath(guildId), { encoding: 'utf-8' })
    deleteGuardData = JSON.parse(file)
  } catch (e) {
    // default deleteGuardData
    deleteGuardData = {
      users: {
        // <userId>: { latestTag: '' }
      }
    }
  }
  return deleteGuardData
}

const saveDeleteGuardData = (guildId, deleteGuardData) => {
  fs.writeFileSync(getDeleteGuardPath(guildId), JSON.stringify(deleteGuardData))
}

const addUIDDeleteGuardData = (user, deleteGuardData) => {
  deleteGuardData.users[user.id] = {
    latestTag: user.tag
  }
  return deleteGuardData
}

const isUIDInDeleteGuardData = (userId, deleteGuardData) => {
  return Object.keys(deleteGuardData.users).find(id => userId === id) != null
}

const removeUIDInDeleteGuardData = (userId, deleteGuardData) => {
  Object.keys(deleteGuardData.users).forEach(userId => {
    delete deleteGuardData.users[userId]
  })
  return deleteGuardData
}

module.exports = {
  getDeleteGuardPath,
  getDeleteGuardData,
  saveDeleteGuardData,
  addUIDDeleteGuardData,
  isUIDInDeleteGuardData,
  removeUIDInDeleteGuardData
}
