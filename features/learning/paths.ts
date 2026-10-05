export const learningHome = (childId: string) =>
  `/child/${encodeURIComponent(childId)}/belajar`;

export function learningHref(childId: string, path = ""): string {
  return `${learningHome(childId)}${path}`;
}
