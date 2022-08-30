const Discord = require('discord.js');

module.exports = {
    getTextInput: function (options = {}) {
        const textInput = new Discord.TextInputBuilder();

        if (options.customId) textInput.setCustomId(options.customId);
        if (options.label) textInput.setLabel(options.label);
        if (options.value) textInput.setValue(options.value);
        if (options.style) textInput.setStyle(options.style);
        if (options.placeholder) textInput.setPlaceholder(options.placeholder);
        if (options.required) textInput.setRequired(options.required);

        return textInput;
    },
}