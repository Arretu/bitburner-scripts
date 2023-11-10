/*	Library of hacking Functions
 *
 *
 * 
 * 
 * 
 * 
*/

/** @param {NS} ns */
export async function getPenPower(ns) {
	
	let penPower = 0;

	if(ns.fileExists("BruteSSH.exe","home")) {
		penPower++;
	}
	if(ns.fileExists("FTPCrack.exe","home")) {
		penPower++;
	}
	if(ns.fileExists("relaySMTP.exe","home")) {
		penPower++;
	}
	if(ns.fileExists("HTTPWorm.exe","home")) {
		penPower++;
	}
	if(ns.fileExists("SQLInject.exe","home")) {
		penPower++;
	}
	await ns.sleep(500);
	return penPower;
}

export async function getPenTools(ns){

	const penTools = [];

	if(ns.fileExists("BruteSSH.exe","home")) {
		penTools.push("ssh");
	}
	if(ns.fileExists("FTPCrack.exe","home")) {
		penTools.push("ftp");
	}
	if(ns.fileExists("relaySMTP.exe","home")) {
		penTools.push("smtp");
	}
	if(ns.fileExists("HTTPWorm.exe","home")) {
		penTools.push("http");
	}
	if(ns.fileExists("SQLInject.exe","home")) {
		penTools.push("sql");
	}
	await ns.sleep(500);
	return penTools;
}
