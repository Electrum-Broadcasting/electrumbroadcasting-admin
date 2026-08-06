export function autoAssignEra(birth: number, death: number, eras: any[]) {
  if (!birth || !death) return null;

  return eras.find((era) => {
    return birth >= era.start_year && death <= era.end_year;
  })?.id ?? null;
}
