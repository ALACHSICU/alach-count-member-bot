// app thing
const express = require('express');
const app = express();

app.get('/health', (req, res) => {
  res.status(200).send('Bot is running');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Web server đang chạy ở port ${PORT}`);
});

//main
const { GoogleSpreadsheet } = require('google-spreadsheet')
const {JWT} = require('google-auth-library')
const cron = require('node-cron')
//const googleKey = require('../google-cloud-key.json')
require('dotenv').config()
console.log('token detected:', !!process.env.TOKEN)

const {Client, IntentsBitField, ActivityType, EmbedBuilder} = require('discord.js')
const client = new Client({
    intents: [
        IntentsBitField.Flags.Guilds,
        IntentsBitField.Flags.GuildMembers,
        IntentsBitField.Flags.GuildMessages,
        IntentsBitField.Flags.MessageContent
    ]
})

const serviceAccountAuth = new JWT({
  email: process.env.CLIENT_EMAIL, //googleKey.client_email
  key: process.env.PRIVATE_KEY, //googleKey.private_key
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const doc = new GoogleSpreadsheet(process.env.SHEET_ID, serviceAccountAuth)

async function logDailyMemberCount(guild) {
  if (!guild) {
      throw new Error('guild not found');
  }
  await doc.loadInfo()
  const sheet = doc.sheetsByIndex[0]
  const rows = await sheet.getRows()
  const date = lastRow.get('date') == '' ? '<null>' : lastRow.get('date')
  let lastCount;
  
  if (rows.length > 0) {
    lastCount = Number(lastRow.get('total'))
  } else {
    lastCount = guild.memberCount;
  }
  
  await sheet.addRow({
    date: new Date().toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }),
    total: guild.memberCount,
    change: guild.memberCount - lastCount,
  });
  const lastRow = rows[rows.length - 1]
  const total = lastRow.get('total') == '' ? '<null>' : lastRow.get('total')
  const change = lastRow.get('change') == '' ? '<null>' : lastRow.get('change')
  let targetChannel = client.channels.cache.get('1551940077201002539')
  targetChannel.send({ 
    content: `\`Member Stats\``, 
    embeds: [await createEmbedMemberStats(date, total, change)] 
  })
}

async function createEmbedMemberStats(date, total, change) {
    if (date == 0 && total == 0 && change == 0) {
      const embed = new EmbedBuilder()
      .setColor(0xd0021b)
      .setDescription('***Lỗi:*** *Không thể try cập vào dữ liệu hoặc dữ liệu không hợp lệ*')
      return embed
    }

    const embed = new EmbedBuilder()
        .setColor(change > 0 ? 0x00bf63 : change < 0 ? 0xff3131 : 0x38b6ff)
        .setTitle('Tổng kết số thành viên')
        .addFields(
            { name: 'Số thành viên hôm nay', value: (change > 0 ? '<:membercountup:1552314738355212338>' : change < 0 ? '<:membercountdown:1552314733963517972>' : '<:membercountnotchange:1552314736098418748>') + ' ' + `${change} thành viên`, inline: true },
            { name: 'Tổng cộng', value: `Server đang có ${total} thành viên`, inline: true },
            { name: '', value: `-# ***Đây là tổng hợp dữ liệu của ngày ${date}***`}
        )

    return embed
}

async function wait(milisec) {
  return new Promise((resolve) => setTimeout(resolve, milisec));
}

// code 

// client.on('messageCreate', (msg) => {
//     
// })

client.on('interactionCreate', async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName == "checktoday") {
        const guild = client.guilds.cache.get(process.env.GUILD_ID)

        await doc.loadInfo()
        const sheet = doc.sheetsByIndex[0]
        const rows = await sheet.getRows()

        const lastRow = rows[rows.length - 1]
        const date = new Date().toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })
        const total = lastRow.get('total') == '' ? '<null>' : lastRow.get('total')
        await interaction.reply({ embeds: [await createEmbedMemberStats(date,guild.memberCount,guild.memberCount-total)] })
    }
})

cron.schedule('0 0 * * *', async () => {
  try {
    await logDailyMemberCount(client.guilds.cache.get(process.env.GUILD_ID));
  } catch (err) {
    console.error(`fail when add data to ggsheet: ${err}`);
  }
}, {timezone: 'Asia/Ho_Chi_Minh'});

// random stuff
const think = [
    'omg nay server giam 367 mem cmnr🗣️📉🥀😭',
    'tại sao phải đếm thành viên cơ chứ ;-;?',
    'đừng ping nx💢🥀'
]

client.on('clientReady', async () => {
    console.log('bot ready')
    let i = 0

    setInterval(() => {
        client.user.setPresence({
            status: 'idle',
            activities: [{ name: 'Custom Status', state: think[i], type: ActivityType.Custom }]
        })
        i = (i+1) % think.length
    }, 20000);
});

client.login(process.env.TOKEN)
  .then(() => console.log('done login'))
  .catch((err) => console.error('fail login:', err))

client.on('error', (err) => {
  console.error('client err:', err)
})