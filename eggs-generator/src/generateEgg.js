export function generateEgg(options) {
  if (!options) throw new Error("Options are required");
  return { id: "egg-id", ...options };
}
