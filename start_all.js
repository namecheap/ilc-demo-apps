const fs = require('fs');
const concurrently = require('concurrently');

let runCmd = 'npm start';
const myCmd = process.argv.slice(2).join(' ');
if (myCmd.includes('--dev') || myCmd.includes('-D')) {
    runCmd = 'npm run dev';
}

const commands = [];

fs.readdirSync('./apps').forEach(fileName => {
    const stat = fs.lstatSync(`./apps/${fileName}`);
    if (stat.isFile()) {
        return;
    }

    commands.push({ command: `cd ./apps/${fileName}/ && ${runCmd}`, name: fileName });
});

concurrently(commands, {
    prefix: 'name',
    killOthers: ['failure', 'success'],
}).then(() => {
    console.log('concurrently was finished successfully');
    process.exit(0);
}, (err) => {
    console.error('concurrently was finished with error');
    console.error(err);
    process.exit(1);
});
