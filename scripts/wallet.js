const Crypto = require('@helium/crypto');
const inquirer = require('inquirer');
const { log } = console;
const ascii =
`      _
      |_ __ _|_    _  _  __ o |_)_|_ _
      | || | |_   _> (_  |  | |   |_ /_
`;

log(ascii);

class Wallet {
  constructor() {
    return (async () => {
      this.mnemonic = await Crypto.utils.randomBytes(16).then((entropy) => Crypto.Mnemonic.fromEntropy(entropy).words);
      this.address = await Crypto.Keypair.fromWords(this.mnemonic).then((keypair) => keypair.address.b58);
      return this;
    })();
  }
}

function vanity() {
  inquirer.prompt({ type: 'input', name: 'characters', message: 'choose vanity' })
    .then(async (opts) => {
      let wallet = [];
      regex = new RegExp(opts.characters.replace(/[^a-zA-Z0-9 ]/g, ''));
      while (!regex.test(wallet.address)) wallet = await new Wallet();
      return log(wallet);
    });
}

inquirer.prompt({
  type: 'list', name: 'cmd', message: 'choose a command', choices: ['create random wallet', 'create vanity wallet', 'exit'],
})
  .then(async (answer) => {
    if (answer.cmd === 'create random wallet') return log(await new Wallet());
    if (answer.cmd === 'create vanity wallet') return vanity();
    if (answer.cmd === 'exit') return log('goodbye.');
  });
