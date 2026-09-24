require('dotenv').config();
const {REST, Routes, ApplicationCommandOptionType} = require('discord.js');

const commands = [
    {
        name: 'checktoday',
        description: 'Check today\'s member count!'
    },
]

const rest = new REST({version: '10'}).setToken(process.env.TOKEN);

(async () => {
    try {
        console.log('registering')

        await rest.put(
            Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
            {body: commands}
        )

        console.log('done')
    } catch (error) {
        console.log(`error: ${error}`)
    }
})();