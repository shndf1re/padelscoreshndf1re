export type ScoringMode = 'traditional' | 'americano_16' | 'americano_21';
export type DeuceRule = 'golden' | 'advantage' | 'starpoint_after_ad1' | 'starpoint_after_ad2';

export interface ScoreState {
  team1Points: string;
  team2Points: string;
  team1Games: number[]; // e.g. [6, 4, 2]
  team2Games: number[]; // e.g. [4, 6, 1]
  team1SetsWon: number;
  team2SetsWon: number;
  currentSet: number;
  currentServer: 1 | 2;
  deuceCount: number;
  isBreakPoint: boolean;
  isSetPoint: boolean;
  isMatchPoint: boolean;
  isStarPoint: boolean;
  isFinished: boolean;
  winnerTeam: 0 | 1 | 2;
}

export function calculatePadelScore(
  state: ScoreState,
  scoringTeam: 1 | 2,
  mode: ScoringMode = 'traditional',
  deuceRule: DeuceRule = 'golden',
  gamesPerSet: number = 6,
  totalSets: number = 3
): ScoreState {
  if (state.isFinished) return state;

  const newState: ScoreState = JSON.parse(JSON.stringify(state));

  // Handle Americano Point Mode (Direct Point Cap)
  if (mode.startsWith('americano')) {
    const maxPoints = mode === 'americano_16' ? 16 : 21;
    const t1 = parseInt(newState.team1Points) || 0;
    const t2 = parseInt(newState.team2Points) || 0;

    if (t1 + t2 < maxPoints) {
      if (scoringTeam === 1) newState.team1Points = String(t1 + 1);
      else newState.team2Points = String(t2 + 1);
    }

    if (parseInt(newState.team1Points) + parseInt(newState.team2Points) >= maxPoints) {
      newState.isFinished = true;
      const finalT1 = parseInt(newState.team1Points);
      const finalT2 = parseInt(newState.team2Points);
      newState.winnerTeam = finalT1 > finalT2 ? 1 : finalT2 > finalT1 ? 2 : 0;
    }
    return newState;
  }

  // Handle Traditional Tennis/Padel Style
  const p1 = newState.team1Points;
  const p2 = newState.team2Points;

  // Deuce Condition (40-40)
  if (p1 === '40' && p2 === '40') {
    if (deuceRule === 'golden') {
      awardGame(newState, scoringTeam, gamesPerSet, totalSets);
      return newState;
    }

    if (deuceRule === 'starpoint_after_ad1' && newState.deuceCount >= 1) {
      newState.isStarPoint = true;
      awardGame(newState, scoringTeam, gamesPerSet, totalSets);
      return newState;
    }

    if (deuceRule === 'starpoint_after_ad2' && newState.deuceCount >= 2) {
      newState.isStarPoint = true;
      awardGame(newState, scoringTeam, gamesPerSet, totalSets);
      return newState;
    }

    if (scoringTeam === 1) newState.team1Points = 'AD';
    else newState.team2Points = 'AD';
    return newState;
  }

  // Advantage Condition (AD vs 40)
  if (p1 === 'AD' || p2 === 'AD') {
    const adTeam = p1 === 'AD' ? 1 : 2;
    if (scoringTeam === adTeam) {
      awardGame(newState, scoringTeam, gamesPerSet, totalSets);
    } else {
      // Kembali ke Deuce
      newState.team1Points = '40';
      newState.team2Points = '40';
      newState.deuceCount += 1;

      // Cek apakah deuce berikutnya berubah menjadi Star Point
      if (
        (deuceRule === 'starpoint_after_ad1' && newState.deuceCount >= 1) ||
        (deuceRule === 'starpoint_after_ad2' && newState.deuceCount >= 2)
      ) {
        newState.isStarPoint = true;
      }
    }
    return newState;
  }

  // Regular Points (0 -> 15 -> 30 -> 40)
  const sequence = ['0', '15', '30', '40'];
  const currentPts = scoringTeam === 1 ? p1 : p2;
  const currentIndex = sequence.indexOf(currentPts);

  if (currentIndex < 3) {
    if (scoringTeam === 1) newState.team1Points = sequence[currentIndex + 1];
    else newState.team2Points = sequence[currentIndex + 1];
  } else {
    awardGame(newState, scoringTeam, gamesPerSet, totalSets);
  }

  // Evaluasi Break Point
  const receiver = newState.currentServer === 1 ? 2 : 1;
  const recPts = receiver === 1 ? newState.team1Points : newState.team2Points;
  const srvPts = newState.currentServer === 1 ? newState.team2Points : newState.team1Points;
  newState.isBreakPoint = (recPts === '40' || recPts === 'AD') && srvPts !== '40' && srvPts !== 'AD';

  return newState;
}

function awardGame(state: ScoreState, winningTeam: 1 | 2, gamesPerSet: number, totalSets: number) {
  const setIdx = state.currentSet;
  state.team1Points = '0';
  state.team2Points = '0';
  state.deuceCount = 0;
  state.isStarPoint = false;

  if (winningTeam === 1) state.team1Games[setIdx] += 1;
  else state.team2Games[setIdx] += 1;

  // Rotasi Servis Otomatis
  state.currentServer = state.currentServer === 1 ? 2 : 1;

  // Cek Pemenang Set (e.g. 6-4 or 7-5)
  const g1 = state.team1Games[setIdx];
  const g2 = state.team2Games[setIdx];

  const setsToWin = Math.ceil(totalSets / 2);

  if ((g1 >= gamesPerSet && g1 - g2 >= 2) || g1 === gamesPerSet + 1) {
    state.team1SetsWon += 1;
    if (state.team1SetsWon >= setsToWin) {
      state.isFinished = true;
      state.winnerTeam = 1;
    } else {
      state.currentSet += 1; // Pindah ke Set Berikutnya
    }
  } else if ((g2 >= gamesPerSet && g2 - g1 >= 2) || g2 === gamesPerSet + 1) {
    state.team2SetsWon += 1;
    if (state.team2SetsWon >= setsToWin) {
      state.isFinished = true;
      state.winnerTeam = 2;
    } else {
      state.currentSet += 1; // Pindah ke Set Berikutnya
    }
  }
}
