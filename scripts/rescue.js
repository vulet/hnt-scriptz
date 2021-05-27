const ed25519 = require('ed25519-hd-key');
const { Keypair, Address } = require('@helium/crypto');
const { PaymentV1, Transaction } = require('@helium/transactions');
const { Client } = require('@helium/http');
const inquirer = require('inquirer');
const bip39 = require('bip39');
const client = new Client();
const { log } = console;
const ascii =
`      _
      |_ __ _|_    _  _  __ o |_)_|_ _
      | || | |_   _> (_  |  | |   |_ /_
`;

log(ascii);

async function getKeypair(mnemonic, optional, derivePath) {
  const seed = bip39.mnemonicToSeedSync(mnemonic, optional);
  if (!derivePath) derivePath = 'm/44\'/904\'/0\'/0\'/0\'';
  const ledger = ed25519.derivePath(derivePath, seed);
  const keypair = await Keypair.fromEntropy(ledger.key);
  return keypair;
}

async function pay(recipient, amount, mnemonic, optional, derivePath) {
  await client.vars.get().then((vars) => Transaction.config(vars));
  const keypair = await getKeypair(mnemonic, optional, derivePath);
  const nonce = await client.accounts.get(keypair.address.b58).then((acct) => acct.nonce + 1);
  const paymentTxn = new PaymentV1({
    payer: Address.fromB58(keypair.address.b58),
    payee: Address.fromB58(recipient),
    amount: (Number(amount) * 100000000).toFixed(),
    nonce: Number(nonce).toFixed(),
  });
  return paymentTxn.sign({ payer: keypair });
}

async function getAccount() {
  const questions = [
    { type: 'input', name: 'mnemonic', message: 'ledger rescue passphrase (example: radio invite ...)' },
    { type: 'input', name: 'optional', message: 'optional passphrase (default: null)' },
    { type: 'input', name: 'derivePath', message: 'derivePath (default: m/44\'/904\'/0\'/0\'/0\')' },
  ];
  const opts = await inquirer.prompt(questions);
  const keypair = await getKeypair(opts.mnemonic, opts.optional, opts.derivePath);
  const balance = await client.accounts.get(keypair.address.b58).then((acct) => acct.balance.floatBalance);
  log(`
    Address: ${keypair.address.b58}
    Balance: ${balance}
    `);
}

async function sendTxn() {
  const questions = [
    { type: 'input', name: 'mnemonic', message: 'ledger rescue mnemonic (example: radio invite life ... cabbage)' },
    { type: 'input', name: 'optional', message: 'optional passphrase (default: null)' },
    { type: 'input', name: 'derivePath', message: 'derivePath (default: m/44\'/904\'/0\'/0\'/0\')' },
    { type: 'input', name: 'recipient', message: 'recipient wallet' },
    { type: 'input', name: 'amount', message: 'send amount' },
  ];
  const opts = await inquirer.prompt(questions);
  const transaction = await pay(opts.recipient, opts.amount, opts.mnemonic, opts.optional, opts.derivePath);
  const blocktime = await client.stats.get().then((stats) => stats.blockTimes.lastHour.avg);
  return client.transactions.submit(transaction.toString()).then((txn) => {
    log(`
    check status: ${client.network.baseURL}/v1/pending_transactions/${txn.hash}
    avg blocktime: ${Number(blocktime).toFixed()} seconds
    `);
  });
}

inquirer.prompt({
  type: 'list', name: 'cmd', message: 'choose a command', choices: ['check wallet', 'send funds', 'exit'],
})
  .then(async (answer) => {
    if (answer.cmd === 'check wallet') return getAccount();
    if (answer.cmd === 'send funds') return sendTxn();
    if (answer.cmd === 'exit') return log('goodbye.');
  });
