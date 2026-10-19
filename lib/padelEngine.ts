export type ScoringMode = 'traditional' | 'americano_16' | 'americano_21';
export type DeuceRule = 'golden' | 'advantage' | 'starpoint_after_ad';

export interface ScoreState {
  team1Points: string;
  team2Points: string;
  team1Games: number[];
  team2Games: number[];
  currentSet: number;
  currentServer: 1 | 2;
  deuceCount: number;
  isBreakPoint: boolean;
  isSetPoint: boolean;
  isMatchPoint: boolean;
  isStarPoint: boolean;
}

export function calculatePadelScore(
  state: ScoreState,
  scoringTeam: 1 | 2,
  mode: ScoringMode,
  deuceRule: DeuceRule = 'golden'
): ScoreState {
  const newState: ScoreState = JSON.parse(JSON.stringify(state));

  // Mode Americano (16/21 Point Cap)
  if (mode.startsWith('americano')) {
    const maxPoints = mode === 'americano_16' ? 16 : 21;
    const currentTotal = parseInt(newState.team1Points || '0') + parseInt(newState.team2Points || '0');

    if (currentTotal < maxPoints) {
      if (scoringTeam === 1) newState.team1Points = String(parseInt(newState.team1Points || '0') + 1);
      else newState.team2Points = String(parseInt(newState.team2Points || '0') + 1);
    }
    return newState;
  }

  // Mode Traditional Tennis/Padel Style
  const p1 = newState.team1Points;
  const p2 = newState.team2Points;

  if (p1 === '40' && p2 === '40') {
    if (deuceRule === 'golden') {
      awardGame(newState, scoringTeam);
      return newState;
    }

    if (deuceRule === 'starpoint_after_ad' && newState.deuceCount >= 1) {
      newState.isStarPoint = true;
      awardGame(newState, scoringTeam);
      return newState;
    }

    if (scoringTeam === 1) newState.team1Points = 'AD';
    else newState.team2Points = 'AD';
    return newState;
  }

  if (p1 === 'AD' || p2 === 'AD') {
    const adTeam = p1 === 'AD' ? 1 : 2;
    if (scoringTeam === adTeam) {
      awardGame(newState, scoringTeam);
    } else {
      newState.team1Points = '40';
      newState.team2Points = '40';
      newState.deuceCount += 1;
      if (deuceRule === 'starpoint_after_ad') newState.isStarPoint = true;
    }
    return newState;
  }

  // Poin Standar (0 -> 15 -> 30 -> 40)
  const sequence = ['0', '15', '30', '40'];
  const currentPts = scoringTeam === 1 ? p1 : p2;
  const currentIndex = sequence.indexOf(currentPts);

  if (currentIndex < 3) {
    if (scoringTeam === 1) newState.team1Points = sequence[currentIndex + 1];
    else newState.team2Points = sequence[currentIndex + 1];
  } else {
    awardGame(newState, scoringTeam);
  }

  // Cek Break Point
  const receiver = newState.currentServer === 1 ? 2 : 1;
  const recPts = receiver === 1 ? newState.team1Points : newState.team2Points;
  const srvPts = newState.currentServer === 1 ? newState.team2Points : newState.team1Points;
  newState.isBreakPoint = (recPts === '40' || recPts === 'AD') && srvPts !== '40' && srvPts !== 'AD';

  return newState;
}

function awardGame(state: ScoreState, winningTeam: 1 | 2) {
  const setIdx = state.currentSet;
  state.team1Points = '0';
  state.team2Points = '0';
  state.deuceCount = 0;
  state.isStarPoint = false;

  if (winningTeam === 1) state.team1Games[setIdx] += 1;
  else state.team2Games[setIdx] += 1;

  // Rotasi Servis Otomatis
  state.currentServer = state.currentServer === 1 ? 2 : 1;
}
