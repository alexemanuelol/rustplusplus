<p align="center">
<img src="./rustplusplus.png" width="500"></a>
</p>

<p align="center">
<a href="https://discord.gg/vcrKbKVAbc"><img src="https://img.shields.io/badge/Discord-Alexemanuelol%238259-%237289DA?style=flat&logo=discord" alt="discord"/></a>
<a href="https://www.reddit.com/user/Alexemanuelol"><img src="https://img.shields.io/badge/Reddit-Alexemanuelol-FF4500?style=flat&logo=reddit" alt="reddit"/></a>
<a href="https://ko-fi.com/alexemanuelol"><img src="https://img.shields.io/badge/Donate%20a%20Coffee-alexemanuelol-yellow?style=flat&logo=buy-me-a-coffee" alt="donate on ko-fi"/></a>

<p align="center">
    <a href="https://discord.gg/vcrKbKVAbc">
        <img src="./join_discord.png" width="250">
    </a>
</p>

<h1 align="center"><em><b>rustPlusPlus</b> ~ Rust+ Discord Bot</em></h1>
</p>

A NodeJS Discord Bot that uses the [rustplus.js](https://github.com/liamcottle/rustplus.js) library to utilize the power of the [Rust+ Companion App](https://rust.facepunch.com/companion) with additional Quality-of-Life features.


## **How-to Setup Video**

[![Image of setup video](https://www.youtube.com/s/desktop/4a88d8c6/img/favicon_144x144.png)](https://www.youtube.com/watch?v=xqcqXcWypEo)

## **Features**

* Receive notifications for [In-Game Events](docs/discord_text_channels.md#events-channel) (Patrol Helicopter, Bradley APC, Cargo Ship, Chinook 47, Oil Rigs triggered and Locked Crate dropped).
* Control [Smart Switches](docs/smart_devices.md#smart-switches) or Groups of Smart Switches via Discord or In-Game Team Chat.
* Setup [Smart Alarms](docs/smart_devices.md#smart-alarms) to notify in Discord or In-Game Team Chat whenever they are triggered.
* Use [Storage Monitors](docs/smart_devices.md#storage-monitors) to keep track of Tool Cupboard Upkeep or Large Wooden Box/Vending Machine content.
* Head over to the [Information Text Channel](docs/images/information_channel.png) to see all sorts of information about the server, ongoing events and team member status.
* Communicate with teammates from [Discord to In-Game](docs/discord_text_channels.md#teamchat-channel) and vice versa.
* Keep track of other teams on the server with the [Battlemetrics Player Tracker](docs/discord_text_channels.md#trackers-channel).
* Alot of [QoL Commands](docs/commands.md) that can be used In-Game or from Discord.
* View the [Full list of features](docs/full_list_features.md).


## **Documentation**

> Documentation can be found [here](docs/documentation.md). The documentation explains the features as well as `how to setup the bot`, so make sure to take a look at it 😉

## **Credentials**

> You can get your credentials by running the `rustPlusPlus FCM Credential Application`. Download it [here](https://github.com/alexemanuelol/rustPlusPlus/releases/download/v1.0.0/rustPlusPlus-FCM-Credential-Application-1.0.0-win-x64.exe)


## **How to run the bot**

> To run the bot, simply open the terminal of your choice and run the following from repository root:

    $ npm start run


## **How to update the repository**

> Depending on your OS / choice of terminal you can run:

    $ update.bat

or

    $ ./update.sh


## **Running via docker**

```
    docker run --rm -it -v ${pwd}/credentials:/app/credentials -v ${pwd}/instances:/app/instances -v ${pwd}/logs:/app/logs -e DISCORD_CLIENT_ID=111....1111 -e DISCORD_TOKEN=token --name rpp ghcr.io/alexemanuelol/rustPlusPlus
```

## **Thanks to**

**liamcottle**@GitHub - for the [rustplus.js](https://github.com/liamcottle/rustplus.js) library.
<br>
**.Vegas.#4844**@Discord - for the awesome icons!
