# Discord Bot Setup Documentation

## Create a Discord Bot

1. Go to [`Discord Developers Applications`](https://discord.com/developers/applications).
2. Click on the button `New Application`.

![Setup Discord Bot new application Image](images/bot_setup/new_application_bot_setup.png)

3. Enter the name for the Bot and click `Create`.

![Setup Discord Bot create an application Image](images/bot_setup/create_an_application_bot_setup.png)

4. Copy the `APPLICATION ID` to the config/index.js file located in repository folder `rustplusplus/config/index.js`.

![Setup Discord Bot copy application id Image](images/bot_setup/copy_application_id_bot_setup.png)

5. Click on `Bot` and then on `Add Bot`.

![Setup Discord Bot bot Image](images/bot_setup/bot_bot_setup.png)

6. Click on `Yes, do it!`.

![Setup Discord Bot yes create bot Image](images/bot_setup/yes_create_bot_bot_setup.png)

7. Click on `Reset Token` and then `Yes, do it!`.

![Setup Discord Bot reset token Image](images/bot_setup/reset_token_bot_setup.png)

8. Copy the `TOKEN` to the config/index.js file located in repository folder `rustplusplus/config/index.js`.

![Setup Discord Bot bot token Image](images/bot_setup/bot_token_bot_setup.png)

9. Scroll down to `Privileged Gateway Intents` and enable them all.

![Setup Discord Bot Privileged Gateway Intents Image](images/bot_setup/privileged_gateway_intents_bot_setup.png)

10. Click on `OAuth2` and then `URL Generator`.

![Setup Discord Bot oauth2 Image](images/bot_setup/oauth2_bot_setup.png)

11. Under `SCOPES` select `bot` and `applications.commands`.

![Setup Discord Bot scopes Image](images/bot_setup/scopes_bot_setup.png)

12. Under `BOT PERMISSIONS` select `Administrator`.

![Setup Discord Bot bot permissions Image](images/bot_setup/bot_permissions_bot_setup.png)

13. Copy the `GENERATED URL` and paste it into your URL browser.

![Setup Discord Bot generated url Image](images/bot_setup/generated_url_bot_setup.png)

14. Add the bot to desired Discord Server and click `Continue`.

![Setup Discord Bot add bot to server Image](images/bot_setup/add_bot_to_server_bot_setup.png)

15. Click on `Authorise`.

![Setup Discord Bot authorise Image](images/bot_setup/authorise_bot_setup.png)

16. The Bot should now be visible in your Discord Server.

![Setup Discord Bot bot in server Image](images/bot_setup/bot_in_server_bot_setup.png)

17. Start the bot by running `npm start run` in the terminal (First time running the bot will create all of the missing discord text channels).

<br>
You have now successfully added a Discord Bot with the desired permissions to your Discord Server. You have also added the Application/Client ID and Bot Token to the configuration file as well as started the bot for the first time.