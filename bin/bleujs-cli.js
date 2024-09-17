#!/usr/bin/env node

const { program } = require('commander');

program
  .version('1.0.14')
  .command('predict')
  .description('Run the prediction engine')
  .action(() => {
    console.log('Running Bleu.js prediction engine...');
  });

program.parse(process.argv);
