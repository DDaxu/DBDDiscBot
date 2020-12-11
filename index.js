const Discord = require('discord.js');
const fs = require('fs');
const {prefix} = require('./config.json');
const { Client, MessageAttachment } = require('discord.js');
const rules = './rules.json';
require('dotenv').config();
const token = process.env.TOKEN;

const client = new Discord.Client();
client.on('message', (msg) => {

    //command handler
    const args = msg.content.slice(prefix.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();
    //commands
    if(command === 'hello') {
        msg.channel.send(`${msg.author} Hello!`);
    }
    if(command === 'commands'){
        //Making nice looking embed message for all commands we have
        const embed = new Discord.MessageEmbed()
            .setColor('#D20101')
            .setTitle('Dead By Daylight drinking game bot commands')
            .setDescription('This is bot for handling drinking game rules. It can for example add new rules, modify them or even delete them.')
            .addField('\u200B','\u200B')
            .addField('hello', 'Says hello to you', true)
            .addField('commands', 'Give command list to you', true)
            .addField('\u200B','\u200B')
            .addFields(
                {name: 'dbd', value: 'write dbd and argument after that. (for example !dbd write)' },
                {name: 'read', value: 'Send rules as a message to this channel', inline:true },
                {name: 'write', value: 'Write new rule to rule list', inline:true },
                {name: 'modify', value: 'Modify given rule' },
                {name: 'delete', value: 'Delete given rule', inline:true },
                {name: 'file', value: 'Gives you downloadable text file', inline:true },
            )
            .setTimestamp();
            msg.channel.send(embed);
    }
    //Drunk by daylight rules and rules management
    if(command === 'dbd'){
        if(!args.length){
            return msg.channel.send("Give command please.");
        //Send list of rules to the channel
        } else if(args[0] === 'read'){
            var string = JSONtoString();
            msg.channel.send(string); 
        //Add new rule to the channel
        } else if(args[0] === 'write'){
            msg.channel.send('Let`s add new rule to the channel. Please write rule description first.');
            var calc = 1;
            var kuli = 0;
            var teksti = '';
            //Collectors job is to collect multiple answers from the user and it is used multiple times in this program
            const collector = new Discord.MessageCollector(msg.channel,m => m.author.id === msg.author.id);
            collector.on('collect', (message, col) =>{
                if(calc === 1){
                    teksti = message.content;
                    msg.channel.send("Rule is: " + teksti +"\n\nGive amount of kulis");
                }else if (calc === 2){
                    kuli = message.content;
                    collector.stop();
                }
                calc++;
            });
            //Shutting collector and now colletor starts to process the given information
            collector.on('end', collected =>{
                msg.channel.send("Rule is: " + teksti + "\nkuli amount is: " + kuli);
                
                if(isNaN(kuli) == false){
                    JSONnewRule(teksti, kuli);
                }else {
                    msg.channel.send("New rule drink amount is not a number. Try again.");
                }
    
            });
        //Modify the spesific rule
        } else if(args[0] === 'modify'){
            msg.channel.send('Modify rule with rule ID. Give rule ID you want to modify.');
            var calc = 1;
            var ruleId = 0;
            var rule = "";
            var kuli = 0;
            const collector = new Discord.MessageCollector(msg.channel,m => m.author.id === msg.author.id);
            collector.on('collect', (message, col) => {
                if(calc == 1){
                    ruleId = message.content;
                    msg.channel.send("The rule ID you want to change is: " + ruleId + ". Now write new rule.");
                } else if(calc == 2){
                    rule = message.content;
                    msg.channel.send("The new rule is: " + rule + ". Now write kuli amount.");
                } else if(calc == 3){
                    kuli = message.content;
                    collector.stop();
                }
                calc++;
            });
            collector.on('end', collected =>{
                msg.channel.send("RuleID is: " + ruleId + "\nnew rule is:  " + rule + "\nnew kuli amount is: " + kuli);
                if(isNaN(kuli) == false){
                    msg.channel.send(JSONmodifyRule(ruleId, rule, kuli));
                } else {
                    msg.channel.send("Kuli amount has to be a number");
                }

            });
        //Delete given rule by ID
        } else if(args[0] === 'delete'){
            msg.channel.send('Give rule ID you want to delete');
            var calc = 1;
            var ruleID = 0;
            var answer = "";
            var deleteBool = 0;
            const collector = new Discord.MessageCollector(msg.channel,m => m.author.id === msg.author.id);
            collector.on('collect', (message, col) => {
                if(calc == 1){
                    ruleID = message.content;
                    //Extra question about deleting for it´s severity
                    msg.channel.send("The rule you want to delete is: " + JSONgetRule(ruleID)+ " Do you want to proceed? (Y/N)");
                } else if(calc == 2){
                    answer = message.content;
                    answer = answer.toLowerCase();
                    if(answer == "y" || answer == "yes"){
                        msg.channel.send("Deleting the rule...");
                        deleteBool = 1;
                        collector.stop();
                    } else {
                        msg.channel.send("Deleting process is cancelled.");
                        deleteBool = 0;
                        collector.stop();
                    }
                }
                calc++;
            });
            collector.on('end', collected =>{
                if(deleteBool == 1){
                    JSONdeleteRule(ruleID);
                    msg.channel.send("Rule has been deleted.");
                } 
            });
        //Give rules as a text file
        }  else if(args[0] === 'file'){
            var string = JSONtoString();
            fs.writeFile('./DBDrules.txt', string, function(err) {
                if(err) return console.log(err);
                
            });
            const attachment = new MessageAttachment('./DBDrules.txt');
            msg.channel.send(`${msg.author}`, attachment);
        } 
    }

});

/* 
 * Functions for handling JSON files how we want.
 * Idea is to make top code more simple to read.
 * For the future: These codes can be merged as one function propably.
 */

 //JSON file to a String. We want to send one big message to the channel instead of multiple messages
function JSONtoString(){
    var content = fs.readFileSync(rules);
    var ruleList = JSON.parse(content);
    var string = '';
    ruleList.forEach(function(x) {
        string += x.ruleID + ". " + x.rule + " = kulis " + x.amount + '\n';
    });
    return string;
}
// Get one spesific rule for deleting as a text line
function JSONgetRule(id){
    var content = fs.readFileSync(rules);
    var ruleList = JSON.parse(content);
    var string = '';
    ruleList.forEach(function(x) {
        if(x.ruleID == id){
            string += x.ruleID + ". " + x.rule + " = kulis " + x.amount + '\n';
        }
    });
    return string;
}
//Add new rule to the end of the rule list
function JSONnewRule(newRule, kuliNumber){
    var content = fs.readFileSync(rules);
    var ruleList = JSON.parse(content);
    var lastNumber;
    
    ruleList.forEach(function(x) {
        lastNumber = x.ruleID; 
     });
     lastNumber = lastNumber + 1;
     ruleList.push({"ruleID": lastNumber,"rule": newRule, "amount": parseInt(kuliNumber, 10)});
    fs.writeFile('./rules.json',JSON.stringify(ruleList, null, 2),'utf8', function(err) {
        if(err) return console.log(err);
        
    });
}
//Delete rule by ID
function JSONdeleteRule(id){
    var content = fs.readFileSync(rules);
    var ruleList = JSON.parse(content);
    //calculator for making new order for IDs
    var i = 1;
    ruleList.forEach(function(x){
        if(x.ruleID == id){
            var y = x.ruleID;
            if(isNaN(y) == false){
                console.log(x.rule);
                y = y - 1;
                ruleList.splice(y, 1);
            }
        }
    });

    //set ID:s back to normal when one rule is removed.
    ruleList.forEach(function(x){
        x.ruleID = i;
        i++;
    });
    fs.writeFile('./rules.json', JSON.stringify(ruleList, null, 2),'utf8',function(err){
        if(err) return console.log(err);
        });
}
//Modify spesific rule by ID. parameters are new rule and kuli amount
function JSONmodifyRule(id, newRule, newKuli){
    var content = fs.readFileSync(rules);
    var ruleList = JSON.parse(content);
    var idExists = 0;
    var complete = "";
    ruleList.forEach(function(x) {
        if(x.ruleID == id){
            x.rule = newRule;
            x.amount = parseInt(newKuli, 10);
            idExists = 1;
        }
    });
    //Extra check for ID and if everything is OK, we can proceed.
    if(idExists == 1){
        fs.writeFile('./rules.json', JSON.stringify(ruleList, null, 2),'utf8',function(err){
        if(err) return console.log(err);
        });
        complete = "Rule was changed. try !dbd read to see changes.";
        return complete;
    } else {
        complete = "ID was not found. Try again.";
        return complete;
    }
}

client.on('ready', () => {
    console.log('Robobot is online.');
});

client.login(token);