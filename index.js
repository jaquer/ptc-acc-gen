// Requires
var Nightmare = require('nightmare');
var nicknames = require('./nicknames.json');
var fs = require('fs');

// Settings
var debug = false;
var showWindow = true;

// Start Config File Imports
var configFile = require('./config');
var start = configFile.startNum;
var end = configFile.endNum;
var useNicknamesFile = configFile.nicknameFile;
var useRandomPassword = configFile.randomPassword;
var screenshotResult = configFile.screenshotResult;
var screenshotFail = configFile.screenshotOnFailure;
var username = configFile.username;
var password = configFile.password;
var email_user = configFile.emailUser;
var email_domain = configFile.emailDomain;
var lat = configFile.latitude;
var lon = configFile.longitude;
var country = configFile.country;
var proxyServer = configFile.proxyServer;
var proxyUsername = configFile.proxyUsername;
var proxyPassword = configFile.proxyPassword;
// End Config File Imports

// Reports of changing this tossing errors so i didnt touch
var dob = "1990-01-01"; // Date of birth, yyyy-mm-dd

var outputFile = "PogoPlayer/accounts.csv"; // File which will contain the generated "username password" combinations.
var outputFormat = "ptc,%NICK%,%PASS%,%LAT%,%LON%,%UN%\r\n"; // Format used to save the account data in outputFile. Supports %NICK%, %PASS%.
var screenshotFolder = "output/screenshots/";

// App data
var url_ptc = "https://club.pokemon.com/us/pokemon-trainer-club/sign-up/";
var useragent = "Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/52.0.2743.116 Safari/537.36";
var nightmare_opts = {
    show: showWindow,
    waitTimeout: 10000,
    gotoTimeout: 5000,
    loadTimeout: 5000,
    switches: {
        'proxy-server': proxyServer
    }
};
// Prints nice little message
console.log("ptc-acc-gen v2.5.0 hotfix r3 by Sébastien Vercammen and Frost The Fox (and Github contribs)");


// Settings check
if (!useNicknamesFile && (username + end).length > 16) {
    console.log("Error: length of username + number can't be longer than 16 characters.");
    console.log("Please use a shorter nickname.");
    process.exit();
}

if ((email_user + '+' + username + end + '@' + email_domain).length > 75) {
    console.log("Error: length of e-mail address including the + trick can't be longer than 75 characters.");
    console.log("Please use a shorter e-mail address and/or nickname.");
    process.exit();
}

if (!useRandomPassword && password.length > 15) {
    console.log("Error: length of password can't be longer than 15 characters.");
    console.log("Please use a shorter password.");
    process.exit();
}

// LETSAHGO
var nightmare = Nightmare(nightmare_opts);
nightmare.useragent(useragent);

createAccount(start);

// Helpers

function handleError(err) {
    if(debug) {
        console.log("[DEBUG] Error:" + JSON.stringify(err));
    }
    
    return err;
}

function randomPassword() {
    return Math.random().toString(36).substr(2, 8);
}

function prepareNightmare(nightmare) {
    nightmare.useragent(useragent);
}

function randomPassword() {
    return Math.random().toString(36).substr(2, 8);
}

// Pages
function createAccount(ctr) {
    console.log("Creating account " + ctr + " of " + end);
    
    // Launch instance
    handleFirstPage(ctr);
}

// First page
function handleFirstPage(ctr) {
    if(debug) {
        console.log("[DEBUG] Handle first page #" + ctr);
    }
    
    nightmare
        .authentication(proxyUsername, proxyPassword)
        .goto(url_ptc)
        .evaluate(evaluateDobPage)
        .then(function(validated)  {
            if(!validated) {
                // Missing form data, loop over itself
                console.log("[" + ctr + "] Servers are acting up... Trying again.");
                return function() { nightmare.wait(500).refresh().wait(); handleFirstPage(ctr); };
            } else {
                return function() { fillFirstPage(ctr); };
            }
        })
        .then(function(next) {
            // Handle next step: either a loop to first page in case of error, or form fill on success
            return next();
        })
        .catch(handleError)
        .then(function(err) {
            if (typeof err !== "undefined") {
                return handleFirstPage(ctr);
            }
        });
}

