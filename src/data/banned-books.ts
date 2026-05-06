// ALA top challenged/banned books 2020–2024
// Titles are normalized for case-insensitive matching (strip punctuation, collapse spaces)
export const BANNED_BOOK_TITLES: string[] = [
  'gender queer',
  'all boys arent blue',
  'out of darkness',
  'the hate u give',
  'the absolutely true diary of a part time indian',
  'me and earl and the dying girl',
  'lawn boy',
  'a little life',
  'stamped racism antiracism and you',
  'thirteen reasons why',
  'the perks of being a wallflower',
  'drama',
  'to kill a mockingbird',
  'of mice and men',
  'the kite runner',
  'the color purple',
  'brave new world',
  'nineteen eighty four',
  '1984',
  'lord of the flies',
  'animal farm',
  'the catcher in the rye',
  'beloved',
  'the adventures of huckleberry finn',
  'huckleberry finn',
  'speak',
  'the handmaids tale',
  'looking for alaska',
  'slaughterhouse five',
  'captain underpants',
  'and tango makes three',
  'the bluest eye',
  'forever',
  'the giver',
  'story of o',
];

export function normalizeTitleForBanned(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function isBanned(title: string): boolean {
  const normalized = normalizeTitleForBanned(title);
  return BANNED_BOOK_TITLES.some((t) => normalized.includes(t) || t.includes(normalized));
}
