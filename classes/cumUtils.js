/*
cumStats is of the following type

type UsersCummedData = {
  [userId: number]: {
    numCums: number,
    users: {
      [userId: number]: {
        numOccurences: number,
        latestTag; string
      }
    }
  }
}

type cumStats = {
  totalCums: number,
  totalSelfCums: number,
  usersWhoCummed: UsersCummedData,
  cummedOnUsers: UsersCummedData,
}
*/
const fs = require('fs')

const getCumPath = guildId => {
  return `./backups/cum_${guildId}.json`
}

const getCumStats = guildId => {
  let cumStats
  try {
    const file = fs.readFileSync(getCumPath(guildId), { encoding: 'utf-8' })
    cumStats = JSON.parse(file)
  } catch (e) {
    // default cumStats
    cumStats = {
      totalCums: 0,
      totalSelfCums: 0,
      usersWhoCummed: {},
      cummedOnUsers: {}
    }
  }
  return cumStats
}

const saveCumStats = (guildId, cumStats) => {
  fs.writeFileSync(getCumPath(guildId), JSON.stringify(cumStats))
}

const getMostCommonUserData = userData => {
  return Object.keys(userData).reduce(
    (accumulator, curUserId) => {
      return userData[curUserId].numOccurences > accumulator.numOccurences ? userData[curUserId] : accumulator
    },
    {
      numOccurences: 0,
      latestTag: ''
    }
  )
}

module.exports = {
  getCumPath,
  getCumStats,
  saveCumStats,
  getMostCommonUserData
}
