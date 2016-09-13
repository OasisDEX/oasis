export const prettyError = function(error) {
  if (typeof error !== "string") {
    error = error.toString();
  }
  return error.split('\n')[0];
}