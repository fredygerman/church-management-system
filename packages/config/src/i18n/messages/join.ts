// Church join and switcher copy (mobile). Swahili values are drafts: each one is marked sw-review-pending until a native reviewer signs off.
export const joinMessages = {
  en: {
    'join.title': 'Join a church',
    'join.intro': 'Enter the code your church gave you. A church admin will approve your request.',
    'join.codeLabel': 'Church code',
    'join.codePlaceholder': 'For example K7MQ4XWD',
    'join.codeHint': 'Use 6 to 12 letters or numbers.',
    'join.submit': 'Send request',
    'join.pending.title': 'Request sent',
    'join.pending.message': 'Your request was sent. A church admin will approve it.',
    'join.pending.church': 'Church: {churchName}',
    'join.done': 'Done',
    'join.error.invalidCode': 'That code is not valid or has expired. Check it and try again.',
    'join.error.alreadyMember': 'You are already a member of this church.',
    'join.error.rateLimited': 'Too many attempts. Wait a minute and try again.',
    'join.error.network': 'Check your connection and try again.',
    'join.error.generic': 'We could not send your request. Try again.',
    'switcher.title': 'Your churches',
    'switcher.active': 'Active',
    'switcher.switchTo': 'Switch',
    'switcher.addChurch': 'Add another church',
    'switcher.role.super_admin': 'Super admin',
    'switcher.role.admin': 'Admin',
    'switcher.role.branch_admin': 'Branch admin',
    'switcher.role.zone_leader': 'Zone leader',
    'switcher.role.member': 'Member',
    'switcher.role.usher': 'Usher',
    'switcher.role.publisher': 'Publisher',
    'switcher.role.other': 'Church member',
    'switcher.error.load': 'Your churches could not be loaded.',
    'switcher.error.switch': 'Could not switch churches. Try again.',
  },
  sw: {
    'join.title': 'Jiunge na kanisa', // sw-review-pending
    'join.intro': 'Weka msimbo ambao kanisa lako limekupa. Msimamizi wa kanisa ataidhinisha ombi lako.', // sw-review-pending
    'join.codeLabel': 'Msimbo wa kanisa', // sw-review-pending
    'join.codePlaceholder': 'Kwa mfano K7MQ4XWD', // sw-review-pending
    'join.codeHint': 'Tumia herufi au namba 6 hadi 12.', // sw-review-pending
    'join.submit': 'Tuma ombi', // sw-review-pending
    'join.pending.title': 'Ombi limetumwa', // sw-review-pending
    'join.pending.message': 'Ombi lako limetumwa. Msimamizi wa kanisa ataliidhinisha.', // sw-review-pending
    'join.pending.church': 'Kanisa: {churchName}', // sw-review-pending
    'join.done': 'Imekamilika', // sw-review-pending
    'join.error.invalidCode': 'Msimbo huu si sahihi au umeisha muda. Angalia tena ujaribu tena.', // sw-review-pending
    'join.error.alreadyMember': 'Tayari wewe ni mwanachama wa kanisa hili.', // sw-review-pending
    'join.error.rateLimited': 'Majaribio mengi sana. Subiri dakika moja ujaribu tena.', // sw-review-pending
    'join.error.network': 'Angalia muunganisho wako ujaribu tena.', // sw-review-pending
    'join.error.generic': 'Ombi lako halikutumwa. Jaribu tena.', // sw-review-pending
    'switcher.title': 'Makanisa yako', // sw-review-pending
    'switcher.active': 'Inayotumika', // sw-review-pending
    'switcher.switchTo': 'Badili', // sw-review-pending
    'switcher.addChurch': 'Ongeza kanisa lingine', // sw-review-pending
    'switcher.role.super_admin': 'Msimamizi mkuu', // sw-review-pending
    'switcher.role.admin': 'Msimamizi', // sw-review-pending
    'switcher.role.branch_admin': 'Msimamizi wa tawi', // sw-review-pending
    'switcher.role.zone_leader': 'Kiongozi wa eneo', // sw-review-pending
    'switcher.role.member': 'Mwanachama', // sw-review-pending
    'switcher.role.usher': 'Mhudumu wa mlango', // sw-review-pending
    'switcher.role.publisher': 'Mchapishaji', // sw-review-pending
    'switcher.role.other': 'Mwanachama wa kanisa', // sw-review-pending
    'switcher.error.load': 'Makanisa yako hayakuweza kupakiwa.', // sw-review-pending
    'switcher.error.switch': 'Imeshindikana kubadili kanisa. Jaribu tena.', // sw-review-pending
  },
} as const
