const Discord = require("discord.js");
const client = new Discord.Client();

const config = require("./config.json"),
blacklist = require("./blacklist.json"),
giveaways = require("./giveaways.json");

// Chargement des nodes modules
const { table } = require("table"),
giveaways = require("discord-giveaways"),
ms = require("ms"),
fetch = require("node-fetch"),
arraySort = require("array-sort"),
fs = require("fs");

const messages = {
    giveaway: "@everyone\n\n🎉🎉 **GIVEAWAY** 🎉🎉",
    giveawayEnded: "@everyone\n\n🎉🎉 **GIVEAWAY TERMINÉ** 🎉🎉",
    timeRemaining: "Temps restant : **{duration}**!",
    inviteToParticipate: "Réagissez avec 🎉 pour participer !",
    winMessage: "Bravo, {winners}! Vous avez gagné **{prize}**!",
    embedFooter: "Giveaways",
    noWinner: "Giveaway annulé, pas de participation valide.",
    winners: "gagnant(s)",
    endedAt: "Fin le",
    units: {
        seconds: "secondes",
        minutes: "minutes",
        hours: "heures",
        days: "jours"
    }
};

client.on("ready", () => {
    client.user.setActivity(config.game);
    console.log("I'm ready!");
    giveaways.launch(client, {
        updateCountdownEvery: 10000,
        botsCanWin: false,
        ignoreIfHasPermission: [
            "MANAGE_MESSAGES",
            "MANAGE_GUILD",
            "ADMINISTRATOR"
        ],
        embedColor: "#FF0000",
        reaction: "🎉"
    });
});

/* Messages de bienvenue */
client.on("guildMemberAdd", (member) => { 

    let isOk = true;
    blacklist.links.forEach((element) => {
        if(member.user.username.indexOf(element) > -1){
            let banEmbed = new Discord.RichEmbed()
                .setAuthor("Membre Banni")
                .setColor(0x00AE86)
                .setFooter(footer)
                .setThumbnail(member.user.avatarURL)
                .addField("Banni par :", "Automatique")
                .addField("Membre banni :", member)
                .addField("Raison : ", "Contient un pseudo invalide : " + element);
            client.channels.get(config.specialChannels.welcome).send(banEmbed);
            member.ban("Pseudo invalide "+element);
            isOk = false;
        }
    });

    if(isOk){
        client.guilds.get(config.guildID).channels.get(config.specialChannels.welcome).send(`Salut ${member}, bienvenue sur le serveur **World of Tanks [FR]** !`);
        member.send(`**Bienvenue ${member} sur le serveur discord World of Tanks [FR] !**\n\n• Pour commencer, veuillez **accepter nos règles générales** en cliquant sur ✅ dans <#467749941658517516> (pour pouvoir voir les autres salons) et assurez-vous de lire les <#467750524561784842> !\n• Si vous avez des questions, il se peut qu'elles aient déjà été répondues dans la section **FAQ** des <#467750524561784842>.\n\n**Nous espérons que vous passerez un bon moment et que vous apprécierez votre séjour !**\n\n• **Invitez vos collègues tankistes et amis en utilisant notre URL d'invitation:**\n\nhttps://discord.gg/FAsBP5q`);
    }
    
}); 


