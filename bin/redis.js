#!/usr/bin/env node

const { Command } = require('commander')
const chalk = require('chalk')
const program = new Command()
// program.version('0.0.1')

program
.version('0.0.1') // -V
//选项
.option('-d, --debug', 'output extra debugging')
.option('-s, --small', 'small pizza size')
.option('-p, --pizza-type <type>', 'flavour of pizza')
// .option('-d --debug<numbers...>', 'output extra debugging')
//.option('-d --debug[numbers...]', 'output extra debugging')
//必填选项
// .requiredOption()
// .command()

// program.opts()
// program.args

program.parse(process.argv);

if (program.debug) console.log(program.opts());
console.log('pizza details:');
if (program.small) console.log('- small pizza size');
if (program.pizzaType) console.log(`- ${program.pizzaType}`);