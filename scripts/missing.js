const { Keypair, Address } = require('@helium/crypto');
const inquirer = require('inquirer');
const wordlist = require('./wordlist/english.json');
const { log } = console;
const ascii =
`      _
      |_ __ _|_    _  _  __ o |_)_|_ _
      | || | |_   _> (_  |  | |   |_ /_
`;
const INVALID_LENGTH = 'This script only allows for 11 or 23 words.';
log(ascii);

async function findWord() {
  const questions = [
    { type: 'input', name: 'mnemonic', message: 'mnemonic (example: radio invite life ... cabbage)' },
    { type: 'input', name: 'missing', message: 'what address are you looking for?' },
  ];
  const { mnemonic, missing } = await inquirer.prompt(questions);
  const words = mnemonic.split(' ');
  if (words.length !== 11 && words.length !== 23) throw new Error(INVALID_LENGTH);
  words.map((word) => {
    if (wordlist.indexOf(word) === -1) throw new Error(`Invalid word: ${word}`);
  });
  if (!Address.isValid(missing)) throw new Error(`Invalid address: ${missing}`);
  for (let order = 0; order < (words.length + 1); order++) {
    for (let i = 0; i < wordlist.length; i++) {
      words.splice(order, 0, wordlist[i]);
      const keypair = await Keypair.fromWords(words).catch(() => {});
      keypair ? address = keypair.address.b58 : address = [];
      if (address !== missing) {
        words.splice(order, 1);
      } else return log('\n', 'Address:', address, '\n', 'Words:', words);
    }
  }
}

inquirer.prompt({
  type: 'list', name: 'cmd', message: 'choose a command', choices: ['find missing word', 'exit'],
})
  .then(async (answer) => {
    if (answer.cmd === 'find missing word') return findWord();
    if (answer.cmd === 'exit') return log('goodbye.');
  });
