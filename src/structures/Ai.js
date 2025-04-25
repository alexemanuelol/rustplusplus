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

        this.log('question: ', query, 'debug');

        const resp = await this.groq.chat.completions.create({
            model: "deepseek-r1-distill-llama-70b",
            messages: [
                {
                    role: "user",
                    content: "In Rust (FacePunch Games) for PC, summarize: " + this.lastQuestion
                }
            ],
            temperature: 0.33,
            max_completion_tokens: 1024,
            top_p: 0.95,
            stream: false,
            reasoning_format: "hidden",
        });

        if (!resp)
            return '**error**';

        this.log('AI: ', JSON.stringify(resp.choices), 'debug');
        let content = resp.choices[0].message.content;
        let lines = content.split('\n');

        if (lines !== undefined)
            this.log('lines: ', lines, 'debug');

        this.lastAnswer = resp.choices[0].message.content;

        return this.lastAnswer;
    }

    log(title, text, level = 'info') {
        this.logger.log(title, text, level);
    }

}

module.exports = Ai;