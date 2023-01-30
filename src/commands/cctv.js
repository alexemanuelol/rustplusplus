const Builder = require('@discordjs/builders');

const DiscordMessages = require('../discordTools/discordMessages.js');

module.exports = {
	name: 'cctv',

	getData(client, guildId) {
		return new Builder.SlashCommandBuilder()
			.setName('cctv')
			.setDescription(client.intlGet(guildId, 'commandsCctvDesc'))
            .addStringOption(option =>
                option.setName('monument')
                    .setDescription('Rust Monument')
                    .setRequired(true)
                    .addChoices(
                        { name: 'Abandoned Military Base', value: 'Abandoned Military Base' },
                        { name: 'Bandit Camp', value: 'Bandit Camp' },
                        { name: 'Dome', value: 'Dome' },
                        { name: 'Large Oil Rig', value: 'Large Oil Rig' },
                        { name: 'Outpost', value: 'Outpost' },
                        { name: 'Small Oil Rig', value: 'Small Oil Rig' },
                        { name: 'Underwater Labs', value: 'Underwater Labs' },    
                    ));

	},

	async execute(client, interaction) {
        const monument = interaction.options.getString('monument');
        const cctvCodes = client.cctv.getCodes(monument);
        const dynamic = client.cctv.isDynamic(monument);

		await DiscordMessages.sendCctvMessage(interaction, monument, cctvCodes, dynamic);
		client.log(client.intlGet(null, 'infoCap'), client.intlGet(interaction.guildId, 'commandsCctvDesc'));
	},
};