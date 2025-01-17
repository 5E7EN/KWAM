# Commands

This directory contains all the commands that the bot can execute.  
Each subdirectory is a category of commands and each file within it is a command implementation.

## Adding a new command

To add a new command, create a new file in the appropriate category directory.  
The file should export a default class that extends `BaseCommand` and implements the properties and methods of it (see JSDoc comments for a description each item the `IBaseCommand` interface).

```ts
import { BaseCommand, type IRunParams } from '../../types/classes/commands';
import { EUserPermissions } from '../../types/permission';
import { ECooldownType } from '../../types/cooldown';

export default class ExampleCommand extends BaseCommand {
    name = 'example';
    aliases = ['ex']; // Optional
    description = 'Example command';
    category = 'Examples'; // Optional, but recommended
    usage = '<arg1> <arg2>'; // Optional. Enforced if provided.
    pmOnly = false; // Optional, default is false
    accessLevel = EUserPermissions.User;
    cooldown = { type: ECooldownType.UserCommand, length: 5 }; // Applies a 5 second cooldown to the command in that group for that user
    enabled = true; // Optional, default is true

    // This method is called when the command is executed
    async run({ msgMeta, msgContext }: IRunParams): Promise<void> {
        msgContext.sendGroupMessage('Hello world!');
    }
}
```

In these command files, we avoid (re-)declaring the `public` modifiers for the properties and methods since the goal is to keep things looking minimal and clean for these files.
