// Generate 6 alpha-numeric characters
module.exports = function generateRandomString() {
  let string = '';
  const CHAR_SET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 6; i++)
    string += CHAR_SET.charAt(Math.floor(Math.random() * CHAR_SET.length));
  return string;
}
