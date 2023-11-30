import {nMap} from "/scripts/local/nMap.js"
/** @param {NS} ns */
export async function main(ns, server) {

	//Prompt here to remind player to buy tor router.

	//Delete data directory.
	ns.tprint("Deleting old data directory.")
	let fileList = ns.ls("home","data/");
	for(const file of fileList) {
		ns.rm(file,"home");
		ns.tprint(file," deleted.")
	}
	
	ns.tprint("All old files deleted. Generating new data.")
	//Create /data/static/npcHosts.txt - all servers excluding home and pServs.
	const allHosts = await nMap(ns);
	ns.tprint("Network scan complete. Discovered ",allHosts.length," servers.");

	//Generate static lists.
	const potentialHosts = [];
	const potentialTargets = [];

	for (const host of allHosts) {
		if (ns.getServerMaxRam(host) > 0) {
			potentialHosts.push(host);
		}
		if (ns.getServerMaxMoney(host) > 0) {
			potentialTargets.push(host);
		}
	}
	ns.write("/data/static/potentialHosts.txt", potentialHosts.toString(), "w");
	ns.write("/data/static/potentialTargets.txt", potentialTargets.toString(), "w");

	await ns.sleep(100);

	//Starts daemon to root servers and update rootedHosts.txt
	ns.run("/scripts/daemons/rootDaemon.js",1);

	//Starts daemon to analyze targets and write them to a file.
	ns.run("/scripts/daemons/targetDaemon.js",1);



}