export type Language = 'id' | 'en';

export const dictionary = {
  id: {
    // Header & Navigasi
    dashboardTitle: 'Daftar Turnamen Padel',
    createNew: 'Buat Turnamen Baru',
    savedTournaments: 'Turnamen Tersimpan',
    noTournaments: 'Belum ada turnamen. Klik "Buat Turnamen Baru" untuk mulai.',
    backToList: 'Kembali ke Daftar Turnamen',
    
    // Tab
    tabSettings: 'Pengaturan & Peserta',
    tabBracket: 'Bagan Bracket',
    tabAdmins: 'Admin & Moderator',

    // Form Turnamen & Peserta
    tournamentName: 'Nama Turnamen',
    placeholderTournamentName: 'Contoh: BeeTenis Open 2026',
    addParticipant: 'Tambah Pasangan Peserta',
    teamName: 'Nama Tim (Opsional)',
    placeholderTeam: 'Contoh: Eagle Padel',
    player1: 'Pemain 1',
    placeholderP1: 'Contoh: Sanyo',
    player2: 'Pemain 2',
    placeholderP2: 'Contoh: Tapia',
    saveParticipant: 'Simpan Pasangan Peserta',
    generateBracket: 'Acak & Simpan Bracket ke DB',
    registeredTeams: 'Daftar Tim Terdaftar',
    emptyTeams: 'Belum ada pasangan peserta. Masukkan peserta pada form di sebelah kiri.',

    // Fitur Tambahan / Status
    gamesPerSet: 'Games / Set',
    totalSets: 'Total Set',
    scoringFormat: 'Format Skoring',
    deuceRule: 'Aturan Deuce',
  },
  en: {
    // Header & Navigation
    dashboardTitle: 'Padel Tournament List',
    createNew: 'Create New Tournament',
    savedTournaments: 'Saved Tournaments',
    noTournaments: 'No tournaments yet. Click "Create New Tournament" to start.',
    backToList: 'Back to Tournament List',
    
    // Tabs
    tabSettings: 'Settings & Players',
    tabBracket: 'Bracket View',
    tabAdmins: 'Admins & Moderators',

    // Tournament & Player Form
    tournamentName: 'Tournament Name',
    placeholderTournamentName: 'e.g. BeeTenis Open 2026',
    addParticipant: 'Add Player Pair',
    teamName: 'Team Name (Optional)',
    placeholderTeam: 'e.g. Eagle Padel',
    player1: 'Player 1',
    placeholderP1: 'e.g. Sanyo',
    player2: 'Player 2',
    placeholderP2: 'e.g. Tapia',
    saveParticipant: 'Save Pair',
    generateBracket: 'Shuffle & Generate Bracket',
    registeredTeams: 'Registered Teams',
    emptyTeams: 'No player pairs yet. Enter players using the form on the left.',

    // Additional Features / Status
    gamesPerSet: 'Games / Set',
    totalSets: 'Total Sets',
    scoringFormat: 'Scoring Format',
    deuceRule: 'Deuce Rule',
  },
} as const;

export type DictionaryKeys = keyof typeof dictionary.id;
