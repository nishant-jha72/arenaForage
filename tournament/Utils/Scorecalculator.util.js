/**
 * Free Fire Official Placement Points Table
 * Source: Garena Free Fire eSports Tournament Rulebook
 *
 * 1st  (Booyah) → 12 pts
 * 2nd            →  9 pts
 * 3rd            →  8 pts
 * 4th            →  7 pts
 * 5th            →  6 pts
 * 6th            →  5 pts
 * 7th            →  4 pts
 * 8th            →  3 pts
 * 9th            →  2 pts
 * 10th           →  1 pt
 * 11th–12th      →  0 pts
 * Per kill       →  1 pt
 */

const PLACEMENT_POINTS = {
    1: 12,
    2: 9,
    3: 8,
    4: 7,
    5: 6,
    6: 5,
    7: 4,
    8: 3,
    9: 2,
    10: 1,
};

const KILL_POINT = 1;

/**
 * Get placement points for a given position.
 * Positions 11 and above return 0.
 */
const getPlacementPoints = (position) => PLACEMENT_POINTS[position] ?? 0;

/**
 * Calculate score for a single match entry.
 * @param {number} position  - Final placement (1–12)
 * @param {number} kills     - Number of kills
 * @returns {{ placementPoints, killPoints, totalPoints }}
 */
const calcMatchScore = (position, kills) => {
    const placementPoints = getPlacementPoints(position);
    const killPoints = kills * KILL_POINT;
    return {
        placementPoints,
        killPoints,
        totalPoints: placementPoints + killPoints,
    };
};

/**
 * Calculate overall leaderboard from all match scores submitted by admin.
 *
 * @param {Array} matchesData
 * Each element: { matchNumber, teams: [{ teamId, teamName, position, kills }] }
 *
 * @returns {Array} Sorted leaderboard:
 * [{ teamId, teamName, matches, totalKills, totalPlacementPoints, totalKillPoints, totalPoints, rank }]
 */
const calculateLeaderboard = (matchesData) => {
    const teamMap = {}; // teamId → aggregated stats

    for (const match of matchesData) {
        for (const entry of match.teams) {
            const { teamId, teamName, position, kills } = entry;
            const { placementPoints, killPoints, totalPoints } = calcMatchScore(position, kills);

            if (!teamMap[teamId]) {
                teamMap[teamId] = {
                    teamId,
                    teamName,
                    matches: [],
                    totalKills: 0,
                    totalPlacementPoints: 0,
                    totalKillPoints: 0,
                    totalPoints: 0,
                };
            }

            teamMap[teamId].matches.push({
                matchNumber: match.matchNumber,
                position,
                kills,
                placementPoints,
                killPoints,
                totalPoints,
            });

            teamMap[teamId].totalKills           += kills;
            teamMap[teamId].totalPlacementPoints += placementPoints;
            teamMap[teamId].totalKillPoints      += killPoints;
            teamMap[teamId].totalPoints          += totalPoints;
        }
    }

    // Sort: highest totalPoints first. Tiebreaker: most kills.
    const leaderboard = Object.values(teamMap).sort((a, b) => {
        if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
        return b.totalKills - a.totalKills;
    });

    // Assign rank
    leaderboard.forEach((team, index) => {
        team.rank = index + 1;
    });

    return leaderboard;
};

/**
 * Distribute prize pool across ranked teams.
 * prizeDistribution: [{ position: 1, amount: 5000 }, ...]
 *
 * @returns {Array} leaderboard entries enriched with `prizeWon` field
 */
const applyPrizeDistribution = (leaderboard, prizeDistribution = []) => {
    const prizeMap = {};
    for (const entry of prizeDistribution) {
        prizeMap[entry.position] = entry.amount;
    }

    return leaderboard.map((team) => ({
        ...team,
        prizeWon: prizeMap[team.rank] ?? 0,
    }));
};

module.exports = {
    PLACEMENT_POINTS,
    KILL_POINT,
    getPlacementPoints,
    calcMatchScore,
    calculateLeaderboard,
    applyPrizeDistribution,
};