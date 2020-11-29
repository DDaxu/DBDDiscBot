const Discord = require('discord.js');
const fs = require('fs');
const {prefix} = require('./config.json');
const { Client, MessageAttachment } = require('discord.js');
const rules = './rules.json';
require('dotenv').config();
const token = process.env.TOKEN;

const client = new Discord.Client();
//console.log(process.env.TOKEN);
client.on('message', (msg) => {

    //command handler
    const args = msg.content.slice(prefix.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();
    //commands
    if(command === 'hello') {
        msg.channel.send(`${msg.author} Terve!`);
        JSONdeleteRule();
    }
    //Drunk by daylight rules and rules management
    if(command === 'dbd'){
        if(!args.length){
            return msg.channel.send("Give command please.");
        } else if(args[0] === 'read'){
            var string = JSONtoString();
            msg.channel.send(string); 
        } else if(args[0] === 'write'){
            msg.channel.send('Lisätään uusi sääntö. Kirjoita seuraavat tiedot seuraavassa järjestyksessä:\nsääntö \nkulien määrä');
            var y = 1;
            var kuli = 0;
            var teksti = '';
            const collector = new Discord.MessageCollector(msg.channel,m => m.author.id === msg.author.id);
            collector.on('collect', (message, col) =>{
                if(y === 1){
                    teksti = message.content;
                    msg.channel.send("sääntö on: " + teksti +"\n\n Anna seuraavaksi kulien määrä");
                }else if (y === 2){
                    kuli = message.content;
        
                    collector.stop();
                }
                y++;
            });
            collector.on('end', collected =>{
                msg.channel.send("sääntö on: " + teksti + "\nkulimäärä on: " + kuli);
                console.log(parseInt(kuli, 10));
                
                if(isNaN(kuli) == false){
                    JSONnewRule(teksti, kuli);
                }else {
                    msg.channel.send("New rule drink amount is not a number. Try again.");
                }
    
            });
        } else if(args[0] === 'modify'){
            msg.channel.send('Modify rule with rule ID. Give rule ID you want to modify.');
            var y = 1;
            var ruleId = 0;
            var rule = "";
            var kuli = 0;
            const collector = new Discord.MessageCollector(msg.channel,m => m.author.id === msg.author.id);
            collector.on('collect', (message, col) => {
                if(y == 1){
                    ruleId = message.content;
                    msg.channel.send("The rule ID you want to change is: " + ruleId + ". Now write new rule.");
                } else if(y == 2){
                    rule = message.content;
                    msg.channel.send("The new rule is: " + rule + ". Now write kuli amount.");
                } else if(y == 3){
                    kuli = message.content;
                    collector.stop();
                }
                y++;
            });
            collector.on('end', collected =>{
                msg.channel.send("ruleID is: " + ruleId + "\nnew rule is:  " + rule + "\nnew kuli amount is: " + kuli);
                if(isNaN(kuli) == false){
                    msg.channel.send(JSONmodifyRule(ruleId, rule, kuli));
                } else {
                    msg.channel.send("Kuli amount has to be a number");
                }

            });
        }  else if(args[0] === 'tiedosto'){
            var string = JSONtoString();
            fs.writeFile('./test.txt', string, function(err) {
                if(err) return console.log(err);
                
            });
            const attachment = new MessageAttachment('./test.txt');
            msg.channel.send(`${msg.author}`, attachment);
        } 
    }

});
function JSONtoString(){
    var content = fs.readFileSync(rules);
    var a = JSON.parse(content);
    var string = '';
    a.forEach(function(x) {
        string += x.ruleID + ". " + x.rule + " = kulis " + x.amount + '\n';
    });
    return string;
}
function JSONnewRule(newRule, kuliNumber){
    var content = fs.readFileSync(rules);
    var JSONrule = JSON.parse(content);
    var lastNumber;
    
    JSONrule.forEach(function(x) {
        lastNumber = x.ruleID; 
     });
     lastNumber = lastNumber + 1;
    JSONrule.push({"ruleID": lastNumber,"rule": newRule, "amount": parseInt(kuliNumber, 10)});
    fs.writeFile('./rules.json',JSON.stringify(JSONrule, null, 2),'utf8', function(err) {
        if(err) return console.log(err);
        
    });
}

function JSONdeleteRule(){
    var content = fs.readFileSync(rules);
    var JSONrule = JSON.parse(content);
    i = 0;
    JSONrule.forEach(function(x){
       // console.log("Ennen poistoa: " + x.ruleID + " " +x.rule + " " + x.amount);
       console.log(x.ruleID);
        if(x.ruleID == 28){
           // console.log(i); 
            var y = x.ruleID;
            console.log(y);
            JSONrule.splice(y, 1);
           // console.log("Poiston jälkeen: " + x.ruleID + " " +x.rule + " " + x.amount);
        }
        i++;
    });
    fs.writeFile('./rules.json', JSON.stringify(JSONrule, null, 2),'utf8',function(err){
        if(err) return console.log(err);
        });
}
function JSONmodifyRule(id, newRule, newKuli){
    var content = fs.readFileSync(rules);
    var JSONrule = JSON.parse(content);
    var idExists = 0;
    var complete = "";
    JSONrule.forEach(function(x) {
        if(x.ruleID == id){
            x.rule = newRule;
            x.amount = parseInt(newKuli, 10);
            idExists = 1;
        }
    });
    if(idExists == 1){
        fs.writeFile('./rules.json', JSON.stringify(JSONrule, null, 2),'utf8',function(err){
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
    console.log('Robotti avasi oven');
});

client.login(token);