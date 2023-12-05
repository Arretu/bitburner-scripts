import {nMap} from "/scripts/local/nMap.js"
/** @param {NS} ns */
export async function main(ns, server) {

	//Prompt here to remind player to buy tor router.
	const hasTor = await ns.prompt("Have you bought the Tor router?")
	if(hasTor == false) {
		ns.tprint("Consider buying the Tor router before running this script. If you don't want to, just lie. I'm not your mum.");
		return;
	}

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
	ns.tprint("Running rootDaemon");
	ns.run("/scripts/daemons/rootDaemon.js",1);
	await ns.sleep(100);
	ns.tprint("Running targetDaemon");
	ns.run("/scripts/daemons/targetDaemon.js",1);
	await ns.sleep(100);
	ns.tprint("Running earlyHack")
	ns.run("/scripts/local/earlyhack.js");

	while (ns.getServerMoneyAvailable("home") < 5000000000) {
		ns.tprint("start.js- Insufficient funds to purchase servers, waiting.")
		await ns.sleep(5*60000);
	}
	ns.tprint("Running serverDaemon")
	ns.run("/scripts/daemons/serverDaemon.js");

	await ns.sleep(100);
	ns.tprint("Start script finished.");
}