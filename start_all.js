const fs = require('fs');
const concurrently = require('concurrently');

const commands = [];

fs.readdirSync('./apps').forEach(fileName => {
    const stat = fs.lstatSync(`./apps/${fileName}`);
    if (stat.isFile()) {
        return;
    }

    commands.push({ command: `cd ./apps/${fileName}/ && npm run dev`, name: fileName });
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