function fillFirstPage(ctr) {
    if(debug) {
        console.log("[DEBUG] Fill first page #" + ctr);
    }
    
    nightmare.evaluate(function(data) {
            document.getElementById("id_dob").value = data.dob;
            
            var els = document.getElementsByName("id_country");
            for(var i = 0; i < els.length; i++) {
                els[i].value = data.country;
            }
            
            return document.getElementById("id_dob").value;
        }, { dob: dob, country: country })
        .click("form[name='verify-age'] [type=submit]")
        .wait("#id_username")
        .then(function() {
            handleSignupPage(ctr);
        })
        .catch(handleError)
        .then(function(err) {
            if (typeof err !== "undefined") {
                return handleFirstPage(ctr);
            }
        });
}

// Signup page
function handleSignupPage(ctr) {
    if(debug) {
        console.log("[DEBUG] Handle second page #" + ctr);
    }
    
    nightmare.evaluate(evaluateSignupPage)
        .then(function(validated) {
            if(!validated) {
                // Missing form data, loop over itself
                console.log("[" + ctr + "] Servers are acting up... Trying again.");
                return function() { nightmare.wait(500).refresh().wait(); handleFirstPage(ctr); };
            } else {
                return function() { fillSignupPage(ctr); };
            }
        }).then(function(next) {
            // Handle next step: either a loop to first page in case of error, or form fill on success
            return next();
        })
        .catch(handleError)
        .then(function(err) {
            if (typeof err !== "undefined") {
                return handleSignupPage(ctr);
            }
        });
}

function fillSignupPage(ctr) {
    if(debug) {
        console.log("[DEBUG] Fill signup page #" + ctr);
    }
    
    var _pass = password;
    var _nick = username + ctr;
    
    if(useRandomPassword) {
        _pass = randomPassword();
    }
    
    // Use nicknames list, or (username + number) combo?
    if(useNicknamesFile) {
        // Make sure we have a nickname left
        if(nicknames.length < 1) {
            throw Error("We're out of nicknames to use!");
        }
        
        // Get the first nickname off the list & use it
        _nick = nicknames.shift();
    }
    
    // Fill it all in
    nightmare.evaluate(function(data) {
            document.getElementById("id_password").value = data.pass;
            document.getElementById("id_confirm_password").value = data.pass;
            document.getElementById("id_email").value = data.email_user + "+" + data.nick + "@" + data.email_domain;
            document.getElementById("id_confirm_email").value = data.email_user + "+" + data.nick + "@" + data.email_domain;
            document.getElementById("id_screen_name").value = data.nick;
            document.getElementById("id_username").value = data.nick;
		window.scrollTo(0,document.body.scrollHeight);
        }, { "pass": _pass, "nick": _nick, "email_user": email_user, "email_domain": email_domain })
        .check("#id_terms")
        .wait(function() {
            return (document.getElementById("signup-signin") !== null || document.getElementById("btn-reset") !== null || document.body.textContent.indexOf("That username already exists") > -1);
        })
        .evaluate(function() {
            return (document.body.textContent.indexOf("Hello! Thank you for creating an account!") > -1);
        })
        .then(function(success) {
            if(success) {
                // Log it in the file of used nicknames
                var content = outputFormat.replace('%NICK%', _nick).replace('%PASS%', _pass).replace('%LAT%', lat).replace('%LON%', lon).replace('%UN%', _nick);
                fs.appendFile(outputFile, content, function(err) {
                    //
                });
            }
            
            if((success && screenshotResult) || screenshotFail) {
                // Screenshot
                nightmare.screenshot(screenshotFolder + _nick + ".png");
            }
            
            // Next one, or stop
            if(ctr < end) {
                return function() { createAccount(ctr + 1); };
            } else {
                return nightmare.end();
            }
        }).then(function(next) {
            return next();
        }).catch(handleError)
        .then(function(err) {
            if (typeof err !== "undefined") {
                return handleSignupPage(ctr);
            }
        });
}

// Evaluations
function evaluateDobPage() {
    var dob_value = document.getElementById("id_dob");
    return ((document.title === "The Official Pokémon Website | Pokemon.com") && (dob_value !== null));
}

function evaluateSignupPage() {
    var username_field = document.getElementById("id_username");
    return ((document.title === "The Official Pokémon Website | Pokemon.com") && (username_field !== null));
}