client.on("message", async (message) => {
    
    /* Envoi des messages privés dans le salon #logs */
    if(message.channel.type === "dm"){
        if(message.author.bot) return;
        let mpEmbed = new Discord.RichEmbed()
            .setAuthor("Nouveau Message Privé")
            .setColor(0x00AE86)
            .setFooter(footer, message.author.avatarURL)
            .setThumbnail(message.author.avatarURL)
            .addField("Depuis", message.author)
            .addField("Contenu", message.content)
            .addField("Id du membre", message.author.id);
        client.guilds.get(config.guildID).channels.find((channel) => channel.name === "logs").send(mpEmbed);
    }
    

    blacklist.links.forEach((element) => {
        if(!message.member.hasPermissions("MANAGE_MESSAGES") && message.content.includes(element) && !blacklist.ignoredChannels.includes(message.channel.id)){
            message.delete().catch(() => {});
            message.reply("les liens d'invitation ne sont pas autorisés !");
        }
    });

    if(message.content.indexOf(config.prefix) !== 0 || message.guild.id !== config.guildID) return;

    const logschannel = message.guild.channels.get(config.specialChannels.logs);

    const hasPerm = message.member.hasPermissions("MANAGE_MESSAGES");
    const args = message.content.slice(config.prefix.length).trim().split(/ +/g);
    const command = args.shift().toLowerCase();

    if(command === "say"){
        if(!hasPerm){
            return message.reply("permissions insuffisantes.");
        }
        let toSay = args.join(" ");
        message.delete();
        message.channel.send(toSay);
    }

    if(command=== "levelxp"){
        if(message.author.id !== "159985870458322944") return; // !levelxp @membre #channel LEVEL
        message.delete();
        let member = message.mentions.members.first(); 
        let newLevel = parseInt(args[2]);
        let oldLevel = the_level - 1;
        let channel = message.mentions.channels.first();
        let ggEmbed = new Discord.RichEmbed()
            .setAuthor(`GG ${member.user.username} !`)
            .setColor(0xFF0000)
            .setDescription(`Tu viens de passer le niveau ${oldLevel} et d'arriver au niveau ${newLevel} !`)
            .setFooter("Tape /rank pour voir plus d'informations • Mee6 API")
            .setThumbnail(member.user.displayAvatarURL);
        channel.send(ggEmbed);
    }

    if(message.author.bot) return;

    if(command === "report"){
        let member = message.mentions.members.first();
        if(!member) return message.reply("mentionne un membre valide.");
        if(!args.slice(1).join(" ")) return message.reply("rentre une raison à ton report.");
        let reportEmbed = new Discord.RichEmbed()
            .setAuthor("Nouveau report")
            .setColor(0xFF0000)
            .setFooter(footer, message.guild.iconURL)
            .setThumbnail(message.author.avatarURL)
            .addField("Report par", message.author)
            .addField("Membre report", member)
            .addField("Raison", args.slice(1).join(' '))
            .addField("Salon", message.channel);
        client.channels.get(config.specialChannels.reports).send(reportEmbed);
        message.reply("membre signalé.");
    }

    if(!config.channelsAllowed.includes(message.channel.id) && !hasPerm){
        message.delete();
        let m = await message.reply("tape cette commande dans <#"+config.channelsAllowed[0]+"> !");
        return setTimeout(function(){
            m.delete();
        }, 5000);
    }

    if(command === "setavatar"){
        if(!message.member.roles.hasPermissions("ADMINISTRATOR")) return message.reply("permissions insuffisantes.");
        client.user.setAvatar(args.join(" ") || message.attachments.first().url).catch((err) =>{
            return message.channel.send("L'image est invalide ou vous changez d'image trop rapidement !");
        });
        return message.channel.send(`Avatar changé !`);
    }

    if(command === "start-giveaway"){
        let time = args[0];
        if(!time || isNaN(ms(args[0]))) return message.reply("entrez un temps valide !");
        let winnersCount = args[1];
        if(!winnersCount || isNaN(winnersCount)) return message.reply("entrez un nombre de gagnants valide !");
        let prize = args.slice(2).join(" ");
        if(!prize) return message.reply("entrez un prix valide !");
        giveaways.start(message.channel, {
            time: ms(args[0]),
            prize,
            winnersCount
        }).then((gData) => {
            message.reply("giveaway lancé !");
        });
    }

    if(command === "topinvites"){

        // First, we need to fetch the invites
        let invites = await message.guild.fetchInvites().catch(() => {});
        arraySort(invites, "uses", { reverse: true });
        let possibleInvites = [["Inviteur", "Nombre Utilisations"]];
        let top = [];
        invites.forEach((invite) => {
            let user = top[invite.inviter.username] || 0;
            if(invites.uses < 0) return;
            top[invite.inviter.username] += invites.uses;
        });
        for (let key in top) {
            possibleInvites.push([key, top[key]]);
        }
        const embed = new Discord.RichEmbed()
            .setColor(config.embed.color)
            .setFooter(config.embed.footer)
            .addField("Leaderboard", `${table(possibleInvites)}`);
        message.channel.send(embed);
    }

    if(command === "invites"){
        let member = message.mentions.members.first() || message.member;
        let invites = await message.guild.fetchInvites().catch((err) => {}); 
        let memberInvites = invites.filter((i) => i.inviter.id === membre.id);
        if(memberInvites.size <= 0) return message.channel.send(":x: | Actuellement aucune invitation !");
        let usesCount = memberInvites.map((i) => i.uses).reduce((a, b) => a+b);
        let content = memberInvites.map((i) => `**${i.code}** (${i.uses} utilisations) | ${i.channel}`).join("\n");

        if(usesCount >= 20 && !membre.roles.has('467759921585192970')){
            membre.addRole('467759921585192970');
        }
        
        const embed = new Discord.RichEmbed()
        .setColor(config.embed.color)
        .setAuthor("Invites Tracker")
        .setDescription(`Informations sur les invitations de ${member}`)
        .addField("👥 Personnes Invitées", `${usesCount} membres`)
        .addField("🔑 Codes", content);

        message.channel.send(embed);
    }

    if(command === "help"){
        let helpEmbed = new Discord.RichEmbed()
            .setAuthor("Affichage des commandes de modérations disponibles")
            .setDescription('[] siginifie paramètre obligatoire, () siginifie paramètre facultatif')
            .setColor(0xFF0000)
            .setFooter(footer, message.author.avatarURL)
            .setThumbnail(message.guild.iconURL)
            .addField(config.prefix + "help", "Affiche ce message")
            .addField(config.prefix + "mi", "Affiche des informations sur les membres")
            .addField(config.prefix + "si", "Affiche des informations sur le serveur")
            .addField(config.prefix + "ui", "Affiche des informations sur le membre")
            .addField(config.prefix + "setplay [jeu]", "Change le jeu du bot")
            .addField(config.prefix + "setprefix [prefixe]", "Change le préfixe du bot")
            .addField(config.prefix + "report [@membre] [raison]", "Reporte un joueur à l'administration")
            .addField(config.prefix + "warn [@membre] [raison]", "Averti le membre mentionné en message privé et lui ajoute un rôle avertissement")
            .addField(config.prefix + "sendall [message]", "Envoi un message privé à tout le serveur")
            .addField(config.prefix + "start-giveaway [nombre de gagnant] [temps] [lot]", "Lance un Giveaway")
            .addField(config.prefix + "ping", "Renvoie la latence du bot")
            .addField(config.prefix + "mp [@membre] [message]", "Envoie un message privé à la personne mentionnée")
            .addField(config.prefix + "ban [@membre] (raison)", "Banni le membre !")
            .addField(config.prefix + "unban [ID]", "Unban le membre qui a l'id")
            .addField(config.prefix + "ban-list", "Affiche la liste des bannis !")
            .addField(config.prefix + "clear [nombre de message]", "Supprime le nombre de messages demandé")
            .addField(config.prefix + "social", "Affiche les réseaux de World Of Tanks FR !")
            .addField(config.prefix + "setavatar [url]", "Change la photo de profil du bot !");
        message.channel.send(helpEmbed);
    }

    if(command === "ping"){
        message.reply(`pong ! Mon ping est de \`${Date.now() - message.createdTimestamp}\` millisecondes !`);
    }

    if(command === "sendall"){
        if(!hasPerm) return message.reply("permissions insuffisantes.");
        message.delete();
        if(!args[0]) return message.reply("entre un message !");
        let message = args.join(" ");
        let embed = new Discord.RichEmbed()
            .setAuthor(`Message adressé à tout les membres du serveur **${message.guild.name}**`)
            .setDescription(message)
            .setColor(config.embed.color)
            .setFooter("Ce message a été envoyé à tout les membres du serveur");
        message.guild.members.forEach((member) => {
            member.send(embed).catch(() => {});
        });
        message.reply("messages envoyés !");
    }

    if(command === "ui" || command === "userinfo"){
        let member = message.mentions.members.first() || message.member;
        let user = member.user;
        let embed = new Discord.MessageEmbed()
            .setAuthor(user.tag, user.displayAvatarURL)
            .setThumbnail(user.displayAvatarURL())
            .addField("Pseudo", user.username, true)
            .addField("Discriminant", user.discriminator, true)
            .addField("Bot", (user.bot ? "Oui" : "Non"), true)
            .addField("Création", printDate(new Date(user.createdAt)), true)
            .addField("Avatar", user.displayAvatarURL)
            .setColor(config.embed.color)
            .setFooter(config.embed.footer)
            .addField("Jeu", (user.presence.game ? user.presence.game.name : "Pas de jeu"), true)
            .addField("Statut", user.presence.status, true)
            .addField("Role +", (member.roles.highest ? member.roles.highest : "Pas de rôle"), true)
            .addField("A rejoint", printDate(new Date(member.joinedAt)),true)
            .addField("Couleur", member.displayHexColor, true)
            .addField("Nickname", (member.nickname ? member.nickname : "Pas de nickname"), true)
            .addField("Rôles", (member.roles.size > 10 ? member.roles.map((r) => r).slice(0, 9).join(", ")+"et "+String(member.roles.size - 10)+" autres rôles" : (member.roles.size < 1) ? "Pas de rôle" : member.roles.map((r) => r).join(", ")));
        message.channel.send(embed);
    }

    if(command === "unban"){
        if(!hasPerm) return message.reply("permissions insuffisantes.");
        message.delete();
        let user = await client.fetchUser(args.join(" ")).catch(() => {});
        if(!user) return message.channel.send("Aucun utilisateur discord ne possède cette ID.");
        message.guild.unban(user.id);
        message.channel.send(`${user.username} a bien été unban du serveur !`);
    }

    if(command === "leaderboard"){
        let m = await message.channel.send("Calcul du leaderboard en cours...");
        let res = await fetch("https://mee6.xyz/api/plugins/levels/leaderboard/467749941658517514");
        let json = await res.json();
        if (json.error)  return m.edit(":x: | Erreur lors de la connexion à l'api Mee6.");
        let players = sortByKey(json.players, "xp");
        let rank = 1;
        let content = players.map((p) => rank <= 10 ? `#${rank} | **${p.username}** - (Niveau ${p.level})` : "").join("\n");
        let embed = new Discord.RichEmbed()
            .setAuthor("Leaderboard")
            .setTitle("Voir le leaderboard complet")
            .setURL("https://mee6.xyz/leaderboard/467749941658517514")
            .setColor(config.embed.color)
            .addField("TOP", the_message)
            .setFooter('Classement des personnes les plus actives du serveur !')

        m.edit("Les informations ont été reçues et le leaderboard a été calculé !", embed);
    }

    if(command === "social"){
        let embed = new Discord.RichEmbed()
            .setAuthor("Réseaux de WOT FR")
            .setColor(config.embed.color)
            .addField("Twitter", "https://twitter.com/WorldofTanksFR_")
            .addField("YouTube", "https://www.youtube.com/channel/UCMGbVAZpv7jEQQR1PYacAYw")
            .setFooter(config.embed.footer);
        return message.reply(embed);
    }

    if(command === "si" || command === "serverinfo"){
        let guild = await message.guild.fetchMembers();
        let embed = new Discord.MessageEmbed()
            .setAuthor(guild.name, guild.iconURL)
            .setThumbnail(guild.iconURL)
            .addField("Nom", guild.name, true)
            .addField("Création", printDate(guild.createdAt), true)
            .addField("Membres", guild.members.size, true)
            .addField("AFK", guild.afkChannel || "Pas de salon AFK", true)
            .addField("ID", guild.id, true)
            .addField("Propriétaire", guild.owner, true)
            .addField("Salons", guild.channels.filter((ch) => ch.type === "text").size+" textuels | "+guild.channels.filter((ch) => ch.type === "voice").size+" vocaux", true)
            .setColor(config.embed.color)
            .setFooter(config.embed.footer);
        message.channel.send(embed);
    }

    if(command === "actu"){
        if(!hasPerm) return message.reply("permissions insuffisantes.");
        let m = await message.channel.send("**[AUTOROLE]** Actualisation des membres en cours...");
        let guild = await message.guild.fetchMembers();
        let list = "**Liste des membres actualisés : **\n\n";
        let actu = [];
        guild.members.forEach((member) => {
            if(member.user.bot) return;
            let joinedTimestamp = member.joinedTimestamp;
            let roleID = "467756608882081803";
            if(Date.now()-joinedTimestamp > 864000000){
                if(!member.roles.has(roleID)){
                    member.addRole(message.guild.roles.get(roleID));
                    actu.push(member);
                }
            }
            if(actu.length <= 0) return m.edit("**[AUTOROLE]** Aucun membre présent depuis plus de 10 jours n'avait pas le rôle Joueur...");
            m.edit(`${list}${actu.map((m) => `**${m.user.tag}**`).join("\n")}`);
        });
    }

    if(command === "setplay"){
        if(!hasPerm) return message.reply("permissions insuffisantes.");
        if(!args[0]) return message.reply("entre un jeu !");
        config.game = args.join(" ");
        fs.writeFileSync("./config.json", JSON.stringify(config));
        client.user.setActivity(config.game);
        message.channel.send("Jeu mis à jour !");
        let playEmbed = new Discord.RichEmbed()
            .setAuthor("Jeu mis à jour")
            .setColor(config.embed.color)
            .setFooter(config.embed.footer, message.guild.iconURL)
            .setThumbnail(message.author.avatarURL)
            .addField("Depuis", message.author)
            .addField("Nouveau jeu", config.game);
        logschannel.send(playEmbed);
    }

    if(command === "mi"){
        let guild = await message.guild.fetchMembers();
        let total = 1000 - parseInt(guild.memberCount);
        let statsMsg = new Discord.RichEmbed()
            .setAuthor("Informations sur les membres")
            .setColor(config.embed.color)
            .setFooter(config.embed.footer)
            .setThumbnail(message.guild.iconURL)
            .addField("Membres", guild.memberCount)
            .addField("Membres en ligne", guild.members.filter((m) => m.presence && m.presence.status !== "offline").size)
            .addField("Membres manquants pour les 1k", total);
        message.channel.send(statsMsg);
    }

    if(command === "setprefix"){
        if(!hasPerm) return message.reply("permissions insuffisantes.");
        if(!args[0]) return message.reply("entre un préfixe !");
        config.prefix = args[0];
        fs.writeFile("./config.json", JSON.stringify(config));
        message.channel.send(`Préfixe mis à jour en ${config.prefix} !`);
        let playEmbed = new Discord.RichEmbed()
            .setAuthor("Préfixe mis à jour")
            .setColor(config.embed.color)
            .setFooter(config.embed.footer, message.guild.iconURL)
            .setThumbnail(message.author.avatarURL)
            .addField("Depuis", message.author)
            .addField("Nouveau préfixe", config.prefix);
        logschannel.send(playEmbed);
    }

    if(command === "warn") {
        if(!hasPerm)  return message.reply("permissions insuffisantes.");
        let text = "Aucun avertissement";
        let role = message.guild.roles.get(config.specialRoles.warn);

        let member = message.mentions.members.first();
        if(member.hasPermission("MANAGE_MESSAGES")) return message.reply("impossible de warn un membre du staff.");
        if(!member) return message.reply("mentionne un membre valide !");
    
        let reason = args.slice(1).join(" ");
        if(!reason) return message.reply("Tu dois donner une raison");
    
        member.send("Averti sur le serveur **" + message.guild.name + "** pour : " + _reason).catch(() => {});
        
        if(member.roles.has(role)){
            member.ban();
            message.channel.send("*" + member + " a bien été averti, c'était son deuxième avertissement, il a été banni !*");
            text = "2 avertissements, membre banni."
        }
        if(!member.roles.has(role)){
            member.addRole(roles);
            message.channel.send("*" + member + " à bien été averti, c'est son premier avertissement !*")
            text = "1 avertissement";
        }
        let warnEmbed = new Discord.RichEmbed()
            .setAuthor("Membre Averti")
            .setColor(config.embed.color)
            .setFooter(config.embed.footer)
            .setThumbnail(_averti.user.avatarURL)
            .addField("Averti par :", message.author)
            .addField("Membre averti :", member)
            .addField("Raison :", reason)
            .addField("Nombre d'avertissement(s) :", text);
        logschannel.send(ban_embed);
    }

    if(command === "clear"){
        if(!hasPerm) return message.reply("permissions insuffisantes.");
        if(!args[0]) return message.reply("donne un nombre de message à supprimer !");
        if(isNaN(args[0])) return message.reply("entre un nombre valide !");
        let toSuppr = parseInt(args[0])+1;
        await message.channel.bulkDelete(toSuppr > 99 ? 99 : toSuppr, true);
        let m = await message.channel.send(`${args[0]} messages supprimés.`);
        setTimeout(function(){
            m.delete();
        }, 5000);
    }

    if(command === "ban-list") {
        if(!hasPerm) return message.reply("permissions insuffisantes.");
        let bans = await message.guild.fetchBans();
        let msg = bans.map((b) => `${b.tag} - (${b.id})`).join("\n");
        let banEmbed = new Discord.RichEmbed()
            .setAuthor("Liste des bannis")
            .setDescription(msg)
            .setColor(config.embed.color)
            .setFooter(config.embedfooter);
        message.channel.send(banEmbed);
    }

    if(command === "ban") {
        if(!hasPerm) return message.reply("permissions insuffisantes.");

        let member = message.mentions.members.first();
        if(!member) return message.reply("mentionne un membre valide !");

        if(member.hasPermissions("MANAGE_MESSAGES")) return message.reply("impossible de bannir un membre du staff.");
        let reason = args.slice(1).join(" ") || "pas de raison";

        member.send("Banni sur le serveur **" + message.guild.name + "** pour : " + _reason).catch(() => {});
        
        banni.ban(`Banni par ${message.author.username} || Pour : ${reason}`);
        
        let banEmbed = new Discord.RichEmbed()
            .setAuthor("Membre Banni")
            .setColor(config.embed.color)
            .setFooter(config.embed.footer)
            .setThumbnail(member.user.avatarURL)
            .addField("Banni par :", message.author)
            .addField("Membre banni :", member)
            .addField("Raison : ", reason);
        logschannel.send(ban_embed);
    }

    if(command === "mp"){
        if(!hasPerm) return message.reply("permissions insuffisantes.");

        let member = message.mentions.members.first();
        if(!member) return message.reply("mentionne un membre valide !");

        let msg = args.slice(1).join(" ");
        if(!msg) return message.reply("rentre un message à envoyer !");

        member.send(args.slice(1).join(' ')).then(() => {
            let mpEmbed = new Discord.RichEmbed()
                .setAuthor("Message Privé Envoyé")
                .setColor(config.embed.color)
                .setFooter(config.embed.footer, message.guild.iconURL)
                .setThumbnail(message.author.avatarURL)
                .addField("Depuis", message.author)
                .addField("Destinataire", member)
                .addField("Contenu", msg)
                .addField("Id du destinataire", member.id)
            logschannel.send(mpEmbed);
            message.reply("message envoyé !");
        }).catch(() => {
            message.reply("échec de l'envoi !");
        });
    }
    
});

client.login(config.token);

function printDate(pdate){
    let monthNames = [
        "janvier", "février", "mars",
        "avril", "mai", "juin", "juillet",
        "août", "septembre", "octobre",
        "novembre", "decembre"
    ];

    let day = pdate.getDate(),
    monthIndex = pdate.getMonth(),
    year = pdate.getFullYear(),
    hour = pdate.getHours(),
    minute = pdate.getMinutes();

    return `${day} ${monthNames[monthIndex]} ${year} à ${hour}h${minutes}`;
};
  
function sortByKey(array, key) {
    return array.sort(function(a, b) {
        var x = a[key]; var y = b[key];
        return ((x < y) ? 1 : ((x > y) ? -1 : 0));
    });
}