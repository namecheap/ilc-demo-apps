const fs = require('fs');
const spawnSync = require('child_process').spawnSync;

const myCmd = process.argv.slice(2).join(' ');
if (myCmd === '') {
    console.error(`Please specify command to run, example: node run_all.js npm i`);
    return;
}

const commands = [];

fs.readdirSync('./apps').forEach(fileName => {
    const stat = fs.lstatSync(`./apps/${fileName}`);
    if (stat.isFile()) {
        return;
    }

    commands.push({ command: `cd ./apps/${fileName}/ && ${myCmd}`, name: fileName });
});

commands.forEach(cmd => {
   console.log('');
   console.log('');
   console.log(`Executing command for "${cmd.name}"... Calling: ${cmd.command}`);
   console.log('');
   spawnSync(cmd.command, {shell: true, timeout: 120000, killSignal: 'SIGKILL', stdio: 'inherit'});
});
