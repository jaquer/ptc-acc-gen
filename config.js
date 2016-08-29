var config = {
	// Starts gen from startNumber to endNumber, determining how many accounts are made
startNum:0,
endNum:10,
	
	// Creation Options
// Use nicknames file, or just append numbers to username?
nicknameFile:false,
 // If true generate a random password, If false set "password" field below
randomPassword:true,
// Saves a screenshot per account creation when set to true
screenshotResult:true,
// Saves a screenshot even if registration fails when set to true
screenshotOnFailure:true,
	
	// Creation Requirements
// Keep the '', User- & display name. Make sure any "(username + number)@domain.com" is 100% unique, and is 6 characters minimum, but under 14 characters after the numbers are applied.
username:"CHANGEME",
// If you set randomPassword to 'false' above change this to your chosen password (so you have same password for all accounts)
password:"CHANGEME",
// Enter your email address name. If your address is email@domain.com you'd enter 'email'
emailUser:"email",
// Domain of email address. If your address is email@domain.com  you'd enter 'domain.com'
emailDomain:"gmail.com",
// Location Latitude for initial login
latitude:"36.54596",
// Location Longitude for initial login
longitude:"-79.22247",
// Country code (e.g. BE, FR, US, CA)
country:"US",
// Proxy server to use (optional).
proxyServer:"",
proxyUsername:"",
proxyPassword:""
};

module.exports = config;
