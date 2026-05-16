---
title: My Post Title
subtitle: A longer descriptive line under the title
description: A short summary shown below the subtitle (also works as 'excerpt')
author: Alice Smith
date: 2026-05-16
updated: 2026-05-20
---

## What is WEX?

WEX is a framework designed to improve the efficiency of engineering a streaming service, it was originally developed as the base for [WatchFlicker](https://watchflicker.doubtmedia.com/) in 2025 with WEX 25.3112-IR. It was originally built in Python & JavaScript but is now being developed used Python, SQL, TypeScript, and [Gram](https://github.com/meeratsdev/symlang/) as of WEX 26.2703-BR.

## How To Install WEX:

1. Download the latest build of WEX from the GitHub repo's [releases](https://github.com/meeratsdev/wex-framework/releases/)
2. Run `wex-configurator.exe`
    1. input your project's information (Name, WEX License, Author, GitHub Repo)
    2. Click "generate config" **IMPORTANT: DO NOT SHARE YOUR CONFIG FILE**
    3. drag the config file into `/configs`
3. Put the WEX files onto a web server (we recommend Vercel as a free option or AWS as a payed option)

## How To Use WEX:

### Configuring WEX:

If you didn't configure WEX properly during installation _or_ you wish to alter settings after you've already setup WEX you can simply:

1. go to `https://dashboard.wex.org/`
2. enter your login details from when you first configured WEX
   and voila: you can edit _any_ setting you want including:

- Add/Remove content
- Changing site layout and/or styles
- Enable/disable account features
- etc.

### What to do if you forgot your WEX login:

1. go to `https://support.wex.org`
2. select: "I am a WEX user"
3. choose: "Account Issue"
4. fill out the ticket with your issue

We'll attempt to get back to you asap to resolve the issue however, if we are unable to verify your identity you will not be given access to the login credentials at which point we suggest simply reinstalling WEX.

### Modifying WEX:

#### Plugins:

You are able to use TypeScript to create custom plugins for WEX which are installed by dropping the files of the plugin into the `"/plugins"` directory in your WEX installation. These can be minor tweaks or even complete feature sets. Community-made WEX plugins are available on `https://plugins.wex.org/`

#### Forking:

WEX Community is fully open-source and you can fork it freely to modify it however you want, since WEX Commercial licenses are just WEX Community that allows commercial usage you are able to use all WEX community forks with a WEX Commercial license. However forking WEX Enterprise is not permitted as WEX Enterprise contains recent code that may be removed at a later point and is bleeding-edge.

## LICENSING

### Tiers of License:

|                        | Community<br>_(>10 People)_ | Business<br>_(>100 People)_<br> | Enterprise<br>_(<100 People)_ | Education<br>_(Students & Teachers)_ |
| ---------------------- | :-------------------------: | :-----------------------------: | :---------------------------: | :----------------------------------: |
| Price $                |            free             |            $39/year             |           $399/year           |        free _(for students)_         |
| Open-Source?           |             Yes             |               Yes               |              No               |                  No                  |
| Latest version?        |             No              |               No                |              Yes              |                 Yes                  |
| Commercial Use?        |             Yes             |               Yes               |              Yes              |                  No                  |
| Allows Forks?          |             Yes             |               Yes               |              No               |                  No                  |
| Official Support?      |             No              |               Yes               |              Yes              |                 Yes                  |
| Supports Plugins?      |             Yes             |               Yes               |              Yes              |                 Yes                  |
| Self-Hosted Dashboard? |             No              |               Yes               |              Yes              |                  No                  |
