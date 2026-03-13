const ALLOWED_ALGORITHMS = ["sha256", "md5", "sha512"];

export const isValidAlgorithm = (currentAlgoritm) => {
  return ALLOWED_ALGORITHMS.includes(currentAlgoritm);
};
