# Discord Bot Setup Documentation

## Create a Discord Bot

1. Go to [`Discord Developers Applications`](https://discord.com/developers/applications).
2. Click on the button `New Application`.

![Setup Discord Bot new application Image](images/new_application_bot_setup.png)

3. Enter the name for the Bot and click `Create`.

![Setup Discord Bot create an application Image](images/create_an_application_bot_setup.png)

4. Copy the `APPLICATION ID` to the config.json file located in repository folder `rustPlusPlus/config.json`.

![Setup Discord Bot copy application id Image](images/copy_application_id_bot_setup.png)

5. Click on `Bot` and then on `Add Bot`.

![Setup Discord Bot bot Image](images/bot_bot_setup.png)

6. Click on `Yes, do it!`.

![Setup Discord Bot yes create bot Image](images/yes_create_bot_bot_setup.png)

7. Click on `Reset Token` and then `Yes, do it!`.

![Setup Discord Bot reset token Image](images/reset_token_bot_setup.png)

8. Copy the `TOKEN` to the config.json file located in repository folder `rustPlusPlus/config.json`.

![Setup Discord Bot bot token Image](images/bot_token_bot_setup.png)

9. Scroll down to `Privileged Gateway Intents` and enable them all.

![Setup Discord Bot Privileged Gateway Intents Image](images/privileged_gateway_intents_bot_setup.png)

10. Click on `OAuth2` and then `URL Generator`.

![Setup Discord Bot oauth2 Image](images/oauth2_bot_setup.png)

11. Under `SCOPES` select `bot` and `applications.commands`.

![Setup Discord Bot scopes Image](images/scopes_bot_setup.png)

12. Under `BOT PERMISSIONS` select `Administrator`.

![Setup Discord Bot bot permissions Image](images/bot_permissions_bot_setup.png)

13. Copy the `GENERATED URL` and paste it into your URL browser.

![Setup Discord Bot generated url Image](images/generated_url_bot_setup.png)

14. Add the bot to desired Discord Server and click `Continue`.

![Setup Discord Bot add bot to server Image](images/add_bot_to_server_bot_setup.png)

15. Click on `Authorise`.

![Setup Discord Bot authorise Image](images/authorise_bot_setup.png)

16. The Bot should now be visible in your Discord Server.

![Setup Discord Bot bot in server Image](images/bot_in_server_bot_setup.png)

<br>
You have now successfully added a Discord Bot with the desired permissions to your Discord Server. You have also added the Application/Client ID and Bot Token to the configuration file of the rustPlusPlus bot repository.