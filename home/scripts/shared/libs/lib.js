
/* nap(x) - naps X seconds
 * pull - gets designated file string from home.
 * getPServers - returns personal servers as an array.
 * getPHServers - returns personal and home servers as an array
 * 

*/

/** @param {NS} ns */
//General

export async function hasFormulas(ns) {
	let hasFormula = ns.fileExists('Formulas.exe', 'home');
	return hasFormula;
}

//File Transfer
export async function pull(ns,file,client) {
	if(client == ""){
	client = ns.getHostname();
	}
	ns.exec('/scripts/local/fileserver.js', 'home', 1, file, client);
}

//Server Lists and data
export async function getPServers(ns) {
	const PServers = ns.getPurchasedServers();
	return PServers;
}
export async function getPHServers(ns) {
	const PHServers = getPServers(ns);
	PHServers.push('home');
	return PHServers;
}
export async function targetList(ns) {
	ns.exec()
}
export function getPenPower(ns) {
	let penpower = 0;
	if (ns.fileExists("BruteSSH.exe", "home")) {
		penpower++;
	}
	if (ns.fileExists('FTPCrack.exe', "home")) {
		penpower++;
	}
	if (ns.fileExists('relaySMTP.exe', 'home')) {
		penpower++;
	}
	if (ns.fileExists('HTTPWorm.exe', 'home')) {
		penpower++;
	}
	if (ns.fileExists('SQLInject.exe', 'home')) {
		penpower++;
	}
	return penpower;
}
export function getPenTools(ns) {
	const tools = [];
	if (ns.fileExists("BruteSSH.exe", "home")) {
		tools.push('ssh');
	}
	if (ns.fileExists('FTPCrack.exe', "home")) {
		tools.push('ftp');
	}
	if (ns.fileExists('relaySMTP.exe', 'home')) {
		tools.push('smtp');
	}
	if (ns.fileExists('HTTPWorm.exe', 'home')) {
		tools.push('http');
	}
	if (ns.fileExists('SQLInject.exe', 'home')) {
		tools.push('sql');
	}
	return tools;
}

//Remote hack, grow and weaken scripts.
export async function rGrow(ns, target, sleep, rand) {
	await ns.sleep(sleep);
	await ns.grow(target);
	return;
}
export async function rHack(ns, target, sleep, rand) {
	await ns.sleep(sleep);
	await ns.hack(target);
	return;
}
export async function rWeaken(ns, target, sleep, rand) {
	await ns.sleep(sleep);
	await ns.weaken(target);
	return;
}

//Random argument function
export async function getRandArg(ns) {
	let min = 573;
	let max = 2378;
	let randArg = Math.floor(Date.now() + (Math.random() * ((max - min) + min + 1)));
	return randArg;
}