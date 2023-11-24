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
      users: [],
      channelId: 'channel_id'
    }
  }
  return deleteGuardData
}

const saveDeleteGuardData = (guildId, deleteGuardData) => {
  fs.writeFileSync(getDeleteGuardPath(guildId), JSON.stringify(deleteGuardData))
}

const addUIDDeleteGuardData = (userId, deleteGuardData) => {
  if (!isUIDInDeleteGuardData(userId, deleteGuardData)) {
    deleteGuardData.users.push(userId)
  }
  return deleteGuardData
}

const isUIDInDeleteGuardData = (userId, deleteGuardData) => {
  return deleteGuardData.users.find(id => userId === id) != null
}

const removeUIDInDeleteGuardData = (userId, deleteGuardData) => {
  deleteGuardData.users = deleteGuardData.users.filter(id => userId !== id)
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
