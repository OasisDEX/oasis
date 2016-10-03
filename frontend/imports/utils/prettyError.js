export default function prettyError(error) {
  return error.toString().split('\n')[0].replace(/Error: /g, '');
}
