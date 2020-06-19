import { User } from '../models/user.model'
import { checkErr } from '../utils/checkErr'
import { MessageEmbed } from 'discord.js'
import { colors, version } from '../config/config'
import { currency, int } from '../utils/format'
import { betTime } from '../config/cooldowns'

const sendRecordEmbed = (msg, previousBet) => {
    const recordBetEmbed = new MessageEmbed()
        .setColor(colors.green)
        .setAuthor('New Highest Bet!', msg.author.avatarURL())
        .setTimestamp(new Date())
        .setFooter(`LeCashBot v${version}`)
        .setDescription(`Previous best: $**${currency(previousBet)}**`)

    msg.channel.send(recordBetEmbed)
}

const sendBetEmbed = (msg, bet, didWin) => {
    const betEmbed = new MessageEmbed()
        .setColor(didWin[0] ? colors.green : colors.red)
        .setAuthor('Bet', msg.author.avatarURL())
        .setTimestamp(new Date())
        .setFooter(`LeCashBot v${version}`)
        .setDescription(`You ${(didWin[0]) ? 'won' : 'lost'} $**${currency(bet)}**.`)
        .addField('Chances', `**${Math.round(didWin[1] * 100) / 100}**%`)

    msg.channel.send(betEmbed)
}

const getHighestBet = async msg => {
    const user: any = await User.findOne({ discordId: msg.author.id })
    const bestBet: any = user.highestBet
    const message: string = `Your highest bet is $**${currency(bestBet.amount)}** with a chance of **${bestBet.chance}**%.`

    return msg.channel.send(message)
}

const win = bet => {
    const chances: number = Math.round((750 / (bet - 200)) + (750 / Math.sqrt(bet)) * 100) / 100 + 5
    const randomNum: number = Math.random() * 100

    return [(randomNum < chances), chances]
}

const makeBet = async (msg, { highestBet, balance }, bet, client) => {
    const didWin: (number | boolean)[] = win(bet)
    sendBetEmbed(msg, bet, didWin)

    const previousBet: number = highestBet.amount
    const previousBal: number = balance
    const userId: { discordId: number } = { discordId: msg.author.id }
    const newBal: { balance: number } = {
        balance: (didWin[0]) ? (previousBal + bet) : (previousBal - bet)
    }

    if (previousBet < bet && didWin[0]) {
        User.updateOne(userId, {
            highestBet: {
                chance: didWin[1],
                amount: bet
            }
        }, (err: any) => checkErr(err, client, () => sendRecordEmbed(msg, previousBet)))
    }

    User.updateOne(userId, newBal)
}

export default async (msg, client, args) => {
    if (!args[0] || !int(args[0])) return msg.reply('Undefined bet amount: Use `$bet <amount>`.')
    if (args[0] === 'high') return getHighestBet(msg)

    const user: any = await User.findOne({ discordId: msg.author.id })
    if (!user) {
        client.logger.log('User not found while betting.', 'error')
        return msg.channel.send('An error occurred.')
    }

    const bet: number = int(args[0])
    if (bet < 250) {
        return msg.reply('Bets must be at least $250!')
    }

    // Check if the user has enough in their balance to bet.
    return (user.balance >= bet)
        ? makeBet(msg, user, bet, client)
        : msg.reply(`Insufficient bal: $${user.balance}`)
}