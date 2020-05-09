const { RichEmbed } = require('discord.js')
const { colors, version } = require('../config/config')

module.exports = async (msg, client, args) => {
    const reportEmbed = new RichEmbed()
        .setColor(colors.green)
        .setAuthor('Report', msg.author.avatarURL)
        .setTimestamp(new Date())
        .setFooter(`LeCashBot v${version}`)
        .setDescription(`
            Servers - **${client.guilds.size}**
            Users   - **${client.users.size}**
            Latency - **${client.ping}**ms
        `)

    return msg.channel.send(reportEmbed)
}