export default function prettyError(error) {
  return error.toString().split('\n')[0];
}
