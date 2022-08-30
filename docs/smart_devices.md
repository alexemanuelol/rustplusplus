# Smart Devices Documentation

> Smart Devices is a umbrella term for three different devices, Smart Switches, Smart Alarms and Storage Monitors. To pair a Smart Device you need a `wire tool`. Once you've paired your Smart Device, it should appear in their respective Discord Text Channel.

## Smart Switches

> All paired Smart Switches for the currently connected server will be located in the `switches` Discord Text Channel.

### Switch

From Discord, you can choose to do different stuff with Smart Switches. You could use the Slash Command to edit the name of the switch, the image representing the switch or edit the custom command used in-game to turn it ON/OFF.
<br><br>
If you take a look at the Switch embed located in the `switches` channel, you can turn a switch ON/OFF with the button `TURN ON`/`TURN OFF`. When the button is green and the embed color is red it means the switch is currently OFF. When the button is red and the embed color is green it means the switch is currently ON. You can also remove the switch by clicking on the `basket` button. For Smart Switches there is also a select menu located under the embed. With this select menu, you can set the switch to automatically turn ON at nightfall or turn ON at daybreak (default this is set to OFF).
<br><br>
From In-Game you can interact with Smart Switches by using the custom command for that switch. If your switchs custom command is `lights` and your prefix is `!`, you can run the following commands:

* `!lights` - To toggle the switch.
* `!lights 60s` - To toggle the switch and then toggle it back after 60 seconds.
* `!lights on` - To turn the switch ON.
* `!lights off` - To turn the switch OFF.
* `!lights on 60s` - To turn the switch ON and automatically turn it OFF after 60 seconds.
* `!lights off 60s` - To turn the switch OFF and automatically turn it ON after 60 seconds.
* `!lights status` - To get the current status of the switch.

### Groups

You can also create Smart Switch Groups. By doing this you can easily control multiple Smart Switches with one click of a button (Discord) or with a custom command for the group (In-Game). To create a group you run the command `/switch create_group` and then `/switch add_switch` to add a switch to the group.
<br><br>
From In-Game you can interact with the Smart Switch Group by using the custom command for the group. If your groups custom command is `group` and your prefix is `!`, you can run the following commands:

* `!group` - To get status of all Smart Switches in the group.
* `!group on` - To turn all the switches in the group ON.
* `!group off` - To turn all the switches in the group OFF.
* `!group on 60s` - To turn all the switches in the group ON and automatically turn them OFF after 60 seconds.
* `!group off 60s` - To turn all the switches in the group OFF and automatically turn them ON after 60 seconds.


## Smart Alarms

> All paired Smart Alarms will be located in the `alarms` Discord Text Channel.

From Discord, you you can choose to do different stuff with Smart Alarms. You could use the Slash Command to edit the name of the alarm, the image representing the alarm or edit the alarm message that will be used when the alarm is triggered (Alarm message from in-game will be used if the Smart Alarm belongs to a server that is not currently connected). You could also use the `@everyone` button to enable the alarm to notify everyone whenever it is triggered. You can also remove the Smart Alarm by clicking on the `basket` button.
<br><br>
From the settings channel, there are two settings that has to do with Smart Alarms. The first one is if Smart Alarms that are not currently part of the connected rust server should notify anyway when triggered. This is possible due to the FCM listener getting the alarm notification rather than broadcast notification from the connected server.
<br><br>
The other setting concerns if alarm notifications should be forwarded to In-Game Team Chat as well.


## Storage Monitors

> All paired Storage Monitors for the currently connected server will be located in the `storagemonitors` Discord Text Channel.

Depending on what the Storage Monitor have been placed on, it will work differently. Currently Storage Monitors can be placed on Tool cupboards, Large Wooden Boxes and Vending Machines. If the Storage Monitor is placed on a Tool cupboard, you can from the `storagemonitors` channel see The upkeep of the tool cupboard as well as the content inside it. Tool cupboard monitors also have two buttons that the other monitors does not have, `@everyone` and `IN-GAME`. They are used to determine where and how the decay alerts should be forwarded. If `@everyone` is set (green), then everyone will be notified whenever it starts to decay or could not be found. If `IN-GAME` is set (green), then the notification will be forwarded in-game as well.
<br><br>
All Storage Monitors embeds in the `storagemonitors` channel have the `basket` button to remove respective device. Large Wooden Boxes and Vending Machines monitors works the same, both of them displays the content inside.
<br><br>
Another thing that could be useful for all Storage Monitors is the `/storagemonitor recycle` command. This will calculate the output content of recycling everything inside the container.