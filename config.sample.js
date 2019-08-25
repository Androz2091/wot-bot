module.exports = {
    /* Le token du bot */
    "token": "XXXXXXXXXX",
    /* Le préfixe du bot */
    "prefix": "/",
    /* Le jeu du bot */
    "game": "veiller sur le serveur",
    /* Le serveur sur lequel le bot répond */
    "guildID": "XXXXXXXXXX",
    /* Les salons spéciaux */
    "specialChannels": {
        "welcome": "XXXXXXXXXX", // Le salon du message de bienvenue
        "logs": "XXXXXXXXXX", // Le salon des logs
        "reports": "XXXXXXXXXX" // Le salon des reports
    },
    /* Les rôles spéciaux */
    "specialRoles": {
        "warn": "XXXXXXXXXX" // Le rôle 1er Avertissement
    },
    /* Les salons dans lesquels les commandes sont autorisées */
    "channelsAllowed": [
        "XXXXXXXXXX",
        "XXXXXXXXXX"
    ],
    /* La configuration des embeds */
    "embed": {
        "color": "#FF0000", // La couleur des embeds
        "footer": "WotBot" // Le footer des embeds
    },
    /* Configuration de la blacklist */
    "blacklist": {
        /* Les mots et liens blacklistés */
        "blacklisted": [
            "discord.gg"
        ],
        /* Les salons ou la blacklist n'a pas d'effet */
        "ignoredChannels": [
            "XXXXXXXXXX"
        ]
    }
    
};