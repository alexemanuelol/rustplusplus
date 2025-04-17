const Fs = require('fs');
const Logger = require('./Logger');
const Path = require('path');
const Groq = require("groq-sdk");

class Ai {

    constructor(guildId = null) {
        this.guildId = guildId;
        this.lastQuestion = null;
        this.lastAnswer = null;
        this.logger = new Logger(Path.join(__dirname, '..', '..', 'logs/ai.log'), 'default');
        this.logger.setGuildId(this.guildId);
        const apiKey = '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';
        this.groq = new Groq.Groq({ apiKey });

    }

    async askAiBot(query) {
        this.lastQuestion = query;

        const resp = await this.groq.chat.completions.create({
            model: "llama3-70b-8192",
            messages: [
                {
                    role: "user",
                    content: "In Rust (FacePunch Games) for PC, " +  this.lastQuestion
                }
            ],
            temperature: 0.3,
            max_completion_tokens: 2048,
            stream: false
        });

        this.lastAnswer = resp.choices[0].message.content;

        return this.lastAnswer;
    }

    log(title, text, level = 'info') {
        this.logger.log(title, text, level);
    }

}

module.exports = Ai;