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

// Reasons sourced from ALA Office for Intellectual Freedom challenge reports
const BANNED_BOOK_REASONS: Record<string, string> = {
  'gender queer': 'Challenged for sexual content and LGBTQ+ themes',
  'all boys arent blue': 'Challenged for sexual content and LGBTQ+ themes',
  'out of darkness': 'Challenged for sexual content and violence',
  'the hate u give': 'Challenged for profanity and anti-police themes',
  'the absolutely true diary of a part time indian': 'Challenged for profanity, racism, and sexual references',
  'me and earl and the dying girl': 'Challenged for sexual content and offensive language',
  'lawn boy': 'Challenged for sexual content and LGBTQ+ themes',
  'a little life': 'Challenged for sexual content, abuse, and self-harm depictions',
  'stamped racism antiracism and you': 'Challenged for critical race theory content',
  'thirteen reasons why': 'Challenged for graphic depictions of suicide and self-harm',
  'the perks of being a wallflower': 'Challenged for sexual content and drug use',
  'drama': 'Challenged for LGBTQ+ themes',
  'to kill a mockingbird': 'Challenged for racial slurs and discussion of rape',
  'of mice and men': 'Challenged for racial slurs and offensive language',
  'the kite runner': 'Challenged for sexual violence and offensive language',
  'the color purple': 'Challenged for sexual content and offensive language',
  'brave new world': 'Challenged for sexual content, drug use, and anti-family themes',
  'nineteen eighty four': 'Challenged for pro-communist themes and sexual content',
  '1984': 'Challenged for pro-communist themes and sexual content',
  'lord of the flies': 'Challenged for violence and offensive language',
  'animal farm': 'Challenged for political allegory and communist themes',
  'the catcher in the rye': 'Challenged for profanity, sexual content, and blasphemy',
  'beloved': 'Challenged for violent and sexual content',
  'the adventures of huckleberry finn': 'Challenged for racial slurs and depictions of racism',
  'huckleberry finn': 'Challenged for racial slurs and depictions of racism',
  'speak': 'Challenged for depictions of rape and offensive language',
  'the handmaids tale': 'Challenged for sexual content and anti-Christian themes',
  'looking for alaska': 'Challenged for sexual content and offensive language',
  'slaughterhouse five': 'Challenged for violence, profanity, and sexual content',
  'captain underpants': 'Challenged for offensive language and anti-authority themes',
  'and tango makes three': 'Challenged for LGBTQ+ themes',
  'the bluest eye': 'Challenged for sexual content and offensive language',
  'forever': 'Challenged for explicit sexual content',
  'the giver': 'Challenged for violence and euthanasia themes',
  'story of o': 'Challenged for explicit sexual content and BDSM themes',
};

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

export function getBanReason(title: string): string | null {
  const normalized = normalizeTitleForBanned(title);
  const key = BANNED_BOOK_TITLES.find((t) => normalized.includes(t) || t.includes(normalized));
  return key ? (BANNED_BOOK_REASONS[key] ?? null) : null;
}
