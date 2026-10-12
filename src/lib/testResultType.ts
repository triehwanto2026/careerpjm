type TestResultIdentity = {
  test_name?: string | null;
  categories?: Record<string, unknown> | null;
};

export const isKraepelinResult = (result: TestResultIdentity): boolean => {
  const name = String(result.test_name || "").toUpperCase();
  // Aptitude also records answer accuracy; that does not make it Kraepelin.
  if (name.includes("APTITUDE")) return false;
  if (name.includes("KRAEPELIN")) return true;
  const categories = result.categories || {};
  // Legacy unnamed results must have the complete work-performance profile.
  return ["speed", "accuracy", "stability", "work_capacity"].every((key) => key in categories);
};