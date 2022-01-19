const term = require("terminal-kit").terminal;
const { Edupage } = require('edupage-api');
const edupage = new Edupage();

async function setup() {
    term("EduPage Username: ");
    const username = await term.inputField().promise;
    term("\nEduPage Password: ");
    const password = await term.inputField().promise;
    term("\nTesting Credentials ");
    await edupage.login(username, password);
    term("OK");
    require("fs").writeFileSync("edupage.json", JSON.stringify({ username, password }));
    process.exit(0);
}

setup();